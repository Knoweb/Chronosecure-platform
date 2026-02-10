package com.chronosecure.backend.controller;

import com.chronosecure.backend.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Report Controller
 * Handles Excel report generation
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Attendance report generation endpoints")
@CrossOrigin(origins = "http://localhost:5173")
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "Generate company attendance report (Excel)")
    @GetMapping("/company")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Resource> generateCompanyReport(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        Resource resource = reportService.generateCompanyReport(companyId, startDate, endDate);
        
        String filename = String.format("company-attendance-report-%s-to-%s.xlsx", startDate, endDate);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @Operation(summary = "Generate employee attendance report (Excel)")
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<Resource> generateEmployeeReport(
            @RequestHeader("X-Company-Id") UUID companyId,
            @PathVariable UUID employeeId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        Resource resource = reportService.generateEmployeeReport(companyId, employeeId, startDate, endDate);
        
        String filename = String.format("employee-attendance-report-%s-to-%s.xlsx", startDate, endDate);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}

