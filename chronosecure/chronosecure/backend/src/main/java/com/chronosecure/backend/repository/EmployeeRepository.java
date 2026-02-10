package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    // Login lookup: Find employee within a specific company
    Optional<Employee> findByCompanyIdAndEmployeeCode(UUID companyId, String employeeCode);

    // List all active employees for a specific company (for Admin Dashboard)
    List<Employee> findByCompanyIdAndIsActiveTrue(UUID companyId);

    // List all employees for a specific company (including inactive)
    List<Employee> findByCompanyId(UUID companyId);

    // Find employee by company and ID
    Optional<Employee> findByCompanyIdAndId(UUID companyId, UUID id);

    // Compliance: Check if an employee exists before creating (prevent duplicates)
    boolean existsByCompanyIdAndEmployeeCode(UUID companyId, String employeeCode);
    
    // Kiosk mode: Find employee by code across all companies
    Optional<Employee> findByEmployeeCode(String employeeCode);
}
