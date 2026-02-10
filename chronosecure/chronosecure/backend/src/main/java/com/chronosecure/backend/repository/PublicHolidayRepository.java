package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.PublicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, UUID> {

    // Check if a specific date is a holiday for this company
    Optional<PublicHoliday> findByCompanyIdAndHolidayDate(UUID companyId, LocalDate date);

    // List upcoming holidays for the dashboard
    List<PublicHoliday> findByCompanyIdAndHolidayDateAfterOrderByHolidayDateAsc(UUID companyId, LocalDate today);
}
