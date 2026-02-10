package com.chronosecure.backend.model;

import com.chronosecure.backend.model.enums.CalendarDayType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "company_calendars", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"companyId", "date"})
})
public class CompanyCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID companyId;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private CalendarDayType type; // WORKING_DAY, HOLIDAY, WEEKEND

    private Double payMultiplier; // e.g. 1.0, 1.5, 2.0

    private String description; // e.g. "Christmas", "Poya Day"
}
