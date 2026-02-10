package com.chronosecure.backend.service;

import com.chronosecure.backend.dto.BiometricEnrollmentRequest;
import com.chronosecure.backend.dto.BiometricVerificationRequest;
import com.chronosecure.backend.dto.BiometricVerificationResponse;

import java.util.UUID;

/**
 * Biometric Service Interface
 * Handles fingerprint enrollment and verification with BIPA compliance
 */
public interface BiometricService {
    /**
     * Enroll a fingerprint template for an employee
     * BIPA Compliance: Encrypts and stores only the hash, never raw images
     */
    boolean enrollFingerprint(UUID companyId, BiometricEnrollmentRequest request, String ipAddress, String userAgent);
    
    /**
     * Verify a fingerprint against stored templates
     * Returns verification result with confidence score
     * @param ipAddress IP address for audit logging (APPI compliance)
     * @param userAgent User agent for audit logging (APPI compliance)
     */
    BiometricVerificationResponse verifyFingerprint(BiometricVerificationRequest request, String ipAddress, String userAgent);
    
    /**
     * Check if an employee has enrolled fingerprints
     */
    boolean hasEnrolledFingerprint(UUID companyId, UUID employeeId);
    
    /**
     * Remove fingerprint data for an employee (BIPA compliance: right to deletion)
     */
    boolean removeFingerprint(UUID companyId, UUID employeeId);
}

