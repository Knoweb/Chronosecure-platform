package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.dto.EmployeeCreateRequest;
import com.chronosecure.backend.dto.EmployeeUpdateRequest;
import com.chronosecure.backend.model.ConsentRecord;
import com.chronosecure.backend.model.Employee;
import com.chronosecure.backend.repository.ConsentRecordRepository;
import com.chronosecure.backend.repository.EmployeeRepository;
import com.chronosecure.backend.service.EmployeeService;
import com.chronosecure.backend.service.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Employee Service Implementation
 * Handles employee CRUD operations with BIPA compliance for biometric data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final EncryptionService encryptionService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public Employee createEmployee(UUID companyId, EmployeeCreateRequest request) {
        // Check if employee code already exists for this company
        if (employeeRepository.existsByCompanyIdAndEmployeeCode(companyId, request.getEmployeeCode())) {
            throw new IllegalArgumentException("Employee code already exists for this company");
        }

        Employee employee = Employee.builder()
                .companyId(companyId)
                .employeeCode(request.getEmployeeCode())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .department(request.getDepartment())
                .email(request.getEmail())
                .isActive(true)
                .build();

        // BIPA Compliance: Encrypt fingerprint template hash before storage
        if (request.getFingerprintTemplateHash() != null && !request.getFingerprintTemplateHash().isEmpty()) {
            String encryptedHash = encryptionService.encrypt(request.getFingerprintTemplateHash());
            employee.setFingerprintTemplateHash(encryptedHash);
        }

        // Hash PIN if provided
        if (request.getPin() != null && !request.getPin().isEmpty()) {
            employee.setPinHash(passwordEncoder.encode(request.getPin()));
        }

        Employee savedEmployee = employeeRepository.save(employee);

        // BIPA Compliance: Record consent if granted
        if (request.isGrantBiometricConsent()) {
            grantBiometricConsent(savedEmployee.getId(), null, null);
        }

        log.info("Created employee {} for company {}", savedEmployee.getId(), companyId);
        return savedEmployee;
    }

    @Override
    @Transactional
    public Employee updateEmployee(UUID companyId, UUID employeeId, EmployeeUpdateRequest request) {
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        if (request.getFirstName() != null) {
            employee.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            employee.setLastName(request.getLastName());
        }
        if (request.getDepartment() != null) {
            employee.setDepartment(request.getDepartment());
        }
        if (request.getEmail() != null) {
            employee.setEmail(request.getEmail());
        }
        if (request.getIsActive() != null) {
            employee.setActive(request.getIsActive());
        }

        // BIPA Compliance: Encrypt fingerprint template hash before storage
        if (request.getFingerprintTemplateHash() != null && !request.getFingerprintTemplateHash().isEmpty()) {
            String encryptedHash = encryptionService.encrypt(request.getFingerprintTemplateHash());
            employee.setFingerprintTemplateHash(encryptedHash);
        }

        // Hash PIN if provided
        if (request.getPin() != null && !request.getPin().isEmpty()) {
            employee.setPinHash(passwordEncoder.encode(request.getPin()));
        }

        return employeeRepository.save(employee);
    }

    @Override
    public Optional<Employee> getEmployeeById(UUID companyId, UUID employeeId) {
        return employeeRepository.findByCompanyIdAndId(companyId, employeeId);
    }

    @Override
    public List<Employee> getAllEmployees(UUID companyId) {
        return employeeRepository.findByCompanyIdAndIsActiveTrue(companyId);
    }

    @Override
    @Transactional
    public void deleteEmployee(UUID companyId, UUID employeeId) {
        Employee employee = employeeRepository.findByCompanyIdAndId(companyId, employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        // GDPR Compliance: Soft delete for "Right to Erasure" handling
        employee.setActive(false);
        employeeRepository.save(employee);

        log.info("Soft deleted employee {} for company {}", employeeId, companyId);
    }

    @Override
    @Transactional
    public boolean grantBiometricConsent(UUID employeeId, String ipAddress, String userAgent) {
        // BIPA Compliance: Record explicit consent
        ConsentRecord consent = ConsentRecord.builder()
                .employeeId(employeeId)
                .consentType("BIOMETRIC")
                .granted(true)
                .grantedAt(Instant.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        consentRecordRepository.save(consent);
        log.info("Biometric consent granted for employee {}", employeeId);
        return true;
    }

    @Override
    @Transactional
    public boolean revokeBiometricConsent(UUID employeeId) {
        // BIPA Compliance: Revoke consent
        List<ConsentRecord> activeConsents = consentRecordRepository.findByEmployeeId(employeeId)
                .stream()
                .filter(c -> c.getConsentType().equals("BIOMETRIC") && c.isGranted() && c.getRevokedAt() == null)
                .toList();

        for (ConsentRecord consent : activeConsents) {
            consent.setGranted(false);
            consent.setRevokedAt(Instant.now());
            consentRecordRepository.save(consent);
        }

        log.info("Biometric consent revoked for employee {}", employeeId);
        return true;
    }
}
