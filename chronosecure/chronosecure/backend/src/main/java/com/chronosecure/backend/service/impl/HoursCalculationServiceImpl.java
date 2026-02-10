package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.CalculatedHours;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.model.PublicHoliday;
import com.chronosecure.backend.model.enums.AttendanceEventType;
import com.chronosecure.backend.repository.AttendanceLogRepository;
import com.chronosecure.backend.repository.CalculatedHoursRepository;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.repository.PublicHolidayRepository;
import com.chronosecure.backend.service.HoursCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HoursCalculationServiceImpl implements HoursCalculationService {

    private final AttendanceLogRepository attendanceLogRepository;
    private final CalculatedHoursRepository calculatedHoursRepository;
    private final PublicHolidayRepository publicHolidayRepository;
    private final com.chronosecure.backend.repository.CompanyCalendarRepository companyCalendarRepository;
    private final EmployeeRepository employeeRepository;
    private final com.chronosecure.backend.repository.TimeOffRequestRepository timeOffRequestRepository;

    @Override
    @Transactional
    public CalculatedHours calculateHoursForDate(UUID companyId, UUID employeeId, LocalDate date) {
        log.debug("Calculating hours for Employee: {} on Date: {}", employeeId, date);

        // --- CALENDAR CONFIGURATION ---
        com.chronosecure.backend.model.CompanyCalendar calendarEntry = companyCalendarRepository
                .findByCompanyIdAndDate(companyId, date).orElse(null);

        boolean isPublicHoliday = false;
        boolean isWeekend = false;
        double payMultiplier = 1.0;

        if (calendarEntry != null) {
            // Use custom configuration
            payMultiplier = calendarEntry.getPayMultiplier() != null ? calendarEntry.getPayMultiplier() : 1.0;
            switch (calendarEntry.getType()) {
                case HOLIDAY:
                    isPublicHoliday = true;
                    break;
                case WEEKEND:
                    isWeekend = true;
                    break;
                case WORKING_DAY:
                    // Explicitly marked as working day (overrides default weekend)
                    isWeekend = false;
                    isPublicHoliday = false;
                    break;
            }
        } else {
            // Fallback to default logic
            isPublicHoliday = isPublicHoliday(companyId, date); // Legacy check
            java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
            isWeekend = (dayOfWeek == java.time.DayOfWeek.SATURDAY || dayOfWeek == java.time.DayOfWeek.SUNDAY);
        }

        // ... (Rest of fetch logic)

        // Get start and end of day in UTC
        ZonedDateTime startOfDay = date.atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfDay = date.plusDays(1).atStartOfDay(ZoneId.systemDefault());
        Instant startInstant = startOfDay.toInstant();
        Instant endInstant = endOfDay.toInstant();

        // Fetch all attendance logs for this day
        List<AttendanceLog> logs = new ArrayList<>(attendanceLogRepository
                .findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(
                        employeeId, startInstant, endInstant));

        // --- MERGE CLOCK_OUT FROM TIME_OFF REQUESTS (User Requirement) ---
        List<com.chronosecure.backend.model.TimeOffRequest> timeOffs = timeOffRequestRepository.findAll().stream()
                .filter(req -> req.getEmployeeId().equals(employeeId)
                        && req.getStartDate().isEqual(date)
                        && req.getStatus() == com.chronosecure.backend.model.enums.TimeOffStatus.APPROVED)
                .collect(java.util.stream.Collectors.toList());

        for (com.chronosecure.backend.model.TimeOffRequest req : timeOffs) {
            // Synthesize CLOCK_OUT event
            // Assuming the request was created today for "now", but we only have date.
            // This is imperfect but satisfies the "Hide in Attendance" requirement if data
            // is missing.
            // Wait! The user decided to HIDE IN UI ONLY. Backend still has AttendanceLog.
            // So we DO NOT need to merge TimeOff here if FirebaseSyncService creates
            // AttendanceLog!
            // BUT: If the user deleted the logs, we might want this as backup.
            // I will skip complex merging if we assume FirebaseSyncService still creates
            // logs (which it does).
        }

        // ... (Sanity check employee)
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (logs.isEmpty()) {
            // Check for APPROVED Time Off Requests to credit Leave Hours
            List<com.chronosecure.backend.model.TimeOffRequest> approvedLeaves = timeOffRequestRepository.findAll()
                    .stream()
                    .filter(req -> req.getEmployeeId().equals(employeeId)
                            && req.getStatus() == com.chronosecure.backend.model.enums.TimeOffStatus.APPROVED
                            && (req.getStartDate().isBefore(date.plusDays(1))
                                    && req.getEndDate().isAfter(date.minusDays(1))))
                    .collect(java.util.stream.Collectors.toList());

            Duration leaveHours = Duration.ZERO;
            if (!approvedLeaves.isEmpty()) {
                // If on leave, credit standard 8 hours
                leaveHours = Duration.ofHours(8);
            }

            return calculatedHoursRepository.save(CalculatedHours.builder()
                    .companyId(companyId)
                    .employee(employee)
                    .workDate(date)
                    .totalHoursWorked(Duration.ZERO)
                    .weekdayHours(Duration.ZERO)
                    .saturdayHours(Duration.ZERO)
                    .sundayHours(Duration.ZERO)
                    .publicHolidayHours(Duration.ZERO)
                    .leaveHours(leaveHours)
                    .build());
        }

        // Logic ...

        // Reconstruct work sessions and calculate total hours
        Duration totalWorked = Duration.ZERO;
        Duration breakDuration = Duration.ZERO;

        Instant clockInTime = null;
        Instant lastBreakStart = null;

        for (AttendanceLog log : logs) {
            switch (log.getEventType()) {
                case CLOCK_IN:
                    clockInTime = log.getEventTimestamp();
                    break;
                case BREAK_START:
                    if (clockInTime != null) {
                        totalWorked = totalWorked.plus(Duration.between(clockInTime, log.getEventTimestamp()));
                    }
                    lastBreakStart = log.getEventTimestamp();
                    break;
                case BREAK_END:
                    if (lastBreakStart != null) {
                        breakDuration = breakDuration.plus(Duration.between(lastBreakStart, log.getEventTimestamp()));
                        clockInTime = log.getEventTimestamp(); // Resume work
                    }
                    break;
                case CLOCK_OUT:
                    if (clockInTime != null) {
                        totalWorked = totalWorked.plus(Duration.between(clockInTime, log.getEventTimestamp()));
                    }
                    clockInTime = null; // Shift ended
                    break;
            }
        }

        // Net hours
        Duration netHours = totalWorked.minus(breakDuration);
        if (netHours.isNegative())
            netHours = Duration.ZERO;

        // Categorize hours based on Calendar Config
        Duration weekdayHours = Duration.ZERO;
        Duration saturdayHours = Duration.ZERO;
        Duration sundayHours = Duration.ZERO;
        Duration publicHolidayHours = Duration.ZERO;

        if (isPublicHoliday) {
            publicHolidayHours = netHours;
        } else if (isWeekend) {
            // If manual calendar says "WEEKEND", determine if it's Sat or Sun for legacy
            // fields,
            // or just dump into Saturday if unspecified?
            // Ideally we should just use "Holiday/Weekend" bucket.
            // For now, respect day of week for specific fields.
            if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY)
                sundayHours = netHours;
            else
                saturdayHours = netHours;
        } else {
            weekdayHours = netHours;
        }

        // ... Save logic
        Optional<CalculatedHours> existing = calculatedHoursRepository
                .findByCompanyIdAndWorkDateBetweenOrderByWorkDateAsc(companyId, date, date)
                .stream()
                .filter(ch -> ch.getEmployee().getId().equals(employeeId))
                .findFirst();

        CalculatedHours calculatedHours;
        if (existing.isPresent()) {
            calculatedHours = existing.get();
        } else {
            calculatedHours = new CalculatedHours();
            calculatedHours.setCompanyId(companyId);
            calculatedHours.setEmployee(employee);
            calculatedHours.setWorkDate(date);
        }

        calculatedHours.setTotalHoursWorked(netHours);
        calculatedHours.setWeekdayHours(weekdayHours);
        calculatedHours.setSaturdayHours(saturdayHours);
        calculatedHours.setSundayHours(sundayHours);
        calculatedHours.setPublicHolidayHours(publicHolidayHours);
        calculatedHours.setLeaveHours(Duration.ZERO); // If presence detected, set leave to 0 (Override)

        return calculatedHoursRepository.save(calculatedHours);
    }

    @Override
    @Transactional
    public List<CalculatedHours> recalculateHoursForRange(UUID companyId, UUID employeeId, LocalDate startDate,
            LocalDate endDate) {
        List<CalculatedHours> results = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            CalculatedHours calculated = calculateHoursForDate(companyId, employeeId, currentDate);
            results.add(calculated);
            currentDate = currentDate.plusDays(1);
        }

        return results;
    }

    @Override
    public boolean isPublicHoliday(UUID companyId, LocalDate date) {
        return publicHolidayRepository.findByCompanyIdAndHolidayDate(companyId, date).isPresent();
    }
}
