package com.chronosecure.backend.controller;

import com.chronosecure.backend.dto.EmployeeCreateRequest;
import com.chronosecure.backend.dto.EmployeeUpdateRequest;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.service.EmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Employee> createEmployee(
            @RequestHeader("X-Company-Id") UUID companyId,
            @Valid @RequestBody EmployeeCreateRequest request) {
        Employee employee = employeeService.createEmployee(companyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(employee);
    }

    @GetMapping
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<List<Employee>> getAllEmployees(
            @RequestHeader("X-Company-Id") UUID companyId) {
        List<Employee> employees = employeeService.getAllEmployees(companyId);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<Employee> getEmployee(
            @RequestHeader("X-Company-Id") UUID companyId,
            @PathVariable UUID id) {
        return employeeService.getEmployeeById(companyId, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Employee> updateEmployee(
            @RequestHeader("X-Company-Id") UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeUpdateRequest request) {
        Employee employee = employeeService.updateEmployee(companyId, id, request);
        return ResponseEntity.ok(employee);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEmployee(
            @RequestHeader("X-Company-Id") UUID companyId,
            @PathVariable UUID id) {
        employeeService.deleteEmployee(companyId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/consent/biometric")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> grantBiometricConsent(
            @PathVariable UUID id,
            HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        employeeService.grantBiometricConsent(id, ipAddress, userAgent);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/consent/biometric")
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> revokeBiometricConsent(@PathVariable UUID id) {
        employeeService.revokeBiometricConsent(id);
        return ResponseEntity.ok().build();
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}






