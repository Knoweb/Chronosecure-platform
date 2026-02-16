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
        
        // Basic cleanup: Delete all users first (Assuming users are the main dependency for now)
        // Note: In a full production app, we would need to delete AttendanceLogs, etc. first or use soft-delete.
        List<User> users = userRepository.findByCompanyId(companyId);
        userRepository.deleteAll(users);

        companyRepository.delete(company);
    }
}
