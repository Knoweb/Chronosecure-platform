package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, UUID> {
    List<ConsentRecord> findByEmployeeId(UUID employeeId);
    Optional<ConsentRecord> findByEmployeeIdAndConsentTypeAndGrantedTrue(UUID employeeId, String consentType);
    boolean existsByEmployeeIdAndConsentTypeAndGrantedTrue(UUID employeeId, String consentType);
    
    void deleteByEmployeeIdIn(List<UUID> employeeIds);
}






