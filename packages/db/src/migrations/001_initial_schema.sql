-- PlanningOS Database Schema
-- Version: 1.0.0
-- Database: Neon (PostgreSQL 16)
-- Description: Initial schema for PlanningOS workforce scheduling platform

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'planner', 'agent');

CREATE TYPE shift_category AS ENUM (
    'standard',      -- 101, 102, etc.
    'intermediate',  -- 111, 112, etc.
    'night',         -- 121, 6121, 7121
    'partial',       -- X_AM, X_PM
    'special',       -- X_10, AG
    'rest',          -- RH, CH, RR, ZM
    'leave'          -- CN, JC, CV
);

CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');

CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout');

-- ============================================
-- TABLE: organizations
-- Multi-tenancy support
-- ============================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    config JSONB DEFAULT '{}'::JSONB,
    -- Configurable year start (anchor date for periods)
    year_start_date DATE NOT NULL DEFAULT '2026-01-12',
    timezone VARCHAR(50) DEFAULT 'Europe/Brussels',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON COLUMN organizations.year_start_date IS 'Anchor date for period calculation (P1 starts here)';

-- ============================================
-- TABLE: roles
-- Permission-based access control
-- ============================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    -- JSON array of permission strings
    permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- System roles cannot be deleted
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

COMMENT ON TABLE roles IS 'User roles with granular permissions';

-- ============================================
-- TABLE: users
-- User accounts with leave entitlements
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    matricule VARCHAR(50),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),

    -- Leave entitlements (annual)
    cn_entitlement INTEGER DEFAULT 20,      -- Congé Normalisé
    jc_entitlement INTEGER DEFAULT 10,      -- Jour Chômé
    cn_carryover INTEGER DEFAULT 0,         -- Previous year carryover
    jc_carryover INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, email),
    UNIQUE(organization_id, matricule)
);

COMMENT ON TABLE users IS 'User accounts for all roles';
COMMENT ON COLUMN users.cn_entitlement IS 'Annual Congé Normalisé entitlement in days';
COMMENT ON COLUMN users.jc_entitlement IS 'Annual Jour Chômé entitlement in days';

CREATE INDEX idx_users_org_active ON users(organization_id, is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_matricule ON users(organization_id, matricule);

-- ============================================
-- TABLE: shift_types
-- Dynamic shift/prestation configuration
-- Source of truth from generate.py:
-- LISTE_PRESTATIONS + LISTE_REPOS + special codes
-- ============================================

CREATE TABLE shift_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Identity
    code VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    category shift_category NOT NULL,

    -- Visual styling
    color_hex CHAR(6) NOT NULL,             -- Without # (e.g., 'FFD9E6')
    icon VARCHAR(50),

    -- Hour calculations (from generate.py)
    -- duration_hours: total work hours credited
    -- night_hours: subset of duration that counts as night work
    duration_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    night_hours DECIMAL(4,2) NOT NULL DEFAULT 0.00,

    -- Behavior flags
    is_countable BOOLEAN DEFAULT true,       -- Counts toward hour quota (160h/period)
    requires_recovery BOOLEAN DEFAULT false, -- Requires RR if worked on holiday
    is_holiday_indicator BOOLEAN DEFAULT false, -- Marks holiday work (7xxx codes)
    is_rest_day BOOLEAN DEFAULT false,       -- RH, CH, etc.

    -- Display
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, code)
);

COMMENT ON TABLE shift_types IS 'Dynamic prestation/repos types configuration';
COMMENT ON COLUMN shift_types.night_hours IS 'Night hours subset (8h for 121/6121/7121, 2h for standard)';
COMMENT ON COLUMN shift_types.is_holiday_indicator IS 'True for 7xxx codes that indicate holiday work';

CREATE INDEX idx_shift_types_org_active ON shift_types(organization_id, is_active);
CREATE INDEX idx_shift_types_code ON shift_types(organization_id, code);
CREATE INDEX idx_shift_types_category ON shift_types(category);

-- ============================================
-- TABLE: periods
-- 13 periods of 28 days each = 364 days/year
-- ============================================

CREATE TABLE periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 13),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hour_quota INTEGER NOT NULL DEFAULT 160, -- Standard: 20 workdays × 8h

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, year, number),
    CHECK (end_date > start_date),
    CHECK (end_date - start_date = 27) -- 28 days (0-indexed difference)
);

COMMENT ON TABLE periods IS '13 periods of 28 days each per year';
COMMENT ON COLUMN periods.hour_quota IS 'Maximum hours per period (default 160h)';

CREATE INDEX idx_periods_org_year ON periods(organization_id, year);
CREATE INDEX idx_periods_dates ON periods(start_date, end_date);

-- ============================================
-- TABLE: holidays
-- Fixed and moveable holidays (Computus-based)
-- ============================================

CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    -- Easter-based holidays are moveable
    is_moveable BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, date)
);

COMMENT ON TABLE holidays IS 'Public holidays per organization';
COMMENT ON COLUMN holidays.is_moveable IS 'True for Easter-derived holidays';

CREATE INDEX idx_holidays_org_date ON holidays(organization_id, date);
CREATE INDEX idx_holidays_org_year ON holidays(organization_id, EXTRACT(YEAR FROM date));

-- ============================================
-- TABLE: schedules
-- Main planning data - one entry per user per day
-- ============================================

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_type_id UUID REFERENCES shift_types(id) ON DELETE SET NULL,
    period_id UUID REFERENCES periods(id) ON DELETE SET NULL,

    date DATE NOT NULL,
    -- Denormalized for performance
    is_holiday BOOLEAN DEFAULT false,
    notes TEXT,

    -- Audit trail
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One shift per user per day
    UNIQUE(user_id, date)
);

COMMENT ON TABLE schedules IS 'Main planning matrix - one shift per user per day';

CREATE INDEX idx_schedules_user_date ON schedules(user_id, date);
CREATE INDEX idx_schedules_org_date ON schedules(organization_id, date);
CREATE INDEX idx_schedules_period ON schedules(period_id);
CREATE INDEX idx_schedules_shift_type ON schedules(shift_type_id);
-- Composite index for matrix view
CREATE INDEX idx_schedules_matrix ON schedules(organization_id, date, user_id);

-- ============================================
-- TABLE: period_balances
-- Pre-calculated/cached period statistics per user
-- Updated on schedule changes
-- ============================================

CREATE TABLE period_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Hour calculations
    total_hours DECIMAL(6,2) DEFAULT 0,
    night_hours DECIMAL(6,2) DEFAULT 0,

    -- Quota counts (for validation)
    ch_count INTEGER DEFAULT 0,  -- Must be 4
    rh_count INTEGER DEFAULT 0,  -- Must be 4
    cv_count INTEGER DEFAULT 0,  -- Must be 1
    rr_count INTEGER DEFAULT 0,  -- Must match holidays_worked
    cn_count INTEGER DEFAULT 0,
    jc_count INTEGER DEFAULT 0,

    -- Holiday tracking
    holidays_worked INTEGER DEFAULT 0,

    -- Validation status
    is_valid BOOLEAN DEFAULT false,
    -- Array of error messages
    validation_errors JSONB DEFAULT '[]'::JSONB,

    calculated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(period_id, user_id)
);

COMMENT ON TABLE period_balances IS 'Cached period statistics for quota validation';
COMMENT ON COLUMN period_balances.is_valid IS 'True if all quotas met (4 CH, 4 RH, 1 CV, RR=holidays)';

CREATE INDEX idx_period_balances_user ON period_balances(user_id);
CREATE INDEX idx_period_balances_valid ON period_balances(is_valid);
CREATE INDEX idx_period_balances_period_user ON period_balances(period_id, user_id);

-- ============================================
-- TABLE: leave_requests
-- Agent leave request workflow
-- ============================================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_type_id UUID NOT NULL REFERENCES shift_types(id),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,

    status leave_status DEFAULT 'pending',
    notes TEXT,

    -- Approval workflow
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (end_date >= start_date),
    CHECK (days_count > 0)
);

COMMENT ON TABLE leave_requests IS 'Agent leave/absence requests';

CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_pending ON leave_requests(organization_id, status) WHERE status = 'pending';

-- ============================================
-- TABLE: notifications
-- In-app notifications
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',

    is_read BOOLEAN DEFAULT false,
    -- Additional context data
    data JSONB DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'User notifications';

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_notifications_user_recent ON notifications(user_id, created_at DESC);

-- ============================================
-- TABLE: audit_logs
-- Complete audit trail
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,

    -- Before/after state
    old_value JSONB,
    new_value JSONB,

    -- Request context
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Complete audit trail for compliance';

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ============================================
-- TABLE: refresh_tokens
-- JWT refresh token management
-- ============================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens';

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_valid ON refresh_tokens(user_id, expires_at)
    WHERE revoked_at IS NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get period for a specific date
CREATE OR REPLACE FUNCTION get_period_for_date(
    p_org_id UUID,
    p_date DATE
) RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM periods
        WHERE organization_id = p_org_id
          AND p_date BETWEEN start_date AND end_date
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate periods for a year (from anchor date)
CREATE OR REPLACE FUNCTION generate_periods_for_year(
    p_org_id UUID,
    p_year INTEGER
) RETURNS SETOF periods AS $$
DECLARE
    v_anchor DATE;
    v_delta_years INTEGER;
    v_start DATE;
    v_period_start DATE;
    v_period_end DATE;
    v_period periods;
    i INTEGER;
BEGIN
    -- Get organization's anchor date
    SELECT year_start_date INTO v_anchor
    FROM organizations WHERE id = p_org_id;

    IF v_anchor IS NULL THEN
        v_anchor := '2026-01-12'::DATE;
    END IF;

    -- Calculate start date for target year
    v_delta_years := p_year - EXTRACT(YEAR FROM v_anchor)::INTEGER;
    v_start := v_anchor + (364 * v_delta_years)::INTEGER;

    -- Generate 13 periods
    FOR i IN 1..13 LOOP
        v_period_start := v_start + (28 * (i - 1))::INTEGER;
        v_period_end := v_period_start + 27;

        INSERT INTO periods (organization_id, year, number, start_date, end_date)
        VALUES (p_org_id, p_year, i, v_period_start, v_period_end)
        ON CONFLICT (organization_id, year, number) DO UPDATE
        SET start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date
        RETURNING * INTO v_period;

        RETURN NEXT v_period;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Validate period quotas for a user
CREATE OR REPLACE FUNCTION validate_period_quotas(
    p_period_id UUID,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_balance RECORD;
    v_errors JSONB := '[]'::JSONB;
BEGIN
    SELECT * INTO v_balance
    FROM period_balances
    WHERE period_id = p_period_id AND user_id = p_user_id;

    IF v_balance IS NULL THEN
        RETURN '["Balance not calculated"]'::JSONB;
    END IF;

    -- Hard constraint: CH must be 4
    IF v_balance.ch_count != 4 THEN
        v_errors := v_errors || jsonb_build_array(
            format('CH: %s/4 (Congé Habituel)', v_balance.ch_count)
        );
    END IF;

    -- Hard constraint: RH must be 4
    IF v_balance.rh_count != 4 THEN
        v_errors := v_errors || jsonb_build_array(
            format('RH: %s/4 (Repos Hebdomadaire)', v_balance.rh_count)
        );
    END IF;

    -- Hard constraint: CV must be 1
    IF v_balance.cv_count != 1 THEN
        v_errors := v_errors || jsonb_build_array(
            format('CV: %s/1 (Congé Vieillesse)', v_balance.cv_count)
        );
    END IF;

    -- Hard constraint: RR >= holidays_worked
    IF v_balance.holidays_worked > 0 AND v_balance.rr_count < v_balance.holidays_worked THEN
        v_errors := v_errors || jsonb_build_array(
            format('RR manquant: %s férié(s) travaillé(s), %s RR planifié(s)',
                   v_balance.holidays_worked, v_balance.rr_count)
        );
    END IF;

    -- Hard constraint: total_hours <= 160
    IF v_balance.total_hours > 160 THEN
        v_errors := v_errors || jsonb_build_array(
            format('Heures: %.1f/160 (dépassement)', v_balance.total_hours)
        );
    END IF;

    RETURN v_errors;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recalculate period balance for a user
CREATE OR REPLACE FUNCTION recalculate_period_balance(
    p_period_id UUID,
    p_user_id UUID
) RETURNS period_balances AS $$
DECLARE
    v_balance period_balances;
    v_period RECORD;
    v_errors JSONB;
BEGIN
    -- Get period info
    SELECT * INTO v_period FROM periods WHERE id = p_period_id;

    IF v_period IS NULL THEN
        RAISE EXCEPTION 'Period not found: %', p_period_id;
    END IF;

    -- Calculate aggregates from schedules
    INSERT INTO period_balances (
        period_id, user_id,
        total_hours, night_hours,
        ch_count, rh_count, cv_count, rr_count, cn_count, jc_count,
        holidays_worked
    )
    SELECT
        p_period_id,
        p_user_id,
        COALESCE(SUM(st.duration_hours), 0) AS total_hours,
        COALESCE(SUM(st.night_hours), 0) AS night_hours,
        COUNT(*) FILTER (WHERE st.code = 'CH') AS ch_count,
        COUNT(*) FILTER (WHERE st.code = 'RH') AS rh_count,
        COUNT(*) FILTER (WHERE st.code = 'CV') AS cv_count,
        COUNT(*) FILTER (WHERE st.code = 'RR') AS rr_count,
        COUNT(*) FILTER (WHERE st.code = 'CN') AS cn_count,
        COUNT(*) FILTER (WHERE st.code = 'JC') AS jc_count,
        COUNT(*) FILTER (WHERE s.is_holiday AND st.is_countable) AS holidays_worked
    FROM schedules s
    LEFT JOIN shift_types st ON s.shift_type_id = st.id
    WHERE s.user_id = p_user_id
      AND s.date BETWEEN v_period.start_date AND v_period.end_date
    ON CONFLICT (period_id, user_id) DO UPDATE
    SET total_hours = EXCLUDED.total_hours,
        night_hours = EXCLUDED.night_hours,
        ch_count = EXCLUDED.ch_count,
        rh_count = EXCLUDED.rh_count,
        cv_count = EXCLUDED.cv_count,
        rr_count = EXCLUDED.rr_count,
        cn_count = EXCLUDED.cn_count,
        jc_count = EXCLUDED.jc_count,
        holidays_worked = EXCLUDED.holidays_worked,
        calculated_at = NOW();

    -- Validate and update status
    v_errors := validate_period_quotas(p_period_id, p_user_id);

    UPDATE period_balances
    SET is_valid = (jsonb_array_length(v_errors) = 0),
        validation_errors = v_errors
    WHERE period_id = p_period_id AND user_id = p_user_id
    RETURNING * INTO v_balance;

    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER tr_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_shift_types_updated_at
    BEFORE UPDATE ON shift_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- Planning matrix view (for efficient querying)
CREATE OR REPLACE VIEW v_planning_matrix AS
SELECT
    s.organization_id,
    s.user_id,
    u.first_name,
    u.last_name,
    u.matricule,
    s.date,
    EXTRACT(DOW FROM s.date) AS day_of_week,
    s.period_id,
    p.number AS period_number,
    st.code AS shift_code,
    st.description AS shift_description,
    st.color_hex,
    st.duration_hours,
    st.night_hours,
    st.category,
    s.is_holiday,
    s.notes
FROM schedules s
JOIN users u ON s.user_id = u.id
LEFT JOIN shift_types st ON s.shift_type_id = st.id
LEFT JOIN periods p ON s.period_id = p.id;

COMMENT ON VIEW v_planning_matrix IS 'Flattened view for planning grid display';

-- User leave balance view
CREATE OR REPLACE VIEW v_user_leave_balance AS
SELECT
    u.id AS user_id,
    u.organization_id,
    u.first_name,
    u.last_name,
    -- CN balance
    u.cn_entitlement + u.cn_carryover AS cn_total,
    COALESCE(cn_taken.count, 0) AS cn_taken,
    (u.cn_entitlement + u.cn_carryover - COALESCE(cn_taken.count, 0)) AS cn_remaining,
    -- JC balance
    u.jc_entitlement + u.jc_carryover AS jc_total,
    COALESCE(jc_taken.count, 0) AS jc_taken,
    (u.jc_entitlement + u.jc_carryover - COALESCE(jc_taken.count, 0)) AS jc_remaining
FROM users u
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count
    FROM schedules s
    JOIN shift_types st ON s.shift_type_id = st.id
    WHERE s.user_id = u.id AND st.code = 'CN'
      AND EXTRACT(YEAR FROM s.date) = EXTRACT(YEAR FROM CURRENT_DATE)
) cn_taken ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count
    FROM schedules s
    JOIN shift_types st ON s.shift_type_id = st.id
    WHERE s.user_id = u.id AND st.code = 'JC'
      AND EXTRACT(YEAR FROM s.date) = EXTRACT(YEAR FROM CURRENT_DATE)
) jc_taken ON true
WHERE u.is_active = true;

COMMENT ON VIEW v_user_leave_balance IS 'Current year leave balance per user';

-- Period validation summary view
CREATE OR REPLACE VIEW v_period_validation_summary AS
SELECT
    p.id AS period_id,
    p.organization_id,
    p.year,
    p.number AS period_number,
    p.start_date,
    p.end_date,
    COUNT(DISTINCT pb.user_id) AS users_scheduled,
    COUNT(*) FILTER (WHERE pb.is_valid) AS users_valid,
    COUNT(*) FILTER (WHERE NOT pb.is_valid) AS users_invalid,
    ROUND(
        (COUNT(*) FILTER (WHERE pb.is_valid)::NUMERIC / NULLIF(COUNT(DISTINCT pb.user_id), 0) * 100),
        1
    ) AS compliance_percent
FROM periods p
LEFT JOIN period_balances pb ON p.id = pb.period_id
GROUP BY p.id, p.organization_id, p.year, p.number, p.start_date, p.end_date;

COMMENT ON VIEW v_period_validation_summary IS 'Period compliance overview';
