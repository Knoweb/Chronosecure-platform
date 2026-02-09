package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.dto.BiometricEnrollmentRequest;
import com.chronosecure.backend.dto.BiometricVerificationRequest;
import com.chronosecure.backend.dto.BiometricVerificationResponse;
import com.chronosecure.backend.model.ConsentRecord;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.repository.AuditLogRepository;
import com.chronosecure.backend.repository.ConsentRecordRepository;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.model.AuditLog;
import com.chronosecure.backend.service.BiometricService;
import com.chronosecure.backend.service.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Biometric Service Implementation
 * Handles fingerprint enrollment and verification with BIPA compliance
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BiometricServiceImpl implements BiometricService {

    private final EmployeeRepository employeeRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final AuditLogRepository auditLogRepository;
    private final EncryptionService encryptionService;
    
    // Similarity threshold for fingerprint matching (0.0 to 1.0)
    private static final double MATCH_THRESHOLD = 0.85;

    @Override
    @Transactional
    public boolean enrollFingerprint(UUID companyId, BiometricEnrollmentRequest request, String ipAddress, String userAgent) {
        UUID employeeId = UUID.fromString(request.getEmployeeId());
        
        // Verify employee exists and belongs to company
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        
        if (!employee.isActive()) {
            throw new IllegalArgumentException("Employee is not active");
        }
        
        // BIPA Compliance: Record explicit consent if granted
        if (request.isGrantConsent()) {
            ConsentRecord consent = ConsentRecord.builder()
                    .employeeId(employeeId)
                    .consentType("BIOMETRIC")
                    .granted(true)
                    .grantedAt(Instant.now())
                    .ipAddress(ipAddress != null ? ipAddress : "unknown")
                    .userAgent(userAgent != null ? userAgent : "unknown")
                    .build();
            consentRecordRepository.save(consent);
            log.info("Biometric consent recorded for employee {}", employeeId);
        }
        
        // BIPA Compliance: Encrypt fingerprint template hash before storage
        String encryptedHash = encryptionService.encrypt(request.getFingerprintTemplateHash());
        employee.setFingerprintTemplateHash(encryptedHash);
        employeeRepository.save(employee);
        
        log.info("Fingerprint enrolled for employee {} in company {}", employeeId, companyId);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public BiometricVerificationResponse verifyFingerprint(BiometricVerificationRequest request, String ipAddress, String userAgent) {
        // Find employee by code (and optionally company ID)
        Employee employee;
        if (request.getCompanyId() != null && !request.getCompanyId().isEmpty()) {
            UUID companyId = UUID.fromString(request.getCompanyId());
            employee = employeeRepository.findByCompanyIdAndEmployeeCode(companyId, request.getEmployeeCode())
                    .orElse(null);
        } else {
            // Search across all companies (for kiosk mode)
            employee = employeeRepository.findByEmployeeCode(request.getEmployeeCode())
                    .orElse(null);
        }
        
        if (employee == null || !employee.isActive()) {
            return BiometricVerificationResponse.builder()
                    .verified(false)
                    .message("Employee not found or inactive")
                    .confidenceScore(0.0)
                    .build();
        }
        
        // Check if employee has enrolled fingerprint
        if (employee.getFingerprintTemplateHash() == null || employee.getFingerprintTemplateHash().isEmpty()) {
            return BiometricVerificationResponse.builder()
                    .verified(false)
                    .message("No fingerprint enrolled for this employee")
                    .confidenceScore(0.0)
                    .build();
        }
        
        // BIPA Compliance: Check if consent is still valid
        boolean hasConsent = consentRecordRepository.findByEmployeeId(employee.getId()).stream()
                .anyMatch(c -> c.getConsentType().equals("BIOMETRIC") 
                        && c.isGranted() 
                        && c.getRevokedAt() == null);
        
        if (!hasConsent) {
            return BiometricVerificationResponse.builder()
                    .verified(false)
                    .message("Biometric consent not granted or revoked")
                    .confidenceScore(0.0)
                    .build();
        }
        
        // Decrypt stored hash
        String storedHash = encryptionService.decrypt(employee.getFingerprintTemplateHash());
        
        // Compare hashes (in production, use proper fingerprint matching algorithm)
        double similarity = calculateSimilarity(storedHash, request.getFingerprintTemplateHash());
        boolean verified = similarity >= MATCH_THRESHOLD;
        
        // APPI Compliance: Log biometric data access
        if (employee.getCompanyId() != null) {
            AuditLog auditLog = AuditLog.builder()
                    .userId(null) // Kiosk mode - no user
                    .companyId(employee.getCompanyId())
                    .action(verified ? "BIOMETRIC_VERIFICATION_SUCCESS" : "BIOMETRIC_VERIFICATION_FAILED")
                    .resourceType("BIOMETRIC_DATA")
                    .resourceId(employee.getId())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .details(java.util.Map.of(
                            "employeeCode", employee.getEmployeeCode(),
                            "confidenceScore", String.valueOf(similarity),
                            "verified", String.valueOf(verified)
                    ))
                    .build();
            auditLogRepository.save(auditLog);
        }
        
        if (verified) {
            log.info("Fingerprint verified for employee {} with confidence {}", 
                    employee.getEmployeeCode(), similarity);
        } else {
            log.warn("Fingerprint verification failed for employee {} with confidence {}", 
                    employee.getEmployeeCode(), similarity);
        }
        
        return BiometricVerificationResponse.builder()
                .verified(verified)
                .employeeId(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .message(verified ? "Fingerprint verified successfully" : "Fingerprint verification failed")
                .confidenceScore(similarity)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasEnrolledFingerprint(UUID companyId, UUID employeeId) {
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElse(null);
        return employee != null 
                && employee.getFingerprintTemplateHash() != null 
                && !employee.getFingerprintTemplateHash().isEmpty();
    }

    @Override
    @Transactional
    public boolean removeFingerprint(UUID companyId, UUID employeeId) {
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        
        // BIPA Compliance: Clear biometric data
        employee.setFingerprintTemplateHash(null);
        employeeRepository.save(employee);
        
        // Revoke consent
        consentRecordRepository.findByEmployeeId(employeeId).stream()
                .filter(c -> c.getConsentType().equals("BIOMETRIC") && c.isGranted() && c.getRevokedAt() == null)
                .forEach(c -> {
                    c.setGranted(false);
                    c.setRevokedAt(Instant.now());
                    consentRecordRepository.save(c);
                });
        
        log.info("Fingerprint removed for employee {} in company {}", employeeId, companyId);
        return true;
    }
    
    /**
     * Calculate similarity between two fingerprint template hashes
     * In production, use a proper fingerprint matching algorithm (e.g., Minutiae matching)
     * This is a simplified version for demonstration
     */
    private double calculateSimilarity(String hash1, String hash2) {
        if (hash1 == null || hash2 == null || hash1.length() != hash2.length()) {
            return 0.0;
        }
        
        // Simple character-by-character comparison
        // In production, use proper biometric matching algorithms
        int matches = 0;
        int total = hash1.length();
        
        for (int i = 0; i < total; i++) {
            if (hash1.charAt(i) == hash2.charAt(i)) {
                matches++;
            }
        }
        
        return (double) matches / total;
    }
}

