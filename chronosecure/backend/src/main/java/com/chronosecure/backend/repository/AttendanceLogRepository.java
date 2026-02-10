package com.chronosecure.backend.repository;

import com.chronosecure.backend.model.AttendanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, UUID> {

    // 1. Fetch raw logs for a single employee on a specific day (or range)
    // Used by the "Session Reconstruction" logic to calculate hours.
    List<AttendanceLog> findByEmployeeIdAndEventTimestampBetweenOrderByEventTimestampAsc(
            UUID employeeId, Instant startOfDay, Instant endOfDay);

    // 2. Real-time Dashboard: Get the very last event for a list of employees
    // Efficiently finds the current status (In/Out/Break) for everyone in a
    // company.
    @Query("SELECT log FROM AttendanceLog log " +
            "WHERE log.companyId = :companyId " +
            "AND log.eventTimestamp = (" +
            "    SELECT MAX(l2.eventTimestamp) FROM AttendanceLog l2 " +
            "    WHERE l2.employee.id = log.employee.id" +
            ")")
    List<AttendanceLog> findLatestStatusForCompany(@Param("companyId") UUID companyId);

    // Fetch history for company within date range
    List<AttendanceLog> findByCompanyIdAndEventTimestampBetweenOrderByEventTimestampDesc(
            UUID companyId, Instant start, Instant end);
}
