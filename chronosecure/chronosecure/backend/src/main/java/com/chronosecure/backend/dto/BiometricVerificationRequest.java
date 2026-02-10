package com.chronosecure.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for biometric verification
 * Used for kiosk clock-in/out with fingerprint
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BiometricVerificationRequest {
    @NotBlank(message = "Employee code is required")
    private String employeeCode;
    
    @NotBlank(message = "Fingerprint template hash is required")
    private String fingerprintTemplateHash; // BIPA: Only hash, never raw fingerprint image
    
    private String companyId; // Optional, for multi-tenant verification
}

