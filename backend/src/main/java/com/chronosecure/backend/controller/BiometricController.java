package com.chronosecure.backend.controller;

import com.chronosecure.backend.dto.BiometricEnrollmentRequest;
import com.chronosecure.backend.dto.BiometricVerificationRequest;
import com.chronosecure.backend.dto.BiometricVerificationResponse;
import com.chronosecure.backend.service.BiometricService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/biometric")
@RequiredArgsConstructor
@Tag(name = "Biometric Management", description = "Endpoints for fingerprint enrollment and verification")
@CrossOrigin(origins = "http://localhost:5173")
public class BiometricController {

    private final BiometricService biometricService;

    @Operation(summary = "Enroll fingerprint", 
               description = "Enrolls a fingerprint template for an employee. BIPA Compliance: Only accepts encrypted hashes, never raw images.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Fingerprint enrolled successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "404", description = "Employee not found")
    })
    @PostMapping("/enroll")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> enrollFingerprint(
            @RequestHeader("X-Company-Id") String companyIdHeader,
            @Valid @RequestBody BiometricEnrollmentRequest request,
            HttpServletRequest httpRequest) {
        
        UUID companyId = UUID.fromString(companyIdHeader);
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        
        boolean success = biometricService.enrollFingerprint(companyId, request, ipAddress, userAgent);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Fingerprint enrolled successfully" : "Failed to enroll fingerprint");
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Verify fingerprint", 
               description = "Verifies a fingerprint against enrolled templates. Used for kiosk clock-in/out.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Verification result",
                content = @Content(schema = @Schema(implementation = BiometricVerificationResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping("/verify")
    public ResponseEntity<BiometricVerificationResponse> verifyFingerprint(
            @Valid @RequestBody BiometricVerificationRequest request,
            HttpServletRequest httpRequest) {
        
        // APPI Compliance: Pass IP and user agent for audit logging
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        
        BiometricVerificationResponse response = biometricService.verifyFingerprint(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Check enrollment status", 
               description = "Checks if an employee has enrolled fingerprints")
    @GetMapping("/enrollment-status/{employeeId}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<Map<String, Object>> checkEnrollmentStatus(
            @RequestHeader("X-Company-Id") String companyIdHeader,
            @PathVariable String employeeId) {
        
        UUID companyId = UUID.fromString(companyIdHeader);
        UUID empId = UUID.fromString(employeeId);
        
        boolean hasEnrolled = biometricService.hasEnrolledFingerprint(companyId, empId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasEnrolled", hasEnrolled);
        response.put("employeeId", employeeId);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Remove fingerprint", 
               description = "Removes fingerprint data for an employee. BIPA Compliance: Right to deletion.")
    @DeleteMapping("/remove/{employeeId}")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> removeFingerprint(
            @RequestHeader("X-Company-Id") String companyIdHeader,
            @PathVariable String employeeId) {
        
        UUID companyId = UUID.fromString(companyIdHeader);
        UUID empId = UUID.fromString(employeeId);
        
        boolean success = biometricService.removeFingerprint(companyId, empId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Fingerprint removed successfully" : "Failed to remove fingerprint");
        
        return ResponseEntity.ok(response);
    }
}

