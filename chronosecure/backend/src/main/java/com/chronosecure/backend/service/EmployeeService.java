package com.chronosecure.backend.service;

import com.chronosecure.backend.dto.EmployeeCreateRequest;
import com.chronosecure.backend.dto.EmployeeUpdateRequest;
import com.chronosecure.backend.model.Employee;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeService {
    Employee createEmployee(UUID companyId, EmployeeCreateRequest request);
    Employee updateEmployee(UUID companyId, UUID employeeId, EmployeeUpdateRequest request);
    Optional<Employee> getEmployeeById(UUID companyId, UUID employeeId);
    List<Employee> getAllEmployees(UUID companyId);
    void deleteEmployee(UUID companyId, UUID employeeId);
    boolean grantBiometricConsent(UUID employeeId, String ipAddress, String userAgent);
    boolean revokeBiometricConsent(UUID employeeId);
}






