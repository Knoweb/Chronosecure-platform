package com.chronosecure.backend.controller;

import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.CompanyCalendar;
import com.chronosecure.backend.model.TimeOffRequest;
import com.chronosecure.backend.model.enums.CalendarDayType;
import com.chronosecure.backend.model.enums.TimeOffStatus;
import com.chronosecure.backend.repository.AttendanceLogRepository;
import com.chronosecure.backend.repository.CompanyCalendarRepository;
import com.chronosecure.backend.repository.TimeOffRequestRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
@Tag(name = "Calendar", description = "Company Calendar Management")
@CrossOrigin(origins = "http://localhost:5173")
public class CalendarController {

    private final CompanyCalendarRepository calendarRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final TimeOffRequestRepository timeOffRequestRepository;

    @Operation(summary = "Get calendar entries for a date range")
    @GetMapping
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<List<CompanyCalendar>> getCalendar(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(calendarRepository.findByCompanyIdAndDateBetween(companyId, startDate, endDate));
    }

    @Operation(summary = "Get combined calendar for specific employee")
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<List<EmployeeCalendarDayDto>> getEmployeeCalendar(
            @PathVariable UUID employeeId,
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {

        // 1. Fetch Company Calendar
        Map<LocalDate, CompanyCalendar> companyMap = calendarRepository
                .findByCompanyIdAndDateBetween(companyId, startDate, endDate).stream()
                .collect(Collectors.toMap(CompanyCalendar::getDate, c -> c));

        // 2. Fetch Time Off Requests (Approved)
        List<TimeOffRequest> leaves = timeOffRequestRepository.findAll().stream()
                .filter(req -> req.getEmployeeId().equals(employeeId)
                        && !req.getStartDate().isAfter(endDate)
                        && !req.getEndDate().isBefore(startDate)
                        && req.getStatus() == TimeOffStatus.APPROVED)
                .collect(Collectors.toList());

        // 3. Fetch Attendance Logs
        Map<LocalDate, List<AttendanceLog>> logsMap = attendanceLogRepository
                .findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(
                        employeeId,
                        startDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                        endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant())
                .stream()
                .collect(Collectors.groupingBy(
                        log -> LocalDateTime.ofInstant(log.getEventTimestamp(), ZoneId.systemDefault()).toLocalDate()));

        List<EmployeeCalendarDayDto> result = new ArrayList<>();
        LocalDate current = startDate;

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        while (!current.isAfter(endDate)) {
            EmployeeCalendarDayDto dto = EmployeeCalendarDayDto.builder()
                    .date(current)
                    .dayType(CalendarDayType.WORKING_DAY) // Default
                    .status("ABSENT") // Default
                    .build();

            // Apply Company Settings
            CompanyCalendar companyEntry = companyMap.get(current);
            boolean isHoliday = false;
            boolean isWeekend = false;
            if (companyEntry != null) {
                dto.setDayType(companyEntry.getType());
                dto.setPayMultiplier(companyEntry.getPayMultiplier());
                dto.setCompanyDescription(companyEntry.getDescription());
                if (companyEntry.getType() == CalendarDayType.HOLIDAY)
                    isHoliday = true;
                if (companyEntry.getType() == CalendarDayType.WEEKEND)
                    isWeekend = true;
            } else {
                // Default weekend logic
                java.time.DayOfWeek dow = current.getDayOfWeek();
                if (dow == java.time.DayOfWeek.SATURDAY || dow == java.time.DayOfWeek.SUNDAY) {
                    dto.setDayType(CalendarDayType.WEEKEND);
                    isWeekend = true;
                }
            }

            // Apply Leaves
            LocalDate finalCurrent = current;
            Optional<TimeOffRequest> leave = leaves.stream()
                    .filter(l -> !finalCurrent.isBefore(l.getStartDate()) && !finalCurrent.isAfter(l.getEndDate()))
                    .findFirst();

            if (leave.isPresent()) {
                dto.setStatus("LEAVE");
                dto.setLeaveReason(leave.get().getReason());
            }

            // Apply Attendance (Overrides Absent, but maybe shows with Leave? usually
            // Present overrides leave if they came in)
            List<AttendanceLog> logs = logsMap.get(current);
            if (logs != null && !logs.isEmpty()) {
                dto.setStatus("PRESENT");

                // Find First Clock In
                logs.stream()
                        .filter(l -> l
                                .getEventType() == com.chronosecure.backend.model.enums.AttendanceEventType.CLOCK_IN)
                        .findFirst()
                        .ifPresent(l -> dto.setCheckInTime(
                                LocalDateTime.ofInstant(l.getEventTimestamp(), ZoneId.systemDefault())
                                        .format(timeFormatter)));

                // Find Last Clock Out
                logs.stream()
                        .filter(l -> l
                                .getEventType() == com.chronosecure.backend.model.enums.AttendanceEventType.CLOCK_OUT)
                        .reduce((first, second) -> second)
                        .ifPresent(l -> dto.setCheckOutTime(
                                LocalDateTime.ofInstant(l.getEventTimestamp(), ZoneId.systemDefault())
                                        .format(timeFormatter)));
            } else {
                // No logs
                if (isHoliday)
                    dto.setStatus("HOLIDAY");
                else if (isWeekend)
                    dto.setStatus("WEEKEND");
                else if ("LEAVE".equals(dto.getStatus())) {
                    // Keep LEAVE status (don't overwrite with FUTURE or ABSENT)
                } else if (current.isAfter(LocalDate.now()))
                    dto.setStatus("FUTURE");
                else
                    dto.setStatus("ABSENT");
            }

            result.add(dto);
            current = current.plusDays(1);
        }

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Set configuration for specific dates (bulk)")
    @PostMapping
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<CompanyCalendar>> updateCalendar(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestBody BulkCalendarUpdateRequest request) {

        List<CompanyCalendar> updated = request.getDates().stream().map(date -> {
            CompanyCalendar entry = calendarRepository.findByCompanyIdAndDate(companyId, date)
                    .orElse(CompanyCalendar.builder()
                            .companyId(companyId)
                            .date(date)
                            .build());

            entry.setType(request.getType());
            entry.setPayMultiplier(request.getPayMultiplier());
            entry.setDescription(request.getDescription());
            return calendarRepository.save(entry);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(updated);
    }

    @Data
    public static class BulkCalendarUpdateRequest {
        private List<LocalDate> dates;
        private CalendarDayType type;
        private Double payMultiplier;
        private String description;
    }

    @Data
    @Builder
    public static class EmployeeCalendarDayDto {
        private LocalDate date;
        private CalendarDayType dayType;
        private String status; // PRESENT, ABSENT, LEAVE, HOLIDAY, WEEKEND, FUTURE
        private String checkInTime;
        private String checkOutTime;
        private String leaveReason;
        private Double payMultiplier;
        private String companyDescription;
    }
}
