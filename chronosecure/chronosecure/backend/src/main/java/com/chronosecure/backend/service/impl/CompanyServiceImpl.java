package com.chronosecure.backend.service.impl;

import com.chronosecure.backend.dto.CompanyRequest;
import com.chronosecure.backend.model.Company;
import com.chronosecure.backend.repository.CompanyRepository;
import com.chronosecure.backend.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public Company updateCompany(UUID companyId, CompanyRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            company.setName(request.getName());
        }

        if (request.getBillingAddress() != null) {
            company.setBillingAddress(request.getBillingAddress());
        }

        return companyRepository.save(company);
    }
}
