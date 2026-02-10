# ChronoSecure Database Schema

## Overview

ChronoSecure uses PostgreSQL as the primary database with strict multi-tenancy enforced through `company_id` foreign keys.

## Database: `chronosecure_db`

## Tables

### 1. `companies`
Stores company/tenant information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Company identifier |
| `name` | VARCHAR(255) | NOT NULL | Company name |
| `subdomain` | VARCHAR(100) | UNIQUE | Subdomain for multi-tenant routing |
| `billing_address` | TEXT | | Billing address |
| `stripe_customer_id` | VARCHAR(255) | | Stripe customer ID for payments |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |
| `created_at` | TIMESTAMP | | Creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

**Indexes:**
- `idx_companies_subdomain` on `subdomain`

---

### 2. `users`
Stores user accounts (admins and employees with login access).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | User identifier |
| `company_id` | UUID | NOT NULL, FK → companies | Tenant isolation |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address (login) |
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| `role` | ENUM | NOT NULL | SUPER_ADMIN, COMPANY_ADMIN, EMPLOYEE |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |
| `last_login` | TIMESTAMP | | Last login timestamp |
| `created_at` | TIMESTAMP | | Creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

**Indexes:**
- `idx_users_company` on `company_id`
- `idx_users_email` on `email`

**Roles:**
- `SUPER_ADMIN`: System administrator
- `COMPANY_ADMIN`: Company administrator
- `EMPLOYEE`: Regular employee

---

### 3. `employees`
Stores employee information (can be linked to users or standalone for kiosk-only employees).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Employee identifier |
| `company_id` | UUID | NOT NULL, FK → companies | Tenant isolation |
| `employee_code` | VARCHAR(50) | NOT NULL | Unique employee code |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `fingerprint_template_hash` | TEXT | | **BIPA**: Encrypted fingerprint hash (AES-256) |
| `pin_hash` | VARCHAR(255) | | BCrypt hashed PIN for backup |
| `department` | VARCHAR(100) | | Department name |
| `email` | VARCHAR(255) | | Email address |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete flag (GDPR) |
| `created_at` | TIMESTAMP | | Creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

**Constraints:**
- `uk_company_employee_code`: UNIQUE (`company_id`, `employee_code`)

**Indexes:**
- `idx_employees_company` on `company_id`
- `idx_employees_code` on `employee_code`

**Compliance Notes:**
- `fingerprint_template_hash`: NEVER stores raw fingerprint images, only encrypted hashes (BIPA)
- `is_active`: Soft delete for GDPR "Right to Erasure"

---

### 4. `attendance_logs`
Stores all attendance events (Clock In/Out, Breaks).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Log identifier |
| `company_id` | UUID | NOT NULL, FK → companies | Tenant isolation |
| `employee_id` | UUID | NOT NULL, FK → employees | Employee reference |
| `event_type` | ENUM | NOT NULL | CLOCK_IN, BREAK_START, BREAK_END, CLOCK_OUT |
| `event_timestamp` | TIMESTAMP | NOT NULL | Event timestamp |
| `photo_url` | TEXT | | URL to captured photo (S3 or local) |
| `device_id` | VARCHAR(100) | | Device/kiosk identifier |
| `is_offline_sync` | BOOLEAN | DEFAULT FALSE | Offline sync flag |
| `confidence_score` | DECIMAL(5,2) | | Liveness detection score (0.0-1.0) |
| `created_at` | TIMESTAMP | | Creation timestamp |

**Indexes:**
- `idx_attendance_company` on `company_id`
- `idx_attendance_employee` on `employee_id`
- `idx_attendance_timestamp` on `event_timestamp`
- `idx_attendance_employee_timestamp` on (`employee_id`, `event_timestamp`)

**Event Types:**
- `CLOCK_IN`: Employee clocks in
- `BREAK_START`: Employee starts break
- `BREAK_END`: Employee ends break
- `CLOCK_OUT`: Employee clocks out

---

### 5. `calculated_hours`
Pre-calculated daily hours for reporting (denormalized for performance).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Calculation identifier |
| `company_id` | UUID | NOT NULL, FK → companies | Tenant isolation |
| `employee_id` | UUID | NOT NULL, FK → employees | Employee reference |
| `work_date` | DATE | NOT NULL | Work date |
| `total_hours_worked` | DECIMAL(5,2) | | Total hours |
| `weekday_hours` | DECIMAL(5,2) | | Weekday hours |
| `saturday_hours` | DECIMAL(5,2) | | Saturday hours |
| `sunday_hours` | DECIMAL(5,2) | | Sunday hours |
| `public_holiday_hours` | DECIMAL(5,2) | | Public holiday hours |
| `calculated_at` | TIMESTAMP | | Calculation timestamp |

**Constraints:**
- `uk_calculated_hours`: UNIQUE (`company_id`, `employee_id`, `work_date`)

**Indexes:**
- `idx_calculated_company` on `company_id`
- `idx_calculated_employee` on `employee_id`
- `idx_calculated_date` on `work_date`

---

### 6. `consent_records`
Tracks biometric and data processing consent (BIPA compliance).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Consent identifier |
| `employee_id` | UUID | NOT NULL, FK → employees | Employee reference |
| `consent_type` | VARCHAR(50) | NOT NULL | BIOMETRIC, PHOTO, DATA_PROCESSING |
| `granted` | BOOLEAN | NOT NULL | Consent status |
| `granted_at` | TIMESTAMP | | Grant timestamp |
| `revoked_at` | TIMESTAMP | | Revocation timestamp |
| `ip_address` | VARCHAR(45) | | IP address when consent granted |
| `user_agent` | TEXT | | User agent when consent granted |

**Indexes:**
- `idx_consent_employee` on `employee_id`
- `idx_consent_type` on `consent_type`

**Compliance Notes:**
- BIPA: Explicit consent required before biometric data collection
- GDPR: Consent can be revoked at any time

---

### 7. `audit_logs`
Comprehensive audit trail for compliance (APPI, GDPR).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Audit log identifier |
| `user_id` | UUID | FK → users | User who performed action (nullable for kiosk) |
| `company_id` | UUID | FK → companies | Company context |
| `action` | VARCHAR(100) | NOT NULL | Action type (VIEW, CREATE, UPDATE, DELETE, EXPORT) |
| `resource_type` | VARCHAR(50) | NOT NULL | Resource type (EMPLOYEE, ATTENDANCE_LOG, etc.) |
| `resource_id` | UUID | | Resource identifier |
| `ip_address` | VARCHAR(45) | | IP address |
| `user_agent` | TEXT | | User agent |
| `details` | JSONB | | Additional context (JSON) |
| `created_at` | TIMESTAMP | | Timestamp |

**Indexes:**
- `idx_audit_user` on `user_id`
- `idx_audit_company` on `company_id`
- `idx_audit_action` on `action`
- `idx_audit_resource` on (`resource_type`, `resource_id`)
- `idx_audit_created` on `created_at`

**Compliance Notes:**
- APPI: Tracks all personal data access
- GDPR: Required for data processing records

---

### 8. `public_holidays`
Stores public holidays for accurate hours calculation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Holiday identifier |
| `company_id` | UUID | NOT NULL, FK → companies | Tenant isolation |
| `holiday_date` | DATE | NOT NULL | Holiday date |
| `name` | VARCHAR(255) | NOT NULL | Holiday name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |

**Constraints:**
- `uk_holiday_company_date`: UNIQUE (`company_id`, `holiday_date`)

**Indexes:**
- `idx_holidays_company` on `company_id`
- `idx_holidays_date` on `holiday_date`

---

## Relationships

```
companies (1) ──< (N) users
companies (1) ──< (N) employees
companies (1) ──< (N) attendance_logs
companies (1) ──< (N) calculated_hours
companies (1) ──< (N) public_holidays

employees (1) ──< (N) attendance_logs
employees (1) ──< (N) calculated_hours
employees (1) ──< (N) consent_records

users (1) ──< (N) audit_logs
```

## Multi-Tenancy

All tenant-scoped tables include `company_id`:
- Enforced at application level (Spring Security)
- Database-level foreign keys
- Indexes for performance

## Encryption

Sensitive fields encrypted at rest (AES-256 via Jasypt):
- `employees.fingerprint_template_hash`
- `employees.pin_hash`
- `users.password_hash`

## Soft Deletes

GDPR compliance via soft deletes:
- `employees.is_active` (set to false, data retained)
- `companies.is_active`
- `users.is_active`

## Data Retention

- Audit logs: 7 years (compliance requirement)
- Attendance logs: Configurable (default 2 years)
- Soft-deleted records: 30 days before hard delete

## Backup Strategy

Recommended:
- Daily full backups
- Transaction log backups every 6 hours
- Point-in-time recovery enabled
- Encrypted backups

## Performance Optimization

- Indexes on all foreign keys
- Composite indexes for common queries
- Partitioning for `attendance_logs` by date (future)
- Materialized views for reports (future)

---

For database migrations, see:
- `backend/src/main/resources/schema.sql` (initial schema)
- Flyway/Liquibase migrations (if configured)
