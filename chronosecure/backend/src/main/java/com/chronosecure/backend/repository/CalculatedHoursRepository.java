package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.CalculatedHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalculatedHoursRepository extends JpaRepository<CalculatedHours, UUID> {

    // REPORT GENERATION QUERY:
    // Fetches pre-calculated data for a company within a date range (e.g., Month of October).
    List<CalculatedHours> findByCompanyIdAndWorkDateBetweenOrderByWorkDateAsc(
            UUID companyId, LocalDate startDate, LocalDate endDate);

    // Individual employee report
    List<CalculatedHours> findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(
            UUID employeeId, LocalDate startDate, LocalDate endDate);
}
