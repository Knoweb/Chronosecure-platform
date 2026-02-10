package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {
    
    // Used during login to resolve tenant by subdomain (e.g., "acme".chronosecure.com)
    Optional<Company> findBySubdomain(String subdomain);
    
    // For internal admin checks
    Optional<Company> findByStripeCustomerId(String stripeCustomerId);
}
