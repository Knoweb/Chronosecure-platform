package com.chronosecure.backend.service;

import com.chronosecure.backend.model.AuditLog;
import com.chronosecure.backend.model.ConsentRecord;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for compliance-related operations (GDPR, BIPA, APPI)
 */
public interface ComplianceService {
    
    // GDPR Compliance
    /**
     * Export all data for an employee (GDPR Data Portability)
     */
    Map<String, Object> exportEmployeeData(UUID companyId, UUID employeeId);
    
    /**
     * Hard delete employee data (GDPR Right to be Forgotten)
     */
    void hardDeleteEmployeeData(UUID companyId, UUID employeeId);
    
    // BIPA Compliance
    /**
     * Grant biometric consent for an employee
     */
    ConsentRecord grantBiometricConsent(UUID employeeId, String ipAddress, String userAgent);
    
    /**
     * Revoke biometric consent for an employee
     */
    void revokeBiometricConsent(UUID employeeId);
    
    /**
     * Check if employee has granted biometric consent
     */
    boolean hasBiometricConsent(UUID employeeId);
    
    // APPI Compliance
    /**
     * Log data access for audit trail
     */
    void logDataAccess(UUID userId, UUID companyId, String action, String resourceType, UUID resourceId, String ipAddress, String userAgent, Map<String, Object> details);
    
    /**
     * Get audit logs for a company
     */
    List<AuditLog> getAuditLogs(UUID companyId, int limit);
}

