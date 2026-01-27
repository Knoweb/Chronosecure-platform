package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.dto.AttendanceRequest;
import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.model.enums.AttendanceEventType;
import com.chronosecure.backend.model.enums.TimeOffStatus;
import com.chronosecure.backend.repository.AttendanceLogRepository;
import com.chronosecure.backend.repository.CompanyRepository;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.service.AttendanceService;
import com.chronosecure.backend.service.FileStorageService;
import com.chronosecure.backend.service.LivenessDetectionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceServiceImpl implements AttendanceService {

        private final AttendanceLogRepository attendanceLogRepository;
        private final EmployeeRepository employeeRepository;
        private final CompanyRepository companyRepository;
        private final com.chronosecure.backend.repository.TimeOffRequestRepository timeOffRequestRepository;
        private final FileStorageService fileStorageService;
        private final LivenessDetectionService livenessDetectionService;

        @Override
        @Transactional
        public AttendanceLog logAttendance(AttendanceRequest request) {
                log.info("Processing attendance request for Employee: {} at Company: {}", request.getEmployeeId(),
                                request.getCompanyId());

                // 1. Validate Company Exists
                Company company = companyRepository.findById(request.getCompanyId())
                                .orElseThrow(() -> new EntityNotFoundException("Company not found"));

                // 2. Validate Employee belongs to this Company (Strict Multi-Tenancy Check)
                Employee employee = employeeRepository.findByCompanyIdAndId(
                                request.getCompanyId(),
                                request.getEmployeeId()).orElseThrow(
                                                () -> new EntityNotFoundException(
                                                                "Employee not found or does not belong to this company"));

                // 3. Handle Photo Upload and Liveness Detection
                // Compliance: We store the URL, not the image in DB.
                String photoUrl = null;
                BigDecimal livenessScore = null;

                if (request.getPhotoBase64() != null && !request.getPhotoBase64().isEmpty()) {
                        // Perform liveness detection to prevent photo spoofing
                        if (livenessDetectionService.isAvailable()) {
                                double detectedScore = livenessDetectionService
                                                .detectLiveness(request.getPhotoBase64());
                                livenessScore = BigDecimal.valueOf(detectedScore);

                                // Reject if liveness score is too low (potential spoofing)
                                if (detectedScore < LivenessDetectionServiceImpl.getMinLivenessThreshold()) {
                                        log.warn("Liveness detection failed for employee {}: score {} below threshold {}",
                                                        employee.getId(), detectedScore,
                                                        LivenessDetectionServiceImpl.getMinLivenessThreshold());
                                        throw new IllegalArgumentException(
                                                        "Liveness detection failed. Please ensure you are present in front of the camera.");
                                }
                        }

                        // Upload photo only if liveness check passes (or if liveness is not available)
                        photoUrl = fileStorageService.uploadBase64Image(request.getPhotoBase64(), employee.getId(),
                                        "attendance");
                }

                // Use provided confidence score or detected liveness score
                BigDecimal confidenceScore = request.getConfidenceScore() != null
                                ? BigDecimal.valueOf(request.getConfidenceScore())
                                : livenessScore;

                // 4. Construct the Immutable Log
                AttendanceLog newLog = AttendanceLog.builder()
                                .companyId(company.getId())
                                .employee(employee)
                                .eventType(request.getEventType())
                                .eventTimestamp(Instant.now())
                                .deviceId(request.getDeviceId())
                                .photoUrl(photoUrl)
                                .confidenceScore(confidenceScore)
                                .isOfflineSync(false) // Defaulting to live online sync
                                .build();

                // 5. Save
                AttendanceLog savedLog = attendanceLogRepository.save(newLog);

                // 6. Invalidate Conflicting Time Off Requests (Auto-Reject if present)
                try {
                        java.time.LocalDate today = java.time.LocalDate.now();
                        List<com.chronosecure.backend.model.TimeOffRequest> conflictingRequests = timeOffRequestRepository
                                        .findByEmployeeIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                                        employee.getId(),
                                                        List.of(TimeOffStatus.PENDING, TimeOffStatus.APPROVED),
                                                        today,
                                                        today);

                        if (!conflictingRequests.isEmpty()) {
                                log.info("Found {} conflicting time-off requests for employee {}. Auto-rejecting.",
                                                conflictingRequests.size(), employee.getId());
                                for (com.chronosecure.backend.model.TimeOffRequest req : conflictingRequests) {
                                        req.setStatus(TimeOffStatus.REJECTED);
                                        // Optional: Append to reason to indicate system action, ensuring no null
                                        // pointer
                                        String currentReason = req.getReason() == null ? "" : req.getReason();
                                        req.setReason(currentReason + " [Auto-rejected: Attendance Logged]");
                                        timeOffRequestRepository.save(req);
                                }
                        }
                } catch (Exception e) {
                        log.error("Failed to auto-reject time off requests for employee {}", employee.getId(), e);
                        // Don't fail the attendance log just because this cleanup failed
                }

                return savedLog;
        }

        @Override
        public AttendanceEventType getNextExpectedEvent(UUID companyId, UUID employeeId) {
                // Fetch the very last log for this employee
                // Ideally, we limit this query to the last 24 hours to avoid full table scans,
                // but for now, we find the latest by timestamp.
                Instant startOfToday = Instant.now().minusSeconds(86400); // Simple 24h lookback

                List<AttendanceLog> logs = attendanceLogRepository
                                .findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(employeeId,
                                                startOfToday,
                                                Instant.now());

                if (logs.isEmpty()) {
                        return AttendanceEventType.CLOCK_IN;
                }

                AttendanceLog lastLog = logs.get(logs.size() - 1);

                // Simple State Machine Logic
                return switch (lastLog.getEventType()) {
                        case CLOCK_IN -> AttendanceEventType.BREAK_START; // Or CLOCK_OUT
                        case BREAK_START -> AttendanceEventType.BREAK_END;
                        case BREAK_END -> AttendanceEventType.CLOCK_OUT; // Or another BREAK_START
                        case CLOCK_OUT -> AttendanceEventType.CLOCK_IN;
                };
        }

        @Override
        public java.util.Map<String, Object> getTodayStats(UUID companyId) {
                // 1. Total Active Employees
                List<Employee> employees = employeeRepository.findByCompanyIdAndIsActiveTrue(companyId);
                long totalEmployees = employees.size();

                // 2. Fetch Today's Logs
                java.time.ZoneId zone = java.time.ZoneId.systemDefault();
                Instant start = java.time.LocalDate.now().atStartOfDay(zone).toInstant();
                Instant end = Instant.now();

                List<AttendanceLog> todayLogs = attendanceLogRepository
                                .findByCompanyIdAndEventTimestampBetweenOrderByEventTimestampDesc(companyId, start,
                                                end);

                // 3. Determine Status per Employee
                java.util.Map<UUID, AttendanceLog> latestLogMap = todayLogs.stream()
                                .collect(Collectors.groupingBy(l -> l.getEmployee().getId(),
                                                Collectors.collectingAndThen(
                                                                Collectors.maxBy(Comparator.comparing(
                                                                                AttendanceLog::getEventTimestamp)),
                                                                java.util.Optional::get)));

                long clockedInCount = 0;
                long clockedOutCount = 0; // People who were here today but are now out

                for (AttendanceLog log : latestLogMap.values()) {
                        if (log.getEventType() == AttendanceEventType.CLOCK_IN
                                        || log.getEventType() == AttendanceEventType.BREAK_END) {
                                clockedInCount++;
                        } else if (log.getEventType() == AttendanceEventType.CLOCK_OUT
                                        || log.getEventType() == AttendanceEventType.BREAK_START) {
                                clockedOutCount++;
                        }
                }

                java.util.Map<String, Object> stats = new java.util.HashMap<>();
                stats.put("totalEmployees", totalEmployees);
                stats.put("clockedIn", clockedInCount);
                stats.put("clockedOut", clockedOutCount); // "Clocked Out (Today)"

                // Count Pending Requests
                long pendingRequests = timeOffRequestRepository.countByCompanyIdAndStatus(companyId,
                                com.chronosecure.backend.model.enums.TimeOffStatus.PENDING);
                stats.put("pendingRequests", pendingRequests);

                return stats;
        }

        // --- Helpers ---

        @Override
        public List<com.chronosecure.backend.dto.AttendanceLogResponse> getAttendanceLogs(UUID companyId,
                        java.time.LocalDate startDate, java.time.LocalDate endDate) {
                // Convert LocalDate to Instant (Start of day / End of day in UTC or system
                // zone)
                // Ideally use company's time zone, but defaulting to system default/UTC for now
                java.time.ZoneId zone = java.time.ZoneId.systemDefault();
                Instant start = startDate.atStartOfDay(zone).toInstant();
                Instant end = endDate.plusDays(1).atStartOfDay(zone).toInstant();

                List<AttendanceLog> logs = attendanceLogRepository
                                .findByCompanyIdAndEventTimestampBetweenOrderByEventTimestampDesc(companyId, start,
                                                end);

                return logs.stream().map(log -> com.chronosecure.backend.dto.AttendanceLogResponse.builder()
                                .id(log.getId())
                                .employeeId(log.getEmployee().getId())
                                .employeeName(log.getEmployee().getFirstName() + " " + log.getEmployee().getLastName())
                                .employeeCode(log.getEmployee().getEmployeeCode())
                                .department(log.getEmployee().getDepartment())
                                .eventType(log.getEventType())
                                .eventTimestamp(log.getEventTimestamp())
                                .deviceId(log.getDeviceId())
                                .photoUrl(log.getPhotoUrl())
                                .confidenceScore(log.getConfidenceScore())
                                .isOfflineSync(log.isOfflineSync())
                                .build()).toList();
        }

}
