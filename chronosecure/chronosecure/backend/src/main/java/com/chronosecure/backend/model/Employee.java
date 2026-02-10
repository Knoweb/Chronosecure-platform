package com.chronosecure.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;
import java.util.UUID;

/**
 * Employee Entity
 * COMPLIANCE CRITICAL: fingerprint_template_hash must be encrypted at rest
 * (AES-256)
 * BIPA Compliance: NEVER store raw fingerprint images, only cryptographic
 * hashes
 */
@Entity
@Table(name = "employees", uniqueConstraints = {
        @UniqueConstraint(name = "uk_company_employee_code", columnNames = { "company_id", "employee_code" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    @JsonIgnore
    @ToString.Exclude
    private Company company;

    @Column(name = "employee_code", nullable = false, length = 50)
    private String employeeCode;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    /**
     * BIPA COMPLIANCE: Store ONLY the cryptographic hash/template.
     * NEVER store the raw fingerprint image.
     * This field must be encrypted at rest via application logic (AES-256).
     */
    @Column(name = "fingerprint_template_hash", columnDefinition = "TEXT")
    private String fingerprintTemplateHash;

    /**
     * Encrypted PIN hash (BCrypt/Argon2) for backup login
     */
    @Column(name = "pin_hash", length = 255)
    private String pinHash;

    @Column(length = 100)
    private String department;

    @Column(length = 255)
    private String email;

    /**
     * GDPR Compliance: Soft delete for "Right to Erasure" handling
     */
    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
