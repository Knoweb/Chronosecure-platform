package com.chronosecure.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCreateRequest {
    @NotBlank(message = "Employee code is required")
    private String employeeCode;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String department;
    private String email;
    private String pin; // Will be hashed before storage
    private String fingerprintTemplateHash; // BIPA: Only hash, never raw image
    private boolean grantBiometricConsent = false; // BIPA: Explicit consent required
}






