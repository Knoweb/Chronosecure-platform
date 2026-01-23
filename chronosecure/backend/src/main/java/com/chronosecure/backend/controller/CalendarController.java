package com.chronosecure.backend.controller;

import com.chronosecure.backend.model.CompanyCalendar;
import com.chronosecure.backend.model.enums.CalendarDayType;
import com.chronosecure.backend.repository.CompanyCalendarRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
@Tag(name = "Calendar", description = "Company Calendar Management")
@CrossOrigin(origins = "http://localhost:5173")
public class CalendarController {

    private final CompanyCalendarRepository calendarRepository;

    @Operation(summary = "Get calendar entries for a date range")
    @GetMapping
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<List<CompanyCalendar>> getCalendar(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return ResponseEntity.ok(calendarRepository.findByCompanyIdAndDateBetween(companyId, startDate, endDate));
    }

    @Operation(summary = "Set configuration for specific dates (bulk)")
    @PostMapping
    @PreAuthorize("hasRole('COMPANY_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<CompanyCalendar>> updateCalendar(
            @RequestHeader("X-Company-Id") UUID companyId,
            @RequestBody BulkCalendarUpdateRequest request) {

        List<CompanyCalendar> updated = request.getDates().stream().map(date -> {
            CompanyCalendar entry = calendarRepository.findByCompanyIdAndDate(companyId, date)
                    .orElse(CompanyCalendar.builder()
                            .companyId(companyId)
                            .date(date)
                            .build());

            entry.setType(request.getType());
            entry.setPayMultiplier(request.getPayMultiplier());
            entry.setDescription(request.getDescription());
            return calendarRepository.save(entry);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(updated);
    }

    @Data
    public static class BulkCalendarUpdateRequest {
        private List<LocalDate> dates;
        private CalendarDayType type;
        private Double payMultiplier;
        private String description;
    }
}
