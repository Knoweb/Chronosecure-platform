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
            Sheet sheet = workbook.createSheet("Attendance Report");

            // Create header style
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "Employee Code", "Employee Name", "Date", "Status", "Total Hours",
                    "Weekday Hours", "Saturday Hours", "Sunday Hours", "Public Holiday Hours"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 1. Fetch All Data
            List<Employee> employees = employeeRepository.findByCompanyId(companyId);
            List<CalculatedHours> allHours = calculatedHoursRepository
                    .findByCompanyIdAndWorkDateBetweenOrderByWorkDateAsc(companyId, startDate, endDate);
            List<TimeOffRequest> allLeaves = timeOffRequestRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);

            // Fetch raw logs for fallback
            List<AttendanceLog> allLogs = attendanceLogRepository
                    .findByCompanyIdAndEventTimestampBetweenOrderByEventTimestampDesc(
                            companyId,
                            startDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                            endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

            // 2. Index Hours by Employee -> Date
            Map<UUID, Map<LocalDate, CalculatedHours>> hoursMap = new HashMap<>();
            for (CalculatedHours h : allHours) {
                hoursMap.computeIfAbsent(h.getEmployee().getId(), k -> new HashMap<>()).put(h.getWorkDate(), h);
            }

            // Index Logs by Employee -> Date
            Map<UUID, Map<LocalDate, List<AttendanceLog>>> logsMap = allLogs.stream()
                    .collect(Collectors.groupingBy(
                            l -> l.getEmployee().getId(),
                            Collectors.groupingBy(
                                    l -> LocalDateTime.ofInstant(l.getEventTimestamp(), ZoneId.systemDefault())
                                            .toLocalDate())));

            // 3. Iterate Employees -> Date Range to fill rows
            // Sort employees by Name for better report readability
            employees.sort(Comparator.comparing(Employee::getFirstName).thenComparing(Employee::getLastName));

            int rowNum = 1;
            for (Employee employee : employees) {
                Map<LocalDate, CalculatedHours> empHours = hoursMap.getOrDefault(employee.getId(),
                        Collections.emptyMap());
                Map<LocalDate, List<AttendanceLog>> empLogs = logsMap.getOrDefault(employee.getId(),
                        Collections.emptyMap());

                // Filter valid approved leaves for this employee overlapping the range
                List<TimeOffRequest> empLeaves = allLeaves.stream()
                        .filter(l -> l.getEmployee().getId().equals(employee.getId())
                                && l.getStatus() == TimeOffStatus.APPROVED
                                && !l.getStartDate().isAfter(endDate)
                                && !l.getEndDate().isBefore(startDate))
                        .collect(Collectors.toList());

                for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                    Row row = sheet.createRow(rowNum++);

                    // Get CalculatedHours or fallback to logs
                    CalculatedHours hours = empHours.get(date);
                    if (hours == null
                            || (hours.getTotalHoursWorked() == null || hours.getTotalHoursWorked().isZero())) {
                        CalculatedHours computed = calculateFromLogs(empLogs.get(date), date);
                        if (computed != null) {
                            hours = computed;
                        }
                    }

                    // Determine Status & Values
                    String status = "ABSENT";
                    Duration total = null, weekday = null, sat = null, sun = null, hol = null;

                    if (hours != null) {
                        total = hours.getTotalHoursWorked();
                        weekday = hours.getWeekdayHours();
                        sat = hours.getSaturdayHours();
                        sun = hours.getSundayHours();
                        hol = hours.getPublicHolidayHours();

                        if (hours.getLeaveHours() != null && !hours.getLeaveHours().isZero())
                            status = "LEAVE";
                        else if (total != null && !total.isZero())
                            status = "PRESENT";
                        else if (hol != null && !hol.isZero())
                            status = "HOLIDAY";
                    }

                    // If ABSENT check TimeOffRequests
                    final LocalDate currentDate = date;
                    boolean onLeave = empLeaves.stream().anyMatch(
                            l -> !currentDate.isBefore(l.getStartDate()) && !currentDate.isAfter(l.getEndDate()));

                    if (onLeave) {
                        status = "LEAVE";
                    } else if ("ABSENT".equals(status)) {
                        // Check Weekend
                        java.time.DayOfWeek day = date.getDayOfWeek();
                        if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
                            status = "WEEKEND";
                        }
                    }

                    // Write Cells
                    row.createCell(0).setCellValue(employee.getEmployeeCode());
                    row.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());
                    row.createCell(2).setCellValue(date.format(DateTimeFormatter.ISO_LOCAL_DATE));
                    row.createCell(3).setCellValue(status);
                    row.createCell(4).setCellValue(formatDuration(total));
                    row.createCell(5).setCellValue(formatDuration(weekday));
                    row.createCell(6).setCellValue(formatDuration(sat));
                    row.createCell(7).setCellValue(formatDuration(sun));
                    row.createCell(8).setCellValue(formatDuration(hol));

                    for (int i = 0; i < headers.length; i++) {
                        row.getCell(i).setCellStyle(dataStyle);
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);

            return new ByteArrayResource(outputStream.toByteArray());

        } catch (IOException e) {
            log.error("Error generating company report", e);
            throw new RuntimeException("Failed to generate report", e);
        }
    }

    @Override
    public Resource generateEmployeeReport(UUID companyId, UUID employeeId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating employee report for Employee: {} from {} to {}", employeeId, startDate, endDate);

        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Employee Attendance Report");

            // Styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle totalStyle = createTotalStyle(workbook);

            // Info Section
            Row infoRow1 = sheet.createRow(0);
            infoRow1.createCell(0).setCellValue("Employee Code:");
            infoRow1.createCell(1).setCellValue(employee.getEmployeeCode());

            Row infoRow2 = sheet.createRow(1);
            infoRow2.createCell(0).setCellValue("Employee Name:");
            infoRow2.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());

            Row infoRow3 = sheet.createRow(2);
            infoRow3.createCell(0).setCellValue("Report Period:");
            infoRow3.createCell(1).setCellValue(startDate + " to " + endDate);

            // Headers
            Row headerRow = sheet.createRow(4);
            String[] headers = {
                    "Date", "Status", "Total Hours", "Weekday Hours",
                    "Saturday Hours", "Sunday Hours", "Public Holiday Hours"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fetch Data
            List<CalculatedHours> hoursList = calculatedHoursRepository
                    .findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, startDate, endDate);
            Map<LocalDate, CalculatedHours> hoursMap = new HashMap<>();
            for (CalculatedHours h : hoursList)
                hoursMap.put(h.getWorkDate(), h);

            // Fetch Logs
            List<AttendanceLog> logs = attendanceLogRepository
                    .findByCompanyIdAndEventTimestampBetweenOrderByEventTimestampDesc(
                            companyId,
                            startDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                            endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant())
                    .stream()
                    .filter(l -> l.getEmployee().getId().equals(employeeId))
                    .collect(Collectors.toList());

            Map<LocalDate, List<AttendanceLog>> logsMap = logs.stream()
                    .collect(Collectors.groupingBy(
                            l -> LocalDateTime.ofInstant(l.getEventTimestamp(), ZoneId.systemDefault()).toLocalDate()));

            List<TimeOffRequest> leaves = timeOffRequestRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                    .stream()
                    .filter(req -> req.getEmployeeId().equals(employeeId)
                            && req.getStatus() == TimeOffStatus.APPROVED
                            && !req.getStartDate().isAfter(endDate)
                            && !req.getEndDate().isBefore(startDate))
                    .collect(Collectors.toList());

            // Iterate Date Range
            int rowNum = 5;
            Duration totalWeekday = Duration.ZERO;
            Duration totalSaturday = Duration.ZERO;
            Duration totalSunday = Duration.ZERO;
            Duration totalHoliday = Duration.ZERO;

            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                Row row = sheet.createRow(rowNum++);

                CalculatedHours hours = hoursMap.get(date);
                if (hours == null || (hours.getTotalHoursWorked() == null || hours.getTotalHoursWorked().isZero())) {
                    CalculatedHours computed = calculateFromLogs(logsMap.get(date), date);
                    if (computed != null) {
                        hours = computed;
                    }
                }

                String status = "ABSENT";
                Duration total = Duration.ZERO, weekday = Duration.ZERO, sat = Duration.ZERO, sun = Duration.ZERO,
                        hol = Duration.ZERO;

                if (hours != null) {
                    if (hours.getLeaveHours() != null && !hours.getLeaveHours().isZero())
                        status = "LEAVE";
                    else if (hours.getTotalHoursWorked() != null && !hours.getTotalHoursWorked().isZero())
                        status = "PRESENT";
                    else if (hours.getPublicHolidayHours() != null && !hours.getPublicHolidayHours().isZero())
                        status = "HOLIDAY";

                    total = hours.getTotalHoursWorked() != null ? hours.getTotalHoursWorked() : Duration.ZERO;
                    weekday = hours.getWeekdayHours() != null ? hours.getWeekdayHours() : Duration.ZERO;
                    sat = hours.getSaturdayHours() != null ? hours.getSaturdayHours() : Duration.ZERO;
                    sun = hours.getSundayHours() != null ? hours.getSundayHours() : Duration.ZERO;
                    hol = hours.getPublicHolidayHours() != null ? hours.getPublicHolidayHours() : Duration.ZERO;
                }

                // Check Leaves override
                final LocalDate currentDate = date;
                boolean onLeave = leaves.stream()
                        .anyMatch(l -> !currentDate.isBefore(l.getStartDate()) && !currentDate.isAfter(l.getEndDate()));

                if (onLeave)
                    status = "LEAVE";
                else if ("ABSENT".equals(status)) {
                    java.time.DayOfWeek day = date.getDayOfWeek();
                    if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
                        status = "WEEKEND";
                    }
                }

                row.createCell(0).setCellValue(date.format(DateTimeFormatter.ISO_LOCAL_DATE));
                row.createCell(1).setCellValue(status);
                row.createCell(2).setCellValue(formatDuration(total));
                row.createCell(3).setCellValue(formatDuration(weekday));
                row.createCell(4).setCellValue(formatDuration(sat));
                row.createCell(5).setCellValue(formatDuration(sun));
                row.createCell(6).setCellValue(formatDuration(hol));

                // Accumulate totals
                totalWeekday = totalWeekday.plus(weekday);
                totalSaturday = totalSaturday.plus(sat);
                totalSunday = totalSunday.plus(sun);
                totalHoliday = totalHoliday.plus(hol);

                for (int i = 0; i < headers.length; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
            }

            // Totals Row
            Row totalRow = sheet.createRow(rowNum);
            totalRow.createCell(0).setCellValue("TOTAL");
            totalRow.createCell(1).setCellValue("");
            totalRow.createCell(2).setCellValue(formatDuration(
                    totalWeekday.plus(totalSaturday).plus(totalSunday).plus(totalHoliday)));
            totalRow.createCell(3).setCellValue(formatDuration(totalWeekday));
            totalRow.createCell(4).setCellValue(formatDuration(totalSaturday));
            totalRow.createCell(5).setCellValue(formatDuration(totalSunday));
            totalRow.createCell(6).setCellValue(formatDuration(totalHoliday));

            for (int i = 0; i < headers.length; i++) {
                totalRow.getCell(i).setCellStyle(totalStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);

            return new ByteArrayResource(outputStream.toByteArray());

        } catch (IOException e) {
            log.error("Error generating employee report", e);
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

    private CellStyle createTotalStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
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

        // Find earliest IN and latest OUT
        Instant firstIn = logs.stream()
                .filter(l -> l.getEventType() == AttendanceEventType.CLOCK_IN)
                .map(AttendanceLog::getEventTimestamp)
                .min(Comparator.naturalOrder())
                .orElse(null);

        Instant lastOut = logs.stream()
                .filter(l -> l.getEventType() == AttendanceEventType.CLOCK_OUT)
                .map(AttendanceLog::getEventTimestamp)
                .max(Comparator.naturalOrder())
                .orElse(null); // If no Out, we cannot calculate duration properly yet?

        // If we have IN but no OUT, duration is 0 for report purposes (not yet
        // completed)
        // Or if we have OUT but no IN (error)

        Duration total = Duration.ZERO;
        if (firstIn != null && lastOut != null && lastOut.isAfter(firstIn)) {
            total = Duration.between(firstIn, lastOut);
        }

        // Allow fallback if duration is valid
        if (total.isZero() && firstIn == null)
            return null; // No relevant logs

        // Distribute based on Day
        Duration weekday = Duration.ZERO;
        Duration sat = Duration.ZERO;
        Duration sun = Duration.ZERO;

        java.time.DayOfWeek day = date.getDayOfWeek();
        if (day == java.time.DayOfWeek.SATURDAY)
            sat = total;
        else if (day == java.time.DayOfWeek.SUNDAY)
            sun = total;
        else
            weekday = total;

        return CalculatedHours.builder()
                .workDate(date)
                .totalHoursWorked(total)
                .weekdayHours(weekday)
                .saturdayHours(sat)
                .sundayHours(sun)
                .publicHolidayHours(Duration.ZERO)
                .leaveHours(Duration.ZERO)
                .build();
    }
}
