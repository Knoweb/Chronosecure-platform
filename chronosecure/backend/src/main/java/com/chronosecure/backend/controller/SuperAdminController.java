package com.chronosecure.backend.controller;

import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.model.User;
import com.chronosecure.backend.model.enums.SubscriptionPlan;
import com.chronosecure.backend.service.SuperAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/super-admin")
@RequiredArgsConstructor
@Tag(name = "Super Admin Dashboard", description = "Endpoints for managing all clients and subscriptions")
@CrossOrigin(origins = "http://localhost:5173")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @Operation(summary = "List all registered companies")
    @GetMapping("/companies")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(superAdminService.getAllCompanies());
    }

    @Operation(summary = "Get specific company details")
    @GetMapping("/companies/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Company> getCompanyDetails(@PathVariable UUID companyId) {
        return ResponseEntity.ok(superAdminService.getCompanyDetails(companyId));
    }

    @Operation(summary = "Update company active status")
    @PatchMapping("/companies/{companyId}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Company> updateCompanyStatus(
            @PathVariable UUID companyId,
            @RequestParam boolean isActive) {
        return ResponseEntity.ok(superAdminService.updateCompanyStatus(companyId, isActive));
    }

    @Operation(summary = "Update company subscription plan")
    @PatchMapping("/companies/{companyId}/plan")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Company> updateCompanyPlan(
            @PathVariable UUID companyId,
            @RequestParam SubscriptionPlan plan) {
        return ResponseEntity.ok(superAdminService.updateCompanyPlan(companyId, plan));
    }

    @Operation(summary = "Get users of a company")
    @GetMapping("/companies/{companyId}/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<User>> getCompanyUsers(@PathVariable UUID companyId) {
        return ResponseEntity.ok(superAdminService.getUsersByCompany(companyId));
    }

    @Operation(summary = "Delete a company and its users")
    @DeleteMapping("/companies/{companyId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteCompany(@PathVariable UUID companyId) {
        superAdminService.deleteCompany(companyId);
        return ResponseEntity.noContent().build();
    }
}
