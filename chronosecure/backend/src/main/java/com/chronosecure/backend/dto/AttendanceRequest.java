package com.chronosecure.backend.dto;

import com.chronosecure.backend.model.enums.AttendanceEventType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AttendanceRequest {
    @NotNull(message = "Company ID is mandatory")
    private UUID companyId;

    @NotNull(message = "Employee ID is mandatory")
    private UUID employeeId;

    @NotNull(message = "Event type is mandatory")
    private AttendanceEventType eventType; // CLOCK_IN, BREAK_START, etc.

    private String deviceId; // The ID of the Kiosk/Tablet
    
    // In a real scenario, this might be a Base64 string or MultipartFile
    // We treat it as a placeholder for the photo captured at the kiosk.
    private String photoBase64; 
    
    private Double confidenceScore; // Liveness check score from frontend

    // Used exclusively for generating historical demonstration data
    private java.time.Instant overrideTimestamp;
}
