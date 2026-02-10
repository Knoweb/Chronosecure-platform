package com.chronosecure.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Audit Log Entity for APPI Compliance
 * Tracks all data access and modifications for compliance reporting
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(nullable = false, length = 100)
    private String action; // e.g., 'VIEW_EMPLOYEE_DATA', 'EXPORT_DATA', 'DELETE_DATA'

    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType; // e.g., 'EMPLOYEE', 'ATTENDANCE_LOG'

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(name = "ip_address", length = 45) // IPv6 compatible
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details; // Additional context

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}






