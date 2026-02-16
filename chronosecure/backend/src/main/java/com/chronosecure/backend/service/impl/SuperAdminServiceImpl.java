package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.model.User;
import com.chronosecure.backend.model.enums.SubscriptionPlan;
import com.chronosecure.backend.repository.CompanyRepository;
import com.chronosecure.backend.repository.UserRepository;
import com.chronosecure.backend.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SuperAdminServiceImpl implements SuperAdminService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final com.chronosecure.backend.repository.AttendanceLogRepository attendanceLogRepository;
    private final com.chronosecure.backend.repository.TimeOffRequestRepository timeOffRequestRepository;
    private final com.chronosecure.backend.repository.LocationRepository locationRepository;
    private final com.chronosecure.backend.repository.CalculatedHoursRepository calculatedHoursRepository;
    private final com.chronosecure.backend.repository.CompanyCalendarRepository companyCalendarRepository;
    private final com.chronosecure.backend.repository.AuditLogRepository auditLogRepository;
    private final com.chronosecure.backend.repository.EmployeeRepository employeeRepository;
    private final com.chronosecure.backend.repository.ConsentRecordRepository consentRecordRepository;
    private final com.chronosecure.backend.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @Override
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    @Override
    public Company getCompanyDetails(UUID companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
    }

    @Override
    public Company updateCompanyStatus(UUID companyId, boolean isActive) {
        Company company = getCompanyDetails(companyId);
        company.setActive(isActive);
        return companyRepository.save(company);
    }

    @Override
    public Company updateCompanyPlan(UUID companyId, SubscriptionPlan plan) {
        Company company = getCompanyDetails(companyId);
        company.setSubscriptionPlan(plan);
        return companyRepository.save(company);
    }

    @Override
    public List<User> getUsersByCompany(UUID companyId) {
        return userRepository.findByCompanyId(companyId);
    }

    @Override
    @Transactional
    public void deleteCompany(UUID companyId) {
        Company company = getCompanyDetails(companyId);

        // 1. Delete Direct Dependencies (Logs, Requests, etc.)
        attendanceLogRepository.deleteAll(attendanceLogRepository.findByCompanyId(companyId));
        timeOffRequestRepository.deleteAll(timeOffRequestRepository.findByCompanyId(companyId));
        calculatedHoursRepository.deleteAll(calculatedHoursRepository.findByCompanyId(companyId));
        companyCalendarRepository.deleteAll(companyCalendarRepository.findByCompanyId(companyId));
        locationRepository.deleteAll(locationRepository.findByCompanyId(companyId));
        
        // Audit Logs
        auditLogRepository.deleteAll(auditLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId));

        // 2. Delete Employees and their dependencies
        List<com.chronosecure.backend.model.Employee> employees = employeeRepository.findByCompanyId(companyId);
        List<UUID> employeeIds = employees.stream().map(com.chronosecure.backend.model.Employee::getId).toList();
        
        if (!employeeIds.isEmpty()) {
            consentRecordRepository.deleteByEmployeeIdIn(employeeIds);
        }
        employeeRepository.deleteAll(employees);

        // 3. Delete Users and their dependencies
        List<User> users = userRepository.findByCompanyId(companyId);
        if (!users.isEmpty()) {
             // In case PasswordResetToken deleteByUserIn is needed, we iterate or use a batch delete if JPA supported it easily.
             // Since we added deleteByUserIn, we can try to use it, but wait, JPA custom query void deleteByUserIn(...) needs @Modifying and @Transactional.
             // Standard JpaRepository doesn't support void deleteBy...In automatically without @Transactional.
             // Safer to iterate for now or just trust deleteAll(users) if cascade is there (it's not).
             // Actually, let's just delete tokens one by one or all at once.
             // Easier: passwordResetTokenRepository.deleteByUser(user) in a loop.
             for(User u : users) {
                 passwordResetTokenRepository.deleteByUser(u);
             }
        }
        userRepository.deleteAll(users);

        // 4. Delete Company
        companyRepository.delete(company);
    }
}
