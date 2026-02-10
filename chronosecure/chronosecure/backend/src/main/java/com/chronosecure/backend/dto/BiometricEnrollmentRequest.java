package com.chronosecure.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for biometric enrollment
 * BIPA Compliance: Only accepts fingerprint template hash, never raw images
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BiometricEnrollmentRequest {
    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    @NotBlank(message = "Fingerprint template hash is required")
    private String fingerprintTemplateHash; // BIPA: Only hash, never raw fingerprint image
    
    private boolean grantConsent = false; // BIPA: Explicit consent required
}

