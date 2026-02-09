package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.TimeOffRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

import com.chronosecure.backend.model.enums.TimeOffStatus;

@Repository
public interface TimeOffRequestRepository extends JpaRepository<TimeOffRequest, UUID> {
        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "employee")
        List<TimeOffRequest> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

        long countByCompanyIdAndStatus(UUID companyId, TimeOffStatus status);
}
