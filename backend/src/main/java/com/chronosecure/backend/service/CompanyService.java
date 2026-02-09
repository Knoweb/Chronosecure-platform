package com.chronosecure.backend.service;

import com.chronosecure.backend.dto.CompanyRequest;
import com.chronosecure.backend.model.Company;

import java.util.UUID;

public interface CompanyService {
    Company updateCompany(UUID companyId, CompanyRequest request);
}
