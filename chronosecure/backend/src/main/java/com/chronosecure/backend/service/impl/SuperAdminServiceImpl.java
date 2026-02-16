package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.model.User;
import com.chronosecure.backend.model.enums.SubscriptionPlan;
import com.chronosecure.backend.repository.CompanyRepository;
import com.chronosecure.backend.repository.UserRepository;
import com.chronosecure.backend.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
    public void deleteCompany(UUID companyId) {
        Company company = getCompanyDetails(companyId);
        
        // 1. Delete Dependencies first
        // Attendance Logs
        attendanceLogRepository.deleteAll(attendanceLogRepository.findByCompanyId(companyId));
        
        // Time Off Requests
        timeOffRequestRepository.deleteAll(timeOffRequestRepository.findByCompanyId(companyId));
        
        // Calculated Hours
        calculatedHoursRepository.deleteAll(calculatedHoursRepository.findByCompanyId(companyId));
        
        // Company Calendar
        companyCalendarRepository.deleteAll(companyCalendarRepository.findByCompanyId(companyId));
        
        // Locations
        locationRepository.deleteAll(locationRepository.findByCompanyId(companyId));

        // 2. Delete Users
        List<User> users = userRepository.findByCompanyId(companyId);
        userRepository.deleteAll(users);

        // 3. Delete Company
        companyRepository.delete(company);
    }
}
