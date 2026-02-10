-- Enable UUID extension for secure, non-sequential IDs [cite: 115]
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. COMPANIES (Tenants) [cite: 113]
-- -----------------------------------------------------------------------------
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL, -- Used for tenant resolution (e.g., acme.chronosecure.com) [cite: 118]
    billing_address TEXT,
    stripe_customer_id VARCHAR(255), -- For subscription management [cite: 122]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 2. USERS (Authentication & RBAC) [cite: 72-74]
-- -----------------------------------------------------------------------------
-- Role enum for RBAC: SUPER_ADMIN, COMPANY_ADMIN, EMPLOYEE
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for SUPER_ADMIN
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- BCrypt hashed password
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- 3. EMPLOYEES [cite: 123]
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- COMPLIANCE CRITICAL: Store ONLY the cryptographic hash/template. 
    -- NEVER store the raw fingerprint image. 
    -- Ensure this column is encrypted at rest via application logic (AES-256). [cite: 134, 177]
    fingerprint_template_hash TEXT, 
    
    -- Encrypted PIN hash (e.g., BCrypt/Argon2) for backup login [cite: 136]
    pin_hash VARCHAR(255), 
    
    department VARCHAR(100),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE, -- Soft delete for "Right to Erasure" handling [cite: 188]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure employee codes are unique per company
    CONSTRAINT uk_company_employee_code UNIQUE (company_id, employee_code)
);

-- Index for faster tenant-scoped queries
CREATE INDEX idx_employees_company ON employees(company_id);

-- -----------------------------------------------------------------------------
-- 4. ATTENDANCE LOGS (Raw Events) [cite: 137]
-- -----------------------------------------------------------------------------
-- Enum for strict event typing [cite: 142]
CREATE TYPE attendance_event_type AS ENUM ('CLOCK_IN', 'BREAK_START', 'BREAK_END', 'CLOCK_OUT');

CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id), -- Denormalized for query performance
    employee_id UUID NOT NULL REFERENCES employees(id),
    event_type attendance_event_type NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- [cite: 144]
    
    -- S3 URL to the photo captured at login. 
    -- Used for verification audit trails. [cite: 146]
    photo_url TEXT, 
    
    device_id VARCHAR(100), -- Which kiosk/tablet was used [cite: 148]
    
    -- Reliability checks (Optional but recommended)
    is_offline_sync BOOLEAN DEFAULT FALSE, -- Flag if data was synced after internet outage
    confidence_score DECIMAL(5,2) -- For liveness detection score if available
);

-- Index for reporting queries (filtering by time ranges)
CREATE INDEX idx_attendance_timestamp ON attendance_logs(event_timestamp);
CREATE INDEX idx_attendance_employee ON attendance_logs(employee_id);

-- -----------------------------------------------------------------------------
-- 5. PUBLIC HOLIDAYS [cite: 149]
-- -----------------------------------------------------------------------------
CREATE TABLE public_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    
    CONSTRAINT uk_company_holiday_date UNIQUE (company_id, holiday_date)
);

-- -----------------------------------------------------------------------------
-- 6. CALCULATED HOURS (Daily Summary) 
-- -----------------------------------------------------------------------------
-- This table is populated by a nightly batch job (Spring Batch). 
-- It stores the processed "Net Hours" after deducting breaks.
CREATE TABLE calculated_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    work_date DATE NOT NULL,
    
    -- Storing intervals allows for precise time calculations (e.g., '8 hours 30 mins')
    total_hours_worked INTERVAL, -- [cite: 163]
    
    -- Categorization for payroll [cite: 165, 167, 169, 171]
    weekday_hours INTERVAL DEFAULT '0',
    saturday_hours INTERVAL DEFAULT '0',
    sunday_hours INTERVAL DEFAULT '0',
    public_holiday_hours INTERVAL DEFAULT '0',
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_employee_work_date UNIQUE (employee_id, work_date)
);

-- -----------------------------------------------------------------------------
-- 7. AUDIT LOGS (APPI Compliance - Track data access) [cite: 53-54]
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- e.g., 'VIEW_EMPLOYEE_DATA', 'EXPORT_DATA', 'DELETE_DATA'
    resource_type VARCHAR(50) NOT NULL, -- e.g., 'EMPLOYEE', 'ATTENDANCE_LOG'
    resource_id UUID,
    ip_address VARCHAR(45), -- IPv6 compatible
    user_agent TEXT,
    details JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- -----------------------------------------------------------------------------
-- 8. CONSENT RECORDS (BIPA Compliance - Biometric consent tracking) [cite: 49]
-- -----------------------------------------------------------------------------
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'BIOMETRIC', 'PHOTO', 'DATA_PROCESSING'
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_employee ON consent_records(employee_id);
