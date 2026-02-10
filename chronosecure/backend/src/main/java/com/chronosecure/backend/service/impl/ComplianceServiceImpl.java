package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.*;
import com.chronosecure.backend.model.enums.AttendanceEventType;
import com.chronosecure.backend.repository.*;
import com.chronosecure.backend.service.ComplianceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Compliance Service Implementation
 * Handles GDPR, BIPA, and APPI compliance requirements
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplianceServiceImpl implements ComplianceService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final CalculatedHoursRepository calculatedHoursRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> exportEmployeeData(UUID companyId, UUID employeeId) {
        log.info("Exporting employee data for GDPR compliance - Employee: {}", employeeId);
        
        // APPI Compliance: Log data access
        logDataAccess(null, companyId, "EXPORT_EMPLOYEE_DATA", "EMPLOYEE", employeeId, 
                null, null, Map.of("reason", "GDPR Data Portability Request"));
        
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Fetch all related data
        List<AttendanceLog> attendanceLogs = attendanceLogRepository
                .findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(
                        employeeId, Instant.ofEpochMilli(0), Instant.now());
        
        List<CalculatedHours> calculatedHours = calculatedHoursRepository
                .findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(
                        employeeId, java.time.LocalDate.of(2000, 1, 1), java.time.LocalDate.now());
        
        List<ConsentRecord> consentRecords = consentRecordRepository
                .findByEmployeeId(employeeId);
        
        // Build export data structure
        Map<String, Object> exportData = new HashMap<>();
        exportData.put("employee", Map.of(
                "id", employee.getId().toString(),
                "employeeCode", employee.getEmployeeCode(),
                "firstName", employee.getFirstName(),
                "lastName", employee.getLastName(),
                "email", employee.getEmail() != null ? employee.getEmail() : "",
                "department", employee.getDepartment() != null ? employee.getDepartment() : "",
                "createdAt", employee.getCreatedAt().toString(),
                "updatedAt", employee.getUpdatedAt().toString()
        ));
        
        exportData.put("attendanceLogs", attendanceLogs.stream()
                .map(log -> Map.of(
                        "id", log.getId().toString(),
                        "eventType", log.getEventType().toString(),
                        "eventTimestamp", log.getEventTimestamp().toString(),
                        "photoUrl", log.getPhotoUrl() != null ? log.getPhotoUrl() : "",
                        "deviceId", log.getDeviceId() != null ? log.getDeviceId() : ""
                ))
                .collect(Collectors.toList()));
        
        exportData.put("calculatedHours", calculatedHours.stream()
                .map(hours -> Map.of(
                        "workDate", hours.getWorkDate().toString(),
                        "totalHoursWorked", hours.getTotalHoursWorked().toString(),
                        "weekdayHours", hours.getWeekdayHours().toString(),
                        "saturdayHours", hours.getSaturdayHours().toString(),
                        "sundayHours", hours.getSundayHours().toString(),
                        "publicHolidayHours", hours.getPublicHolidayHours().toString()
                ))
                .collect(Collectors.toList()));
        
        exportData.put("consentRecords", consentRecords.stream()
                .map(consent -> Map.of(
                        "consentType", consent.getConsentType(),
                        "granted", consent.isGranted(),
                        "grantedAt", consent.getGrantedAt() != null ? consent.getGrantedAt().toString() : "",
                        "revokedAt", consent.getRevokedAt() != null ? consent.getRevokedAt().toString() : ""
                ))
                .collect(Collectors.toList()));
        
        exportData.put("exportDate", Instant.now().toString());
        exportData.put("complianceStandard", "GDPR Article 20 - Right to Data Portability");
        
        return exportData;
    }

    @Override
    @Transactional
    public void hardDeleteEmployeeData(UUID companyId, UUID employeeId) {
        log.warn("Performing GDPR hard delete for Employee: {} at Company: {}", employeeId, companyId);
        
        // APPI Compliance: Log deletion
        logDataAccess(null, companyId, "HARD_DELETE_EMPLOYEE_DATA", "EMPLOYEE", employeeId,
                null, null, Map.of("reason", "GDPR Right to be Forgotten"));
        
        // Verify employee belongs to company
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Delete all related data (cascade should handle most, but we're explicit for GDPR)
        // Note: BIPA Compliance - We should NOT delete consent records, but mark them as revoked
        List<ConsentRecord> consents = consentRecordRepository.findByEmployeeId(employeeId);
        for (ConsentRecord consent : consents) {
            if (consent.isGranted()) {
                consent.setGranted(false);
                consent.setRevokedAt(Instant.now());
                consentRecordRepository.save(consent);
            }
        }
        
        // Delete calculated hours
        calculatedHoursRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(
                employeeId, java.time.LocalDate.of(2000, 1, 1), java.time.LocalDate.now())
                .forEach(calculatedHoursRepository::delete);
        
        // Delete attendance logs
        attendanceLogRepository.findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(
                employeeId, Instant.ofEpochMilli(0), Instant.now())
                .forEach(attendanceLogRepository::delete);
        
        // Finally, delete the employee record
        // BIPA Compliance: Clear biometric data (fingerprint hash) before deletion
        employee.setFingerprintTemplateHash(null);
        employee.setPinHash(null);
        employeeRepository.save(employee);
        employeeRepository.delete(employee);
        
        log.info("GDPR hard delete completed for Employee: {}", employeeId);
    }

    @Override
    @Transactional
    public ConsentRecord grantBiometricConsent(UUID employeeId, String ipAddress, String userAgent) {
        log.info("Granting biometric consent for Employee: {}", employeeId);
        
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        // Revoke any existing consent first
        List<ConsentRecord> existing = consentRecordRepository.findByEmployeeId(employeeId);
        for (ConsentRecord record : existing) {
            if (record.getConsentType().equals("BIOMETRIC") && record.isGranted()) {
                record.setGranted(false);
                record.setRevokedAt(Instant.now());
                consentRecordRepository.save(record);
            }
        }
        
        // Create new consent record
        ConsentRecord consent = ConsentRecord.builder()
                .employeeId(employeeId)
                .consentType("BIOMETRIC")
                .granted(true)
                .grantedAt(Instant.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        
        return consentRecordRepository.save(consent);
    }

    @Override
    @Transactional
    public void revokeBiometricConsent(UUID employeeId) {
        log.info("Revoking biometric consent for Employee: {}", employeeId);
        
        List<ConsentRecord> consents = consentRecordRepository.findByEmployeeId(employeeId);
        for (ConsentRecord consent : consents) {
            if (consent.getConsentType().equals("BIOMETRIC") && consent.isGranted()) {
                consent.setGranted(false);
                consent.setRevokedAt(Instant.now());
                consentRecordRepository.save(consent);
            }
        }
        
        // BIPA Compliance: Clear biometric data when consent is revoked
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        employee.setFingerprintTemplateHash(null);
        employeeRepository.save(employee);
    }

    @Override
    public boolean hasBiometricConsent(UUID employeeId) {
        return consentRecordRepository.findByEmployeeId(employeeId).stream()
                .anyMatch(c -> c.getConsentType().equals("BIOMETRIC") && c.isGranted());
    }

    @Override
    @Transactional
    public void logDataAccess(UUID userId, UUID companyId, String action, String resourceType, 
                             UUID resourceId, String ipAddress, String userAgent, Map<String, Object> details) {
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .companyId(companyId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .details(details)
                .build();
        
        auditLogRepository.save(auditLog);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs(UUID companyId, int limit) {
        return auditLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }
}

