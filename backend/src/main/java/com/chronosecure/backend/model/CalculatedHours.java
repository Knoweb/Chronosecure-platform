package com.chronosecure.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "calculated_hours", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employee_id", "work_date" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculatedHours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "total_hours_worked")
    private Duration totalHoursWorked;

    @Column(name = "weekday_hours")
    @Builder.Default
    private Duration weekdayHours = Duration.ZERO;

    @Column(name = "saturday_hours")
    @Builder.Default
    private Duration saturdayHours = Duration.ZERO;

    @Column(name = "sunday_hours")
    @Builder.Default
    private Duration sundayHours = Duration.ZERO;

    @Column(name = "public_holiday_hours")
    @Builder.Default
    private Duration publicHolidayHours = Duration.ZERO;

    @Column(name = "leave_hours")
    @Builder.Default
    private Duration leaveHours = Duration.ZERO;

    @CreationTimestamp
    @Column(name = "calculated_at")
    private Instant calculatedAt;
}
