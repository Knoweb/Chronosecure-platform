package com.chronosecure.backend.controller;

import com.chronosecure.backend.model.AuditLog;
import com.chronosecure.backend.service.ComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Compliance Controller
 * Handles GDPR, BIPA, and APPI compliance endpoints
 */
@RestController
@RequestMapping("/api/v1/compliance")
@RequiredArgsConstructor
@Tag(name = "Compliance", description = "GDPR, BIPA, and APPI compliance endpoints")
@CrossOrigin(origins = "http://localhost:5173")
public class ComplianceController {

    private final ComplianceService complianceService;

    @Operation(summary = "Export employee data (GDPR Data Portability)")
    @GetMapping("/export/{employeeId}")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> exportEmployeeData(
            @RequestHeader("X-Company-Id") UUID companyId,
            @PathVariable UUID employeeId,
            HttpServletRequest request) {
        
        Map<String, Object> exportData = complianceService.exportEmployeeData(companyId, employeeId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employee-data-export.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(exportData);
    }

    @Operation(summary = "Hard delete employee data (GDPR Right to be Forgotten)")
    @DeleteMapping("/delete/{employeeId}")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> hardDeleteEmployeeData(
            @RequestHeader("X-Company-Id") UUID companyId,
            @PathVariable UUID employeeId) {
        
        complianceService.hardDeleteEmployeeData(companyId, employeeId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Grant biometric consent (BIPA Compliance)")
    @PostMapping("/consent/{employeeId}/grant")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> grantBiometricConsent(
            @PathVariable UUID employeeId,
            HttpServletRequest request) {
        
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        complianceService.grantBiometricConsent(employeeId, ipAddress, userAgent);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Revoke biometric consent (BIPA Compliance)")
    @PostMapping("/consent/{employeeId}/revoke")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> revokeBiometricConsent(@PathVariable UUID employeeId) {
        complianceService.revokeBiometricConsent(employeeId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Check biometric consent status")
    @GetMapping("/consent/{employeeId}/status")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<Map<String, Boolean>> checkBiometricConsent(@PathVariable UUID employeeId) {
        boolean hasConsent = complianceService.hasBiometricConsent(employeeId);
        return ResponseEntity.ok(Map.of("hasConsent", hasConsent));
    }

    @Operation(summary = "Get audit logs (APPI Compliance)")
    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestParam(defaultValue = "100") int limit) {
        
        List<AuditLog> logs = complianceService.getAuditLogs(companyId, limit);
        return ResponseEntity.ok(logs);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

