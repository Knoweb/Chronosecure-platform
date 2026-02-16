package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.CompanyCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyCalendarRepository extends JpaRepository<CompanyCalendar, UUID> {
    List<CompanyCalendar> findByCompanyIdAndDateBetween(UUID companyId, LocalDate startDate, LocalDate endDate);
    Optional<CompanyCalendar> findByCompanyId(UUID companyId, LocalDate date);
    List<CompanyCalendar> findByCompanyId(UUID companyId);
}
