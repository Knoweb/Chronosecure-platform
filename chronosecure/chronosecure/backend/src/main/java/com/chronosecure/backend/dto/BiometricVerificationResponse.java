package com.chronosecure.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO for biometric verification
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiometricVerificationResponse {
    private boolean verified;
    private UUID employeeId;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String message;
    private double confidenceScore; // Match confidence (0.0 to 1.0)
}

