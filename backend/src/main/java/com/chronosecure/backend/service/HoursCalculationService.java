package com.chronosecure.backend.service;

import com.chronosecure.backend.model.CalculatedHours;
import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.PublicHoliday;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service for calculating work hours from attendance logs
 * Handles weekday, weekend, and public holiday differentiation
 */
public interface HoursCalculationService {
    
    /**
     * Calculate hours for a specific employee on a specific date
     * Differentiates between weekday, weekend, and public holiday hours
     */
    CalculatedHours calculateHoursForDate(UUID companyId, UUID employeeId, LocalDate date);
    
    /**
     * Recalculate hours for a date range (used by batch jobs)
     */
    List<CalculatedHours> recalculateHoursForRange(UUID companyId, UUID employeeId, LocalDate startDate, LocalDate endDate);
    
    /**
     * Check if a date is a public holiday for the company
     */
    boolean isPublicHoliday(UUID companyId, LocalDate date);
}

