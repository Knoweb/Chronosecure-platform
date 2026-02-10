package com.chronosecure.backend.controller;

import com.chronosecure.backend.dto.CompanyRequest;
import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/company")
@RequiredArgsConstructor
@Tag(name = "Company Management", description = "Endpoints for managing company details")
@CrossOrigin(origins = "http://localhost:5173")
public class CompanyController {

    private final CompanyService companyService;

    @Operation(summary = "Update company details", description = "Update name and billing address. Requires COMPANY_ADMIN.")
    @PutMapping("/{companyId}")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ResponseEntity<Company> updateCompany(
            @PathVariable UUID companyId,
            @Valid @RequestBody CompanyRequest request) {
        Company updatedCompany = companyService.updateCompany(companyId, request);
        return ResponseEntity.ok(updatedCompany);
    }
}
