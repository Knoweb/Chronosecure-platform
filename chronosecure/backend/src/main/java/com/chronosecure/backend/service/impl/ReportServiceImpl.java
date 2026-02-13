package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.CalculatedHours;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.model.enums.AttendanceEventType;
import com.chronosecure.backend.model.enums.TimeOffStatus;
import com.chronosecure.backend.repository.AttendanceLogRepository;
import com.chronosecure.backend.repository.CalculatedHoursRepository;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.repository.TimeOffRequestRepository;
import com.chronosecure.backend.repository.CompanyRepository;
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
    private final CompanyRepository companyRepository;

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

            // --- 1. DETAILS SHEET ---
            Sheet detailSheet = workbook.createSheet("Daily Details");
            createDetailHeader(detailSheet, headerStyle);
            int detRowIdx = 1;

            // --- 2. MATRIX SHEET ---
            Sheet matrixSheet = workbook.createSheet("Monthly Matrix");
            // Create Matrix Header
            Row matrixHeader = matrixSheet.createRow(0);
            matrixHeader.createCell(0).setCellValue("Employee Code");
            matrixHeader.createCell(1).setCellValue("Employee Name");
            matrixHeader.getCell(0).setCellStyle(headerStyle);
            matrixHeader.getCell(1).setCellStyle(headerStyle);
            
            int colIdx = 2;
            for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
                Cell c = matrixHeader.createCell(colIdx++);
                c.setCellValue(d.getDayOfMonth() + " (" + d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + ")");
                c.setCellStyle(headerStyle);
            }
            Cell totalCell = matrixHeader.createCell(colIdx);
            totalCell.setCellValue("Total Hours");
            totalCell.setCellStyle(headerStyle);

            int matRowIdx = 1;

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

                Duration totalWorked = Duration.ZERO;
                
                // Matrix Row
                Row matrixRow = matrixSheet.createRow(matRowIdx++);
                matrixRow.createCell(0).setCellValue(employee.getEmployeeCode());
                matrixRow.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());
                int matrixCol = 2;

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
                        totalWorked = totalWorked.plus(dailyTotal);
                    }
                    
                    // --- POPULATE MATRIX CELL ---
                    Cell matCell = matrixRow.createCell(matrixCol++);
                    if ("PRESENT".equals(status)) {
                         matCell.setCellValue(formatDuration(dailyTotal)); // Show Hours
                    } else if ("LEAVE".equals(status)) {
                        matCell.setCellValue("L");
                        matCell.setCellStyle(headerStyle); // Use color style
                    } else if ("HOLIDAY".equals(status)) {
                         matCell.setCellValue("H");
                    } else if ("WEEKEND".equals(status)) {
                         matCell.setCellValue("W");
                    } else {
                         matCell.setCellValue("A"); // Absent
                    }
                    matCell.setCellStyle(dataStyle);

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
                
                // --- MATRIX TOTAL CELL ---
                Cell finalTotalCell = matrixRow.createCell(matrixCol);
                finalTotalCell.setCellValue(formatDuration(totalWorked));
                finalTotalCell.setCellStyle(dataStyle);
            }

            // --- 3. COST REPORT SHEET ---
            Sheet costSheet = workbook.createSheet("Cost Report");
            Row costHeader = costSheet.createRow(0);
            costHeader.createCell(0).setCellValue("Date");
            costHeader.createCell(1).setCellValue("Active Employees");
            costHeader.createCell(2).setCellValue("Daily Cost (AUD)");
            for(int i=0; i<3; i++) costHeader.getCell(i).setCellStyle(headerStyle);

            int costRowIdx = 1;
            double grandTotalCost = 0.0;

            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                int dailyCount = 0;
                // Count active employees for this date
                for (Employee emp : employees) {
                    Map<LocalDate, CalculatedHours> empHours = hoursMap.getOrDefault(emp.getId(), Collections.emptyMap());
                    CalculatedHours h = empHours.get(date);
                    
                    // Fallback to calculation if not found
                    if (h == null || (h.getTotalHoursWorked() == null || h.getTotalHoursWorked().isZero())) {
                        Map<LocalDate, List<AttendanceLog>> empLogs = logsMap.getOrDefault(emp.getId(), Collections.emptyMap());
                        CalculatedHours computed = calculateFromLogs(empLogs.get(date), date);
                        if (computed != null && !computed.getTotalHoursWorked().isZero()) {
                            dailyCount++;
                        }
                    } else {
                        // If CalculatedHours exists and total > 0
                        if (h.getTotalHoursWorked() != null && !h.getTotalHoursWorked().isZero()) {
                            dailyCount++;
                        }
                    }
                }

                // Calculate Cost
                double dailyCost = 0.0;
                if (dailyCount <= 3) {
                    dailyCost = 1.00; // Base fee covers 0-3 employees
                } else {
                    dailyCost = 1.00 + (dailyCount - 3) * 0.50;
                }
                grandTotalCost += dailyCost;

                // Write Row
                Row row = costSheet.createRow(costRowIdx++);
                row.createCell(0).setCellValue(date.format(DateTimeFormatter.ISO_LOCAL_DATE));
                row.createCell(1).setCellValue(dailyCount);
                row.createCell(2).setCellValue(String.format("$%.2f", dailyCost));
                
                for(int i=0; i<3; i++) row.getCell(i).setCellStyle(dataStyle);
            }

            // Grand Total Row
            Row totalRow = costSheet.createRow(costRowIdx);
            Cell lbl = totalRow.createCell(0); lbl.setCellValue("GRAND TOTAL"); lbl.setCellStyle(boldDataStyle);
            Cell empty = totalRow.createCell(1); empty.setCellStyle(boldDataStyle);
            Cell val = totalRow.createCell(2); val.setCellValue(String.format("$%.2f", grandTotalCost)); val.setCellStyle(boldDataStyle);

            // Auto-size columns
            for (int i = 0; i < 8; i++) detailSheet.autoSizeColumn(i);
            for (int i = 0; i <= colIdx; i++) matrixSheet.autoSizeColumn(i);
            for (int i = 0; i < 3; i++) costSheet.autoSizeColumn(i);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return new ByteArrayResource(outputStream.toByteArray());

        } catch (IOException e) {
            log.error("Error generating company report", e);
            throw new RuntimeException("Failed to generate report", e);
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
        log.info("Generating detailed employee report for Employee: {} from {} to {}", employeeId, startDate, endDate);
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Attendance Report");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle boldStyle = createDataStyle(workbook);
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            boldStyle.setFont(boldFont);

            // Row 0: Employee Code
            Row r0 = sheet.createRow(0); 
            r0.createCell(0).setCellValue("Employee Code:"); 
            r0.createCell(1).setCellValue(employee.getEmployeeCode());

            // Row 1: Employee Name
            Row r1 = sheet.createRow(1); 
            r1.createCell(0).setCellValue("Employee Name:"); 
            r1.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());

            // Row 2: Report Period
            Row r2 = sheet.createRow(2); 
            r2.createCell(0).setCellValue("Report Period:"); 
            r2.createCell(1).setCellValue(startDate + " to " + endDate);

            // Row 4: Header
            Row head = sheet.createRow(4);
            String[] headers = {"Date", "Status", "Total Hours", "Weekday Hours", "Saturday Hours", "Sunday Hours", "Public Holiday Hours"};
            for (int i = 0; i < headers.length; i++) { 
                Cell c = head.createCell(i); 
                c.setCellValue(headers[i]); 
                c.setCellStyle(headerStyle); 
            }

            // Fetch Data
            List<CalculatedHours> hoursList = calculatedHoursRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, startDate, endDate);
            Map<LocalDate, CalculatedHours> hoursMap = hoursList.stream().collect(Collectors.toMap(CalculatedHours::getWorkDate, h -> h));
            
            // Also fetch Logs to calculate on-the-fly if needed
            List<AttendanceLog> allLogs = attendanceLogRepository
                .findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(
                    employeeId, 
                    startDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                    endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
            
            Map<LocalDate, List<AttendanceLog>> logsMap = allLogs.stream()
                .collect(Collectors.groupingBy(l -> LocalDateTime.ofInstant(l.getEventTimestamp(), ZoneId.systemDefault()).toLocalDate()));

            // Totals
            Duration sumTotal = Duration.ZERO;
            Duration sumWeekday = Duration.ZERO;
            Duration sumSat = Duration.ZERO;
            Duration sumSun = Duration.ZERO;
            Duration sumHoliday = Duration.ZERO;

            int rowIdx = 5;
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                CalculatedHours h = hoursMap.get(date);
                if (h == null) {
                    h = calculateFromLogs(logsMap.get(date), date); // Attempt on-the-fly calculation
                }

                String status = "ABSENT";
                Duration total = Duration.ZERO;
                Duration weekday = Duration.ZERO;
                Duration sat = Duration.ZERO;
                Duration sun = Duration.ZERO;
                Duration holiday = Duration.ZERO;
                
                if (h != null) {
                    if (h.getTotalHoursWorked() != null) total = h.getTotalHoursWorked();
                    if (h.getWeekdayHours() != null) weekday = h.getWeekdayHours();
                    if (h.getSaturdayHours() != null) sat = h.getSaturdayHours();
                    if (h.getSundayHours() != null) sun = h.getSundayHours();
                    if (h.getPublicHolidayHours() != null) holiday = h.getPublicHolidayHours();

                    if (h.getLeaveHours() !=null && !h.getLeaveHours().isZero()) status = "LEAVE";
                    else if (!total.isZero()) status = "PRESENT";
                    else if (!holiday.isZero()) status = "HOLIDAY";
                }

                java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
                if ("ABSENT".equals(status) && (dayOfWeek == java.time.DayOfWeek.SATURDAY || dayOfWeek == java.time.DayOfWeek.SUNDAY)) {
                    status = "WEEKEND";
                }

                // Accumulate
                sumTotal = sumTotal.plus(total);
                sumWeekday = sumWeekday.plus(weekday);
                sumSat = sumSat.plus(sat);
                sumSun = sumSun.plus(sun);
                sumHoliday = sumHoliday.plus(holiday);

                // Write Row
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(date.format(DateTimeFormatter.ISO_LOCAL_DATE)); // Date only
                row.createCell(1).setCellValue(status);
                row.createCell(2).setCellValue(formatDuration(total));
                row.createCell(3).setCellValue(formatDuration(weekday));
                row.createCell(4).setCellValue(formatDuration(sat));
                row.createCell(5).setCellValue(formatDuration(sun));
                row.createCell(6).setCellValue(formatDuration(holiday));
                
                for(int i=0; i<7; i++) row.getCell(i).setCellStyle(dataStyle);
            }
            
            // Total Row
            Row totalRow = sheet.createRow(rowIdx);
            Cell tLabel = totalRow.createCell(0); tLabel.setCellValue("TOTAL"); tLabel.setCellStyle(boldStyle);
            Cell tEmpty = totalRow.createCell(1); tEmpty.setCellStyle(boldStyle); // Empty Status
            
            Cell tTot = totalRow.createCell(2); tTot.setCellValue(formatDuration(sumTotal)); tTot.setCellStyle(boldStyle);
            Cell tWk = totalRow.createCell(3); tWk.setCellValue(formatDuration(sumWeekday)); tWk.setCellStyle(boldStyle);
            Cell tSat = totalRow.createCell(4); tSat.setCellValue(formatDuration(sumSat)); tSat.setCellStyle(boldStyle);
            Cell tSun = totalRow.createCell(5); tSun.setCellValue(formatDuration(sumSun)); tSun.setCellStyle(boldStyle);
            Cell tHol = totalRow.createCell(6); tHol.setCellValue(formatDuration(sumHoliday)); tHol.setCellStyle(boldStyle);

            // Grey background for Total Row
            CellStyle greyStyle = workbook.createCellStyle();
            greyStyle.cloneStyleFrom(boldStyle);
            greyStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            greyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            for(int i=0; i<7; i++) totalRow.getCell(i).setCellStyle(greyStyle);

            for(int i=0; i<7; i++) sheet.autoSizeColumn(i);

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

        // Smart categorization based on day of week
        Duration wd = Duration.ZERO;
        Duration sa = Duration.ZERO;
        Duration su = Duration.ZERO;
        
        java.time.DayOfWeek day = date.getDayOfWeek();
        if (day == java.time.DayOfWeek.SATURDAY) sa = total;
        else if (day == java.time.DayOfWeek.SUNDAY) su = total;
        else wd = total;

        return CalculatedHours.builder()
                .workDate(date)
                .totalHoursWorked(total)
                .weekdayHours(wd)
                .saturdayHours(sa) 
                .sundayHours(su)
                .publicHolidayHours(Duration.ZERO)
                .leaveHours(Duration.ZERO)
                .build();
    }
    @Override
    public Resource generateCostReport(UUID companyId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating cost report for Company: {} from {} to {}", companyId, startDate, endDate);

        // Fetch Company Name
        String companyName = companyRepository.findById(companyId)
                .map(Company::getName)
                .orElse("Unknown Company");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Cost Summary");
            
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle boldStyle = createDataStyle(workbook);
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            boldStyle.setFont(boldFont);

            // Report Header Info
            // Row 0: "Period: [Start] - [End] Client Name: [Name]"
            Row r0 = sheet.createRow(0); 
            r0.createCell(0).setCellValue(
                String.format("Period: %s - %s   Client Name: %s", 
                startDate, endDate, companyName)
            );
            // Merge cells for header if needed, but for now just put in first cell

            // Table Header (Row 2)
            Row headerRow = sheet.createRow(2);
            String[] headers = {"Date", "Day", "Headcount", "Base Fee", "Usage Fee", "Daily Total (AUD)"};
            for(int i=0; i<headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            // Fetch All Logs for Period
            List<AttendanceLog> periodLogs = attendanceLogRepository.findByCompanyIdAndEventTimestampBetweenOrderByEventTimestampDesc(
                    companyId,
                    startDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                    endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()
            );

            // Group logs by Date
            Map<LocalDate, Set<UUID>> dailyActiveUsers = new HashMap<>();
            for (AttendanceLog log : periodLogs) {
                if (log.getEventType() == AttendanceEventType.CLOCK_IN) {
                    LocalDate date = LocalDateTime.ofInstant(log.getEventTimestamp(), ZoneId.systemDefault()).toLocalDate();
                    dailyActiveUsers.computeIfAbsent(date, k -> new HashSet<>()).add(log.getEmployee().getId());
                }
            }

            int rowIdx = 3;
            long grandHeadcount = 0;
            double grandBase = 0.0;
            double grandUsage = 0.0;
            double grandTotal = 0.0;

            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                Set<UUID> users = dailyActiveUsers.getOrDefault(date, Collections.emptySet());
                int count = users.size();

                // Pricing Logic
                double baseFee = 1.00; // Always apply base fee
                double usageFee = 0.0;
                if (count > 3) {
                    usageFee = (count - 3) * 0.50;
                }
                double dailyTotal = baseFee + usageFee;

                // Update Grands
                grandHeadcount += count;
                grandBase += baseFee;
                grandUsage += usageFee;
                grandTotal += dailyTotal;

                Row row = sheet.createRow(rowIdx++);
                // Col 0: Date
                row.createCell(0).setCellValue(date.format(DateTimeFormatter.ISO_LOCAL_DATE));
                // Col 1: Day
                row.createCell(1).setCellValue(date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH));
                // Col 2: Headcount
                row.createCell(2).setCellValue(count);
                // Col 3: Base Fee
                row.createCell(3).setCellValue(String.format("$%.2f", baseFee));
                // Col 4: Usage Fee
                row.createCell(4).setCellValue(String.format("$%.2f", usageFee));
                // Col 5: Daily Total (Bold)
                Cell totalCell = row.createCell(5);
                totalCell.setCellValue(String.format("$%.2f", dailyTotal));
                totalCell.setCellStyle(boldStyle); // Highlighting daily total

                // Apply normal style to others
                for(int i=0; i<5; i++) row.getCell(i).setCellStyle(dataStyle);
                // Re-apply border to total cell since boldStyle might miss borders if not cloned carefully
                // But boldStyle creates borders in createDataStyle so it is fine.
            }

            // Grand Total Row
            Row totalRow = sheet.createRow(rowIdx);
            
            // "Grand Total" label
            Cell lbl = totalRow.createCell(0); 
            lbl.setCellValue("Grand Total"); 
            lbl.setCellStyle(boldStyle);

            // Col 2: Total Headcount
            Cell cHead = totalRow.createCell(2);
            cHead.setCellValue(grandHeadcount);
            cHead.setCellStyle(boldStyle);

            // Col 3: Total Base
            Cell cBase = totalRow.createCell(3);
            cBase.setCellValue(String.format("$%.2f", grandBase));
            cBase.setCellStyle(boldStyle);

            // Col 4: Total Usage
            Cell cUsage = totalRow.createCell(4);
            cUsage.setCellValue(String.format("$%.2f", grandUsage));
            cUsage.setCellStyle(boldStyle);

            // Col 5: Grand Total
            Cell cTotal = totalRow.createCell(5);
            cTotal.setCellValue(String.format("$%.2f", grandTotal));
            cTotal.setCellStyle(boldStyle);

            // Apply style to empty cells to keep borders?
            totalRow.createCell(1).setCellStyle(boldStyle); // Day col empty

            // Auto-size columns
            for (int i = 0; i < 6; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return new ByteArrayResource(outputStream.toByteArray());

        } catch (IOException e) {
            log.error("Error generating cost report", e);
            throw new RuntimeException("Failed to generate report", e);
        }
    }
}
