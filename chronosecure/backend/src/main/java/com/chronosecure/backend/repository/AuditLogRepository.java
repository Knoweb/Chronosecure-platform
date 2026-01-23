package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AuditLog> findByCompanyIdAndCreatedAtBetween(UUID companyId, Instant start, Instant end);
}






