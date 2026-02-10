package com.chronosecure.backend.dto;

import com.chronosecure.backend.model.enums.AttendanceEventType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AttendanceLogResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeCode;
    private String department;
    private AttendanceEventType eventType;
    private Instant eventTimestamp;
    private String deviceId;
    private String photoUrl;
    private BigDecimal confidenceScore;
    private boolean isOfflineSync;
}
