package com.chronosecure.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeUpdateRequest {
    private String firstName;
    private String lastName;
    private String department;
    private String email;
    private String pin; // Will be hashed before storage
    private String fingerprintTemplateHash; // BIPA: Only hash, never raw image
    private Boolean isActive;
}






