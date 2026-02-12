package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.CalculatedHours;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.model.enums.AttendanceEventType;
import com.chronosecure.backend.model.enums.TimeOffStatus;
import com.chronosecure.backend.repository.AttendanceLogRepository;
import com.chronosecure.backend.repository.CalculatedHoursRepository;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.repository.TimeOffRequestRepository;
import com.chronosecure.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final CalculatedHoursRepository calculatedHoursRepository;
    private final EmployeeRepository employeeRepository;
    private final TimeOffRequestRepository timeOffRequestRepository;
    private final AttendanceLogRepository attendanceLogRepository;

    @Override
    public Resource generateCompanyReport(UUID companyId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating company report for Company: {} from {} to {}", companyId, startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook()) {
            
            // --- STYLES ---
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle boldDataStyle = createDataStyle(workbook);
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            boldDataStyle.setFont(boldFont);

            // --- 0. PREPARE DATA ---
            List<Employee> employees = employeeRepository.findByCompanyId(companyId);
            employees.sort(Comparator.comparing(Employee::getFirstName).thenComparing(Employee::getLastName));

            List<CalculatedHours> allHours = calculatedHoursRepository
                    .findByCompanyIdAndWorkDateBetweenOrderByWorkDateAsc(companyId, startDate, endDate);
            
            List<TimeOffRequest> allLeaves = timeOffRequestRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);

            // Fetch raw logs for Check-In/Out times
            List<AttendanceLog> allLogs = attendanceLogRepository
                    .findByCompanyIdAndEventTimestampBetweenOrderByEventTimestampDesc(
                            companyId,
                            startDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                            endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

            // Indexing Data
            Map<UUID, Map<LocalDate, CalculatedHours>> hoursMap = new HashMap<>();
            for (CalculatedHours h : allHours) {
                hoursMap.computeIfAbsent(h.getEmployee().getId(), k -> new HashMap<>()).put(h.getWorkDate(), h);
            }

            Map<UUID, Map<LocalDate, List<AttendanceLog>>> logsMap = allLogs.stream()
                    .collect(Collectors.groupingBy(
                            l -> l.getEmployee().getId(),
                            Collectors.groupingBy(
                                    l -> LocalDateTime.ofInstant(l.getEventTimestamp(), ZoneId.systemDefault())
                                            .toLocalDate())));

            // --- 1. SUMMARY SHEET ---
            Sheet summarySheet = workbook.createSheet("Summary");
            createSummaryHeader(summarySheet, headerStyle);
            int sumRowIdx = 1;

            // --- 2. DETAILS SHEET ---
            Sheet detailSheet = workbook.createSheet("Daily Details");
            createDetailHeader(detailSheet, headerStyle);
            int detRowIdx = 1;

            // --- PROCESS EMPLOYEES ---
            for (Employee employee : employees) {
                Map<LocalDate, CalculatedHours> empHours = hoursMap.getOrDefault(employee.getId(), Collections.emptyMap());
                Map<LocalDate, List<AttendanceLog>> empLogs = logsMap.getOrDefault(employee.getId(), Collections.emptyMap());

                // Filter Leaves
                List<TimeOffRequest> empLeaves = allLeaves.stream()
                        .filter(l -> l.getEmployee().getId().equals(employee.getId())
                                && l.getStatus() == TimeOffStatus.APPROVED
                                && !l.getStartDate().isAfter(endDate)
                                && !l.getEndDate().isBefore(startDate))
                        .collect(Collectors.toList());

                // Aggregators for Summary
                int daysPresent = 0;
                int daysAbsent = 0;
                int daysLeave = 0;
                Duration totalWorked = Duration.ZERO;

                for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                    // --- DETERMINE STATUS & HOURS ---
                    CalculatedHours hours = empHours.get(date);
                    if (hours == null || (hours.getTotalHoursWorked() == null || hours.getTotalHoursWorked().isZero())) {
                        CalculatedHours computed = calculateFromLogs(empLogs.get(date), date);
                        if (computed != null) hours = computed;
                    }

                    String status = "ABSENT";
                    Duration dailyTotal = Duration.ZERO;
                    String checkInStr = "-";
                    String checkOutStr = "-";

                    // Determine basic status from existence of Hours
                    if (hours != null) {
                        dailyTotal = hours.getTotalHoursWorked() != null ? hours.getTotalHoursWorked() : Duration.ZERO;
                        
                        if (hours.getLeaveHours() != null && !hours.getLeaveHours().isZero()) status = "LEAVE";
                        else if (!dailyTotal.isZero()) status = "PRESENT";
                        else if (hours.getPublicHolidayHours() != null && !hours.getPublicHolidayHours().isZero()) status = "HOLIDAY";
                    }

                    // Leave Override
                    final LocalDate currentDate = date;
                    boolean onLeave = empLeaves.stream().anyMatch(
                            l -> !currentDate.isBefore(l.getStartDate()) && !currentDate.isAfter(l.getEndDate()));
                    if (onLeave) status = "LEAVE";

                    // Weekend Check for Absent
                    java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
                    boolean isWeekend = (dayOfWeek == java.time.DayOfWeek.SATURDAY || dayOfWeek == java.time.DayOfWeek.SUNDAY);
                    
                    if ("ABSENT".equals(status) && isWeekend) {
                        status = "WEEKEND";
                    }

                    // Get Check In/Out Times from logs
                    List<AttendanceLog> dailyLogs = empLogs.get(date);
                    if (dailyLogs != null && !dailyLogs.isEmpty()) {
                        Instant firstIn = dailyLogs.stream()
                                .filter(l -> l.getEventType() == AttendanceEventType.CLOCK_IN)
                                .map(AttendanceLog::getEventTimestamp)
                                .min(Comparator.naturalOrder()).orElse(null);
                        Instant lastOut = dailyLogs.stream()
                                .filter(l -> l.getEventType() == AttendanceEventType.CLOCK_OUT)
                                .map(AttendanceLog::getEventTimestamp)
                                .max(Comparator.naturalOrder()).orElse(null);

                        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault());
                        if (firstIn != null) checkInStr = timeFmt.format(firstIn);
                        if (lastOut != null) checkOutStr = timeFmt.format(lastOut);
                    }

                    // Update Aggregators
                    if ("PRESENT".equals(status)) {
                        daysPresent++;
                        totalWorked = totalWorked.plus(dailyTotal);
                    } else if ("LEAVE".equals(status)) {
                        daysLeave++;
                    } else if ("ABSENT".equals(status)) {
                        daysAbsent++;
                    }

                    // --- WRITE DETAIL ROW ---
                    Row row = detailSheet.createRow(detRowIdx++);
                    row.createCell(0).setCellValue(employee.getEmployeeCode());
                    row.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());
                    row.createCell(2).setCellValue(date.format(DateTimeFormatter.ISO_LOCAL_DATE));
                    row.createCell(3).setCellValue(dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                    row.createCell(4).setCellValue(status);
                    row.createCell(5).setCellValue(checkInStr);
                    row.createCell(6).setCellValue(checkOutStr);
                    row.createCell(7).setCellValue(formatDuration(dailyTotal));

                    for (int i = 0; i < 8; i++) {
                        Cell c = row.getCell(i);
                        if (c != null) c.setCellStyle(dataStyle);
                    }
                }
                
                // --- WRITE SUMMARY ROW ---
                Row sumRow = summarySheet.createRow(sumRowIdx++);
                sumRow.createCell(0).setCellValue(employee.getEmployeeCode());
                sumRow.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());
                sumRow.createCell(2).setCellValue(daysPresent);
                sumRow.createCell(3).setCellValue(daysAbsent);
                sumRow.createCell(4).setCellValue(daysLeave);
                sumRow.createCell(5).setCellValue(formatDuration(totalWorked));
                
                for(int i=0; i<6; i++) {
                    Cell c = sumRow.getCell(i);
                    if(c != null) c.setCellStyle(dataStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < 6; i++) summarySheet.autoSizeColumn(i);
            for (int i = 0; i < 8; i++) detailSheet.autoSizeColumn(i);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return new ByteArrayResource(outputStream.toByteArray());

        } catch (IOException e) {
            log.error("Error generating company report", e);
            throw new RuntimeException("Failed to generate report", e);
        }
    }

    private void createSummaryHeader(Sheet sheet, CellStyle style) {
        Row row = sheet.createRow(0);
        String[] headers = {"Code", "Employee Name", "Present Days", "Absent Days", "Leave Days", "Total Hours"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void createDetailHeader(Sheet sheet, CellStyle style) {
        Row row = sheet.createRow(0);
        String[] headers = {"Code", "Employee Name", "Date", "Day", "Status", "Check In", "Check Out", "Total Hours"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    @Override
    public Resource generateEmployeeReport(UUID companyId, UUID employeeId, LocalDate startDate, LocalDate endDate) {
        // Simplified Employee Report to match new style
        log.info("Generating employee report for Employee: {} from {} to {}", employeeId, startDate, endDate);
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Attendance Report");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            // Info
            Row r0 = sheet.createRow(0); r0.createCell(0).setCellValue("Employee:"); r0.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());
            Row r1 = sheet.createRow(1); r1.createCell(0).setCellValue("Code:"); r1.createCell(1).setCellValue(employee.getEmployeeCode());
            Row r2 = sheet.createRow(2); r2.createCell(0).setCellValue("Period:"); r2.createCell(1).setCellValue(startDate + " to " + endDate);

            // Header
            Row head = sheet.createRow(4);
            String[] headers = {"Date", "Day", "Status", "Total Hours"};
            for (int i = 0; i < headers.length; i++) { Cell c = head.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle); }

            List<CalculatedHours> hoursList = calculatedHoursRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, startDate, endDate);
            Map<LocalDate, CalculatedHours> hoursMap = hoursList.stream().collect(Collectors.toMap(CalculatedHours::getWorkDate, h -> h));

            int rowIdx = 5;
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                CalculatedHours h = hoursMap.get(date);
                String status = "ABSENT";
                Duration total = Duration.ZERO;
                
                if (h != null) {
                    if (h.getTotalHoursWorked() != null) total = h.getTotalHoursWorked();
                    if (h.getLeaveHours() !=null && !h.getLeaveHours().isZero()) status = "LEAVE";
                    else if (!total.isZero()) status = "PRESENT";
                    else if (h.getPublicHolidayHours() != null && !h.getPublicHolidayHours().isZero()) status = "HOLIDAY";
                }

                java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
                if ("ABSENT".equals(status) && (dayOfWeek == java.time.DayOfWeek.SATURDAY || dayOfWeek == java.time.DayOfWeek.SUNDAY)) {
                    status = "WEEKEND";
                }

                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(date.format(DateTimeFormatter.ISO_LOCAL_DATE));
                row.createCell(1).setCellValue(dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                row.createCell(2).setCellValue(status);
                row.createCell(3).setCellValue(formatDuration(total));
                
                for(int i=0; i<4; i++) row.getCell(i).setCellStyle(dataStyle);
            }
            
            for(int i=0; i<4; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return new ByteArrayResource(outputStream.toByteArray());

        } catch (IOException e) {
             throw new RuntimeException("Failed to generate report", e);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private String formatDuration(Duration duration) {
        if (duration == null || duration.isZero()) {
            return "0h 0m";
        }
        long hours = duration.toHours();
        long minutes = duration.toMinutes() % 60;
        return String.format("%dh %dm", hours, minutes);
    }

    private CalculatedHours calculateFromLogs(List<AttendanceLog> logs, LocalDate date) {
        if (logs == null || logs.isEmpty())
            return null;

        Instant firstIn = logs.stream()
                .filter(l -> l.getEventType() == AttendanceEventType.CLOCK_IN)
                .map(AttendanceLog::getEventTimestamp)
                .min(Comparator.naturalOrder())
                .orElse(null);

        Instant lastOut = logs.stream()
                .filter(l -> l.getEventType() == AttendanceEventType.CLOCK_OUT)
                .map(AttendanceLog::getEventTimestamp)
                .max(Comparator.naturalOrder())
                .orElse(null);

        Duration total = Duration.ZERO;
        if (firstIn != null && lastOut != null && lastOut.isAfter(firstIn)) {
            total = Duration.between(firstIn, lastOut);
        }

        if (total.isZero() && firstIn == null)
            return null;

        // Simplified calculation - Just Total
        return CalculatedHours.builder()
                .workDate(date)
                .totalHoursWorked(total)
                .weekdayHours(total) // Fallback
                .saturdayHours(Duration.ZERO) 
                .sundayHours(Duration.ZERO)
                .publicHolidayHours(Duration.ZERO)
                .leaveHours(Duration.ZERO)
                .build();
    }
}
