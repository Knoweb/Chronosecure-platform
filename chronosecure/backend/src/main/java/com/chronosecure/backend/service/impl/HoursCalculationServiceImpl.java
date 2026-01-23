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
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public CalculatedHours calculateHoursForDate(UUID companyId, UUID employeeId, LocalDate date) {
        log.debug("Calculating hours for Employee: {} on Date: {}", employeeId, date);
        
        // Get start and end of day in UTC
        ZonedDateTime startOfDay = date.atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfDay = date.plusDays(1).atStartOfDay(ZoneId.systemDefault());
        Instant startInstant = startOfDay.toInstant();
        Instant endInstant = endOfDay.toInstant();
        
        // Fetch all attendance logs for this day
        List<AttendanceLog> logs = attendanceLogRepository
                .findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(
                        employeeId, startInstant, endInstant);
        
        // Fetch employee to ensure it exists
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        if (logs.isEmpty()) {
            // No attendance data for this day
            return CalculatedHours.builder()
                    .companyId(companyId)
                    .employee(employee)
                    .workDate(date)
                    .totalHoursWorked(Duration.ZERO)
                    .weekdayHours(Duration.ZERO)
                    .saturdayHours(Duration.ZERO)
                    .sundayHours(Duration.ZERO)
                    .publicHolidayHours(Duration.ZERO)
                    .build();
        }
        
        // Check if it's a public holiday
        boolean isHoliday = isPublicHoliday(companyId, date);
        
        // Determine day type
        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
        boolean isSaturday = dayOfWeek == java.time.DayOfWeek.SATURDAY;
        boolean isSunday = dayOfWeek == java.time.DayOfWeek.SUNDAY;
        
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
                    clockInTime = null;
                    break;
            }
        }
        
        // Net hours = Total worked - Breaks
        Duration netHours = totalWorked.minus(breakDuration);
        if (netHours.isNegative()) {
            netHours = Duration.ZERO;
        }
        
        // Categorize hours
        Duration weekdayHours = Duration.ZERO;
        Duration saturdayHours = Duration.ZERO;
        Duration sundayHours = Duration.ZERO;
        Duration publicHolidayHours = Duration.ZERO;
        
        if (isHoliday) {
            publicHolidayHours = netHours;
        } else if (isSaturday) {
            saturdayHours = netHours;
        } else if (isSunday) {
            sundayHours = netHours;
        } else {
            weekdayHours = netHours;
        }
        
        // Save or update calculated hours
        Optional<CalculatedHours> existing = calculatedHoursRepository
                .findByCompanyIdAndWorkDateBetweenOrderByWorkDateAsc(companyId, date, date)
                .stream()
                .filter(ch -> ch.getEmployee().getId().equals(employeeId))
                .findFirst();
        
        CalculatedHours calculatedHours;
        if (existing.isPresent()) {
            calculatedHours = existing.get();
            calculatedHours.setTotalHoursWorked(netHours);
            calculatedHours.setWeekdayHours(weekdayHours);
            calculatedHours.setSaturdayHours(saturdayHours);
            calculatedHours.setSundayHours(sundayHours);
            calculatedHours.setPublicHolidayHours(publicHolidayHours);
        } else {
            calculatedHours = CalculatedHours.builder()
                    .companyId(companyId)
                    .employee(employee)
                    .workDate(date)
                    .totalHoursWorked(netHours)
                    .weekdayHours(weekdayHours)
                    .saturdayHours(saturdayHours)
                    .sundayHours(sundayHours)
                    .publicHolidayHours(publicHolidayHours)
                    .build();
        }
        
        return calculatedHoursRepository.save(calculatedHours);
    }

    @Override
    @Transactional
    public List<CalculatedHours> recalculateHoursForRange(UUID companyId, UUID employeeId, LocalDate startDate, LocalDate endDate) {
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

