package com.chronosecure.backend.service;

import com.chronosecure.backend.dto.AttendanceRequest;
import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.enums.AttendanceEventType;

import java.util.UUID;

public interface AttendanceService {

    // Core method to log an event
    AttendanceLog logAttendance(AttendanceRequest request);

    // Helper: Determine what the employee should do next (e.g., if last was
    // CLOCK_IN, next is BREAK/OUT)
    AttendanceEventType getNextExpectedEvent(UUID companyId, UUID employeeId);

    // Get logs for company within date range
    java.util.List<com.chronosecure.backend.dto.AttendanceLogResponse> getAttendanceLogs(UUID companyId,
            java.time.LocalDate startDate, java.time.LocalDate endDate);

    // Get dashboard stats for today
    java.util.Map<String, Object> getTodayStats(UUID companyId);
}
