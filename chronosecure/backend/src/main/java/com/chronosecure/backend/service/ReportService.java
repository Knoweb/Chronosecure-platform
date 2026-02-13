package com.chronosecure.backend.service;

import org.springframework.core.io.Resource;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Service for generating attendance reports in Excel format
 */
public interface ReportService {
    
    /**
     * Generate Excel report for a company within a date range
     */
    Resource generateCompanyReport(UUID companyId, LocalDate startDate, LocalDate endDate);
    
    /**
     * Generate Excel report for a specific employee within a date range
     */
    Resource generateEmployeeReport(UUID companyId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    /**
     * Generate Cost Summary Report with daily active user pricing
     */
    Resource generateCostReport(UUID companyId, LocalDate startDate, LocalDate endDate);
}

