package com.chronosecure.backend.service;

import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.model.User;
import com.chronosecure.backend.model.enums.SubscriptionPlan;

import java.util.List;
import java.util.UUID;

public interface SuperAdminService {
    List<Company> getAllCompanies();
    Company getCompanyDetails(UUID companyId);
    Company updateCompanyStatus(UUID companyId, boolean isActive);
    Company updateCompanyPlan(UUID companyId, SubscriptionPlan plan);
    List<User> getUsersByCompany(UUID companyId);
    void deleteCompany(UUID companyId);
}
