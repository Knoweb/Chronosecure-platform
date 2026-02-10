package com.chronosecure.backend.controller;

import com.chronosecure.backend.dto.AttendanceRequest;
import com.chronosecure.backend.model.AttendanceLog;
import com.chronosecure.backend.model.enums.AttendanceEventType;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance Management", description = "Endpoints for logging and retrieving attendance events")
// Allow CORS for local development (Frontend is likely on localhost:5173)
@CrossOrigin(origins = "http://localhost:5173")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final EmployeeRepository employeeRepository;

    @Operation(summary = "Get list of active employees for scanner app")
    @GetMapping("/employees")
    public ResponseEntity<List<java.util.Map<String, String>>> getEmployeesList(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(employeeRepository.findByCompanyIdAndIsActiveTrue(companyId).stream()
                .map(e -> {
                    java.util.Map<String, String> map = new java.util.HashMap<>();
                    map.put("code", e.getEmployeeCode());
                    map.put("id", e.getId().toString());
                    String name = (e.getFirstName() != null ? e.getFirstName() : "") + " "
                            + (e.getLastName() != null ? e.getLastName() : "");
                    map.put("name", name.trim());
                    return map;
                })
                .collect(Collectors.toList()));
    }

    @Operation(summary = "Log an attendance event", description = "Records a Clock-In/Out or Break event. Requires strict tenant validation.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event logged successfully", content = @Content(schema = @Schema(implementation = AttendanceLog.class))),
            @ApiResponse(responseCode = "404", description = "Employee or Company not found"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    @PostMapping("/log")
    public ResponseEntity<AttendanceLog> logAttendance(@Valid @RequestBody AttendanceRequest request) {
        try {
            AttendanceLog log = attendanceService.logAttendance(request);
            return ResponseEntity.ok(log);
        } catch (Exception e) {
            e.printStackTrace(); // PRINT STACK TRACE
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Get next expected state", description = "Determines if the employee should likely 'Clock In' or 'Clock Out' based on history.")
    @GetMapping("/next-state/{companyId}/{employeeId}")
    public ResponseEntity<AttendanceEventType> getNextState(
            @PathVariable UUID companyId,
            @PathVariable UUID employeeId) {

        AttendanceEventType nextEvent = attendanceService.getNextExpectedEvent(companyId, employeeId);
        return ResponseEntity.ok(nextEvent);
    }

    @Operation(summary = "Get attendance logs", description = "Fetch logs for the company within a date range.")
    @GetMapping("/logs")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<List<com.chronosecure.backend.dto.AttendanceLogResponse>> getAttendanceLogs(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {

        return ResponseEntity.ok(attendanceService.getAttendanceLogs(companyId, startDate, endDate));
    }

    @Operation(summary = "Get dashboard stats", description = "Fetch daily statistics for dashboard.")
    @GetMapping("/today-stats")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> getTodayStats(
            @RequestHeader("X-Company-Id") UUID companyId) {
        return ResponseEntity.ok(attendanceService.getTodayStats(companyId));
    }
}
