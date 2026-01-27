package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.CalculatedHours;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.model.enums.TimeOffStatus;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final CalculatedHoursRepository calculatedHoursRepository;
    private final EmployeeRepository employeeRepository;
    private final TimeOffRequestRepository timeOffRequestRepository;

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

            // Fetch all calculated hours for the company in the date range
            List<CalculatedHours> hours = calculatedHoursRepository
                    .findByCompanyIdAndWorkDateBetweenOrderByWorkDateAsc(companyId, startDate, endDate);

            int rowNum = 1;
            for (CalculatedHours calculated : hours) {
                Row row = sheet.createRow(rowNum++);

                String status = "ABSENT";
                if (calculated.getLeaveHours() != null && !calculated.getLeaveHours().isZero()) {
                    status = "LEAVE";
                } else if (calculated.getTotalHoursWorked() != null && !calculated.getTotalHoursWorked().isZero()) {
                    status = "PRESENT";
                } else if (calculated.getPublicHolidayHours() != null && !calculated.getPublicHolidayHours().isZero()) {
                    status = "HOLIDAY";
                } else {
                    // Check for weekend
                    java.time.DayOfWeek day = calculated.getWorkDate().getDayOfWeek();
                    if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
                        status = "WEEKEND";
                    }
                }

                Employee employee = calculated.getEmployee();
                row.createCell(0).setCellValue(employee.getEmployeeCode());
                row.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());
                row.createCell(2).setCellValue(calculated.getWorkDate().format(DateTimeFormatter.ISO_LOCAL_DATE));
                row.createCell(3).setCellValue(status);
                row.createCell(4).setCellValue(formatDuration(calculated.getTotalHoursWorked()));
                row.createCell(5).setCellValue(formatDuration(calculated.getWeekdayHours()));
                row.createCell(6).setCellValue(formatDuration(calculated.getSaturdayHours()));
                row.createCell(7).setCellValue(formatDuration(calculated.getSundayHours()));
                row.createCell(8).setCellValue(formatDuration(calculated.getPublicHolidayHours()));

                // Apply data style
                for (int i = 0; i < headers.length; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
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

            // Create header style
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            // Employee info section
            Row infoRow1 = sheet.createRow(0);
            infoRow1.createCell(0).setCellValue("Employee Code:");
            infoRow1.createCell(1).setCellValue(employee.getEmployeeCode());

            Row infoRow2 = sheet.createRow(1);
            infoRow2.createCell(0).setCellValue("Employee Name:");
            infoRow2.createCell(1).setCellValue(employee.getFirstName() + " " + employee.getLastName());

            Row infoRow3 = sheet.createRow(2);
            infoRow3.createCell(0).setCellValue("Report Period:");
            infoRow3.createCell(1).setCellValue(startDate + " to " + endDate);

            // Create header row
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

            // 1. Fetch calculated hours (persisted)
            List<CalculatedHours> hours = new ArrayList<>(calculatedHoursRepository
                    .findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, startDate, endDate));

            // 2. Fetch Approved Leaves for the period
            List<TimeOffRequest> leaves = timeOffRequestRepository.findAll().stream()
                    .filter(req -> req.getEmployeeId().equals(employeeId)
                            && req.getStatus() == TimeOffStatus.APPROVED
                            && !req.getStartDate().isAfter(endDate)
                            && !req.getEndDate().isBefore(startDate))
                    .toList();

            // 3. Merge Leaves if no CalculatedHours exist for that date
            for (TimeOffRequest leave : leaves) {
                LocalDate start = leave.getStartDate().isBefore(startDate) ? startDate : leave.getStartDate();
                LocalDate end = leave.getEndDate().isAfter(endDate) ? endDate : leave.getEndDate();

                start.datesUntil(end.plusDays(1)).forEach(date -> {
                    boolean exists = hours.stream().anyMatch(h -> h.getWorkDate().equals(date));
                    if (!exists) {
                        // Create virtual CalculatedHours for the report
                        CalculatedHours virtual = CalculatedHours.builder()
                                .workDate(date)
                                .employee(employee)
                                .companyId(companyId)
                                .totalHoursWorked(Duration.ZERO)
                                .leaveHours(Duration.ofHours(8)) // Keep strict marking for Status logic
                                .build();
                        hours.add(virtual);
                    }
                });
            }

            // 4. Sort by Date
            hours.sort(Comparator.comparing(CalculatedHours::getWorkDate));

            int rowNum = 5;
            Duration totalWeekday = Duration.ZERO;
            Duration totalSaturday = Duration.ZERO;
            Duration totalSunday = Duration.ZERO;
            Duration totalHoliday = Duration.ZERO;
            // No totalLeave sum needed for display, as requested

            for (CalculatedHours calculated : hours) {
                Row row = sheet.createRow(rowNum++);

                String status = "ABSENT";
                if (calculated.getLeaveHours() != null && !calculated.getLeaveHours().isZero()) {
                    status = "LEAVE";
                } else if (calculated.getTotalHoursWorked() != null && !calculated.getTotalHoursWorked().isZero()) {
                    status = "PRESENT";
                } else if (calculated.getPublicHolidayHours() != null && !calculated.getPublicHolidayHours().isZero()) {
                    status = "HOLIDAY";
                } else {
                    java.time.DayOfWeek day = calculated.getWorkDate().getDayOfWeek();
                    if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
                        status = "WEEKEND";
                    }
                }

                row.createCell(0).setCellValue(calculated.getWorkDate().format(DateTimeFormatter.ISO_LOCAL_DATE));
                row.createCell(1).setCellValue(status);
                row.createCell(2).setCellValue(formatDuration(calculated.getTotalHoursWorked()));
                row.createCell(3).setCellValue(formatDuration(calculated.getWeekdayHours()));
                row.createCell(4).setCellValue(formatDuration(calculated.getSaturdayHours()));
                row.createCell(5).setCellValue(formatDuration(calculated.getSundayHours()));
                row.createCell(6).setCellValue(formatDuration(calculated.getPublicHolidayHours()));

                totalWeekday = totalWeekday.plus(calculated.getWeekdayHours());
                totalSaturday = totalSaturday.plus(calculated.getSaturdayHours());
                totalSunday = totalSunday.plus(calculated.getSundayHours());
                totalHoliday = totalHoliday.plus(calculated.getPublicHolidayHours());

                // Apply data style
                for (int i = 0; i < headers.length; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
            }

            // Add totals row
            Row totalRow = sheet.createRow(rowNum);
            CellStyle totalStyle = createTotalStyle(workbook);
            totalRow.createCell(0).setCellValue("TOTAL");
            totalRow.createCell(1).setCellValue(""); // Empty status for total
            // Sum of hours displayed (which excludes leave hours)
            totalRow.createCell(2).setCellValue(formatDuration(
                    totalWeekday.plus(totalSaturday).plus(totalSunday).plus(totalHoliday)));
            totalRow.createCell(3).setCellValue(formatDuration(totalWeekday));
            totalRow.createCell(4).setCellValue(formatDuration(totalSaturday));
            totalRow.createCell(5).setCellValue(formatDuration(totalSunday));
            totalRow.createCell(6).setCellValue(formatDuration(totalHoliday));

            for (int i = 0; i < headers.length; i++) {
                totalRow.getCell(i).setCellStyle(totalStyle);
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
            return "0:00";
        }
        long hours = duration.toHours();
        long minutes = duration.toMinutes() % 60;
        return String.format("%d:%02d", hours, minutes);
    }
}
