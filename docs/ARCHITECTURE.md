# PlanningOS - Architecture Documentation

> **Version**: 1.0.0
> **Last Updated**: 2026-02-02
> **Stack**: Rust/Tauri v2 + React 19 + Neon PostgreSQL

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Technical Stack](#technical-stack)
4. [Database Schema](#database-schema)
5. [Hexagonal Architecture](#hexagonal-architecture)
6. [Data Flow](#data-flow)
7. [Business Rules Engine](#business-rules-engine)
8. [API Design](#api-design)
9. [Security Model](#security-model)

---

## System Overview

PlanningOS is a workforce scheduling platform designed for **Planners** (managers) and **Agents** (employees). It manages shift assignments across a 364-day cycle divided into 13 periods of 28 days each.

### Core Concepts

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TEMPORAL STRUCTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│  Year (364 days) = 13 Periods × 28 days                             │
│  Period = 4 weeks (P1 → P13)                                        │
│  Week = 7 days                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  QUOTAS PER PERIOD (Hard Constraints):                              │
│  • 4 CH (Congé Habituel - Regular Leave)                            │
│  • 4 RH (Repos Hebdomadaire - Weekly Rest)                          │
│  • 1 CV (Congé Vieillesse - Seniority Leave)                        │
│  • RR required if worked on holiday (F)                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Shift Code Categories

| Category | Codes | Duration | Night Hours |
|----------|-------|----------|-------------|
| **Standard** | 101, 102, 6101, 6102, 7101, 7102 | 8h | 2h |
| **Intermediate** | 111, 112, 6111, 6112, 7111, 7112 | 8h | 2h |
| **Night** | 121, 6121, 7121 | 8h | 8h |
| **Partial** | X_AM, X_PM | 8h | 2h |
| **Special** | X_10 | 10h | 0h |
| **Strike** | AG | 8h | 0h |
| **Rest** | RH, CH, RR, CV, ZM | 0h | 0h |
| **Leave** | CN, JC | 8h | 0h |

---

## Monorepo Structure

```
PlanningOs/
├── apps/
│   ├── web/                          # React SPA (Vite)
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI components
│   │   │   │   ├── ui/               # Shadcn/ui primitives
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   └── common/           # Shared components
│   │   │   ├── features/             # Feature modules
│   │   │   │   ├── auth/             # Authentication
│   │   │   │   ├── planning/         # Planning board (Planner)
│   │   │   │   ├── schedule/         # Personal schedule (Agent)
│   │   │   │   ├── admin/            # Administration
│   │   │   │   └── dashboard/        # Statistics dashboard
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities & API client
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── types/                # TypeScript types
│   │   │   └── styles/               # Global styles
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   └── desktop/                      # Tauri v2 Application
│       ├── src/                      # React frontend (shared with web)
│       └── src-tauri/
│           ├── src/
│           │   ├── main.rs           # Tauri entry point
│           │   ├── lib.rs            # Library exports
│           │   ├── commands/         # Tauri commands
│           │   └── state/            # App state management
│           ├── Cargo.toml
│           ├── tauri.conf.json
│           └── capabilities/
│
├── packages/
│   ├── api/                          # Rust Backend (Axum)
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── lib.rs
│   │   │   ├── domain/               # Business entities & rules
│   │   │   │   ├── mod.rs
│   │   │   │   ├── entities/
│   │   │   │   │   ├── user.rs
│   │   │   │   │   ├── shift_type.rs
│   │   │   │   │   ├── period.rs
│   │   │   │   │   ├── schedule.rs
│   │   │   │   │   └── validation.rs
│   │   │   │   ├── value_objects/
│   │   │   │   │   ├── shift_code.rs
│   │   │   │   │   ├── night_hours.rs
│   │   │   │   │   └── period_quota.rs
│   │   │   │   └── services/
│   │   │   │       ├── period_calculator.rs
│   │   │   │       ├── quota_validator.rs
│   │   │   │       └── holiday_calculator.rs
│   │   │   ├── application/          # Use cases
│   │   │   │   ├── mod.rs
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create_schedule.rs
│   │   │   │   │   ├── update_shift.rs
│   │   │   │   │   └── validate_period.rs
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get_planning.rs
│   │   │   │   │   ├── get_statistics.rs
│   │   │   │   │   └── get_agent_balance.rs
│   │   │   │   └── ports/
│   │   │   │       ├── repository.rs
│   │   │   │       └── event_bus.rs
│   │   │   ├── infrastructure/       # External adapters
│   │   │   │   ├── mod.rs
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── postgres.rs
│   │   │   │   │   └── repositories/
│   │   │   │   ├── auth/
│   │   │   │   │   └── jwt.rs
│   │   │   │   └── events/
│   │   │   │       └── in_memory.rs
│   │   │   └── api/                  # HTTP handlers
│   │   │       ├── mod.rs
│   │   │       ├── routes.rs
│   │   │       ├── handlers/
│   │   │       ├── middleware/
│   │   │       └── dto/
│   │   ├── Cargo.toml
│   │   └── .env.example
│   │
│   ├── db/                           # Database package
│   │   ├── src/
│   │   │   ├── migrations/           # SQLx migrations
│   │   │   └── seeds/                # Initial data
│   │   └── sqlx-data.json
│   │
│   └── shared/                       # Shared code
│       ├── src/
│       │   ├── types/                # Shared TypeScript types
│       │   ├── utils/                # Shared utilities
│       │   └── constants/            # Business constants
│       └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md               # This file
│   ├── INIT_GIT.md
│   ├── SETUP_DEV.md
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
│
├── Cargo.toml                        # Workspace root
├── package.json                      # NPM workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Technical Stack

### Backend (Rust)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Tokio | 1.x | Async runtime |
| Web Framework | Axum | 0.8.x | HTTP server |
| Database | SQLx | 0.8.x | Async PostgreSQL |
| Auth | jsonwebtoken | 9.x | JWT handling |
| Validation | validator | 0.18.x | Input validation |
| Serialization | serde | 1.x | JSON/data serialization |
| Error Handling | thiserror | 2.x | Error types |
| Logging | tracing | 0.1.x | Structured logging |
| Config | config | 0.14.x | Configuration management |

### Frontend (TypeScript/React)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 19.x | UI framework |
| Build | Vite | 6.x | Build tool |
| Language | TypeScript | 5.7.x | Type safety |
| Styling | Tailwind CSS | 4.x | Utility CSS |
| Components | shadcn/ui | latest | UI primitives |
| Animation | Framer Motion | 12.x | Animations |
| Icons | Lucide React | latest | Icon library |
| State | Zustand | 5.x | Global state |
| Server State | TanStack Query | 5.x | Data fetching |
| Tables | TanStack Virtual | 3.x | Virtualization |
| Forms | React Hook Form | 7.x | Form handling |
| Validation | Zod | 3.x | Schema validation |
| Router | React Router | 7.x | Navigation |
| Date | date-fns | 4.x | Date manipulation |

### Desktop (Tauri v2)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Core | Tauri | 2.x | Desktop framework |
| Updater | tauri-plugin-updater | 2.x | Auto-updates |
| Store | tauri-plugin-store | 2.x | Local persistence |
| Shell | tauri-plugin-shell | 2.x | System integration |

### Database (Neon)

| Component | Technology | Purpose |
|-----------|------------|---------|
| Provider | Neon | Serverless PostgreSQL |
| Version | PostgreSQL 16 | Database engine |
| Extensions | uuid-ossp, pgcrypto | UUID & crypto |

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users       │       │      roles       │       │  organizations   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │───┐   │ id (PK)          │       │ id (PK)          │
│ organization_id  │──┐│   │ name             │       │ name             │
│ role_id (FK)     │──┼┘   │ permissions[]    │       │ config (JSONB)   │
│ email            │  │    │ created_at       │       │ year_start_date  │
│ password_hash    │  │    └──────────────────┘       │ created_at       │
│ first_name       │  │                               └──────────────────┘
│ last_name        │  │
│ matricule        │  │
│ cn_entitlement   │  │
│ jc_entitlement   │  │
│ cn_carryover     │  │
│ jc_carryover     │  │
│ is_active        │  │
│ created_at       │  │
│ updated_at       │  └────────────────────────────────────────┐
└──────────────────┘                                            │
         │                                                      │
         │ 1:N                                                  │
         ▼                                                      │
┌──────────────────┐       ┌──────────────────┐                │
│    schedules     │       │   shift_types    │                │
├──────────────────┤       ├──────────────────┤                │
│ id (PK)          │       │ id (PK)          │                │
│ user_id (FK)     │───────│ organization_id  │◄───────────────┘
│ shift_type_id    │───────│ code             │
│ date             │       │ description      │
│ period_id (FK)   │───┐   │ category         │
│ is_holiday       │   │   │ color_hex        │
│ notes            │   │   │ duration_hours   │
│ created_by       │   │   │ night_hours      │
│ created_at       │   │   │ is_countable     │
│ updated_at       │   │   │ display_order    │
└──────────────────┘   │   │ is_active        │
                       │   │ created_at       │
                       │   │ updated_at       │
                       │   └──────────────────┘
                       │
                       │
                       ▼
┌──────────────────┐       ┌──────────────────┐
│     periods      │       │    holidays      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ organization_id  │       │ organization_id  │
│ year             │       │ date             │
│ number (1-13)    │       │ name             │
│ start_date       │       │ is_moveable      │
│ end_date         │       │ created_at       │
│ hour_quota       │       └──────────────────┘
│ created_at       │
└──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐
│ period_balances  │       │   audit_logs     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ period_id (FK)   │       │ organization_id  │
│ user_id (FK)     │       │ user_id          │
│ total_hours      │       │ action           │
│ night_hours      │       │ entity_type      │
│ ch_count         │       │ entity_id        │
│ rh_count         │       │ old_value (JSON) │
│ cv_count         │       │ new_value (JSON) │
│ rr_count         │       │ ip_address       │
│ holiday_worked   │       │ user_agent       │
│ is_valid         │       │ created_at       │
│ validation_errors│       └──────────────────┘
│ calculated_at    │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  leave_requests  │       │  notifications   │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ user_id (FK)     │       │ user_id (FK)     │
│ shift_type_id    │       │ title            │
│ start_date       │       │ message          │
│ end_date         │       │ type             │
│ status           │       │ is_read          │
│ approved_by      │       │ data (JSONB)     │
│ approved_at      │       │ created_at       │
│ notes            │       └──────────────────┘
│ created_at       │
└──────────────────┘
```

### SQL Schema (Neon PostgreSQL)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'planner', 'agent');
CREATE TYPE shift_category AS ENUM ('standard', 'intermediate', 'night', 'partial', 'special', 'rest', 'leave');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout');

-- ============================================
-- ORGANIZATIONS
-- ============================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    config JSONB DEFAULT '{}',
    year_start_date DATE NOT NULL DEFAULT '2026-01-12',
    timezone VARCHAR(50) DEFAULT 'Europe/Brussels',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROLES & PERMISSIONS
-- ============================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

    -- Auth
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    matricule VARCHAR(50),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),

    -- Leave entitlements (per year)
    cn_entitlement INTEGER DEFAULT 20,      -- Congé Normalisé annual entitlement
    jc_entitlement INTEGER DEFAULT 10,      -- Jour Chômé annual entitlement
    cn_carryover INTEGER DEFAULT 0,         -- Carried over from previous year
    jc_carryover INTEGER DEFAULT 0,         -- Carried over from previous year

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

CREATE INDEX idx_users_org_active ON users(organization_id, is_active);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- SHIFT TYPES (Prestations & Repos)
-- ============================================

CREATE TABLE shift_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Identity
    code VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    category shift_category NOT NULL,

    -- Visual
    color_hex CHAR(6) NOT NULL,             -- e.g., 'FFD9E6' (without #)
    icon VARCHAR(50),

    -- Hour calculations
    duration_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    night_hours DECIMAL(4,2) NOT NULL DEFAULT 0.00,

    -- Behavior flags
    is_countable BOOLEAN DEFAULT true,       -- Counts toward hour quota
    requires_recovery BOOLEAN DEFAULT false, -- Requires RR if on holiday
    is_holiday_indicator BOOLEAN DEFAULT false,

    -- Display
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, code)
);

CREATE INDEX idx_shift_types_org_active ON shift_types(organization_id, is_active);
CREATE INDEX idx_shift_types_category ON shift_types(category);

-- ============================================
-- PERIODS (13 periods × 28 days)
-- ============================================

CREATE TABLE periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    year INTEGER NOT NULL,
    number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 13),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hour_quota INTEGER NOT NULL DEFAULT 160, -- 20 days × 8h

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, year, number),
    CHECK (end_date > start_date),
    CHECK (end_date - start_date = 27) -- 28 days (0-indexed)
);

CREATE INDEX idx_periods_org_year ON periods(organization_id, year);
CREATE INDEX idx_periods_dates ON periods(start_date, end_date);

-- ============================================
-- HOLIDAYS
-- ============================================

CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_moveable BOOLEAN DEFAULT false,      -- Easter-based holidays

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, date)
);

CREATE INDEX idx_holidays_org_date ON holidays(organization_id, date);

-- ============================================
-- SCHEDULES (Main planning data)
-- ============================================

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_type_id UUID REFERENCES shift_types(id) ON DELETE SET NULL,
    period_id UUID REFERENCES periods(id) ON DELETE SET NULL,

    date DATE NOT NULL,
    is_holiday BOOLEAN DEFAULT false,
    notes TEXT,

    -- Audit
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, date)
);

CREATE INDEX idx_schedules_user_date ON schedules(user_id, date);
CREATE INDEX idx_schedules_org_date ON schedules(organization_id, date);
CREATE INDEX idx_schedules_period ON schedules(period_id);
CREATE INDEX idx_schedules_shift_type ON schedules(shift_type_id);

-- ============================================
-- PERIOD BALANCES (Computed/cached)
-- ============================================

CREATE TABLE period_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Hour calculations
    total_hours DECIMAL(6,2) DEFAULT 0,
    night_hours DECIMAL(6,2) DEFAULT 0,

    -- Quota counts
    ch_count INTEGER DEFAULT 0,
    rh_count INTEGER DEFAULT 0,
    cv_count INTEGER DEFAULT 0,
    rr_count INTEGER DEFAULT 0,
    cn_count INTEGER DEFAULT 0,
    jc_count INTEGER DEFAULT 0,

    -- Holiday tracking
    holidays_worked INTEGER DEFAULT 0,

    -- Validation
    is_valid BOOLEAN DEFAULT false,
    validation_errors JSONB DEFAULT '[]',

    calculated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(period_id, user_id)
);

CREATE INDEX idx_period_balances_user ON period_balances(user_id);
CREATE INDEX idx_period_balances_valid ON period_balances(is_valid);

-- ============================================
-- LEAVE REQUESTS
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

    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (end_date >= start_date)
);

CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',

    is_read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,

    old_value JSONB,
    new_value JSONB,

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- REFRESH TOKENS (for JWT)
-- ============================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Calculate period for a given date
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
$$ LANGUAGE plpgsql;

-- Validate period quotas
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

    -- Check CH quota (must be 4)
    IF v_balance.ch_count != 4 THEN
        v_errors := v_errors || jsonb_build_array(
            format('CH count is %s, expected 4', v_balance.ch_count)
        );
    END IF;

    -- Check RH quota (must be 4)
    IF v_balance.rh_count != 4 THEN
        v_errors := v_errors || jsonb_build_array(
            format('RH count is %s, expected 4', v_balance.rh_count)
        );
    END IF;

    -- Check CV quota (must be 1)
    IF v_balance.cv_count != 1 THEN
        v_errors := v_errors || jsonb_build_array(
            format('CV count is %s, expected 1', v_balance.cv_count)
        );
    END IF;

    -- Check RR requirement for holidays worked
    IF v_balance.holidays_worked > 0 AND v_balance.rr_count < v_balance.holidays_worked THEN
        v_errors := v_errors || jsonb_build_array(
            format('Missing RR: %s holidays worked but only %s RR',
                   v_balance.holidays_worked, v_balance.rr_count)
        );
    END IF;

    -- Check hour quota (max 160)
    IF v_balance.total_hours > 160 THEN
        v_errors := v_errors || jsonb_build_array(
            format('Hours exceeded: %s > 160', v_balance.total_hours)
        );
    END IF;

    RETURN v_errors;
END;
$$ LANGUAGE plpgsql;
```

---

## Hexagonal Architecture

The Rust backend follows **Hexagonal Architecture** (Ports & Adapters) for clean separation of concerns.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INFRASTRUCTURE                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           API LAYER                                  │   │
│  │   HTTP Handlers │ DTOs │ Middleware │ OpenAPI                       │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────▼───────────────────────────────────────┐   │
│  │                        APPLICATION LAYER                             │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │   Commands   │    │   Queries    │    │    Ports     │         │   │
│  │   │              │    │              │    │  (Traits)    │         │   │
│  │   │ CreateShift  │    │ GetPlanning  │    │              │         │   │
│  │   │ UpdateShift  │    │ GetStats     │    │ Repository   │         │   │
│  │   │ ValidatePer. │    │ GetBalance   │    │ EventBus     │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────▼───────────────────────────────────────┐   │
│  │                          DOMAIN LAYER                                │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │   Entities   │    │ Value Objects│    │  Services    │         │   │
│  │   │              │    │              │    │              │         │   │
│  │   │ User         │    │ ShiftCode    │    │ PeriodCalc   │         │   │
│  │   │ ShiftType    │    │ NightHours   │    │ QuotaValid   │         │   │
│  │   │ Schedule     │    │ PeriodQuota  │    │ HolidayCalc  │         │   │
│  │   │ Period       │    │ Color        │    │              │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ADAPTERS (Infrastructure)                     │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │   │
│  │   │  PostgreSQL  │    │     JWT      │    │   Events     │         │   │
│  │   │  Repository  │    │    Auth      │    │   InMemory   │         │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Directory Mapping

```rust
// packages/api/src/

// Domain Layer - Pure business logic, no external dependencies
domain/
├── entities/
│   ├── user.rs           // User aggregate
│   ├── shift_type.rs     // ShiftType entity
│   ├── schedule.rs       // Schedule aggregate
│   └── period.rs         // Period entity
├── value_objects/
│   ├── shift_code.rs     // Validated shift code
│   ├── night_hours.rs    // Night hours calculation
│   └── period_quota.rs   // Quota validation result
└── services/
    ├── period_calculator.rs   // Period date calculations
    ├── quota_validator.rs     // Quota validation logic
    └── holiday_calculator.rs  // Computus algorithm

// Application Layer - Use cases, orchestration
application/
├── commands/
│   ├── create_schedule.rs    // Create/update schedule command
│   ├── update_shift.rs       // Update single shift
│   └── validate_period.rs    // Trigger period validation
├── queries/
│   ├── get_planning.rs       // Get planning matrix
│   ├── get_statistics.rs     // Get period statistics
│   └── get_agent_balance.rs  // Get agent's leave balance
└── ports/
    ├── repository.rs         // Repository traits
    └── event_bus.rs          // Event publishing trait

// Infrastructure Layer - External adapters
infrastructure/
├── persistence/
│   ├── postgres.rs           // Connection pool
│   └── repositories/
│       ├── user_repo.rs
│       ├── schedule_repo.rs
│       └── shift_type_repo.rs
├── auth/
│   └── jwt.rs                // JWT implementation
└── events/
    └── in_memory.rs          // In-memory event bus

// API Layer - HTTP interface
api/
├── routes.rs                 // Route definitions
├── handlers/
│   ├── auth.rs
│   ├── users.rs
│   ├── schedules.rs
│   └── shift_types.rs
├── middleware/
│   ├── auth.rs               // JWT validation
│   ├── cors.rs
│   └── logging.rs
└── dto/
    ├── requests.rs           // Input DTOs
    └── responses.rs          // Output DTOs
```

---

## Data Flow

### 1. Schedule Update Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   API    │────▶│ Command  │────▶│  Domain  │
│ (React)  │     │ Handler  │     │ Handler  │     │ Service  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                        │
     ┌──────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Quota   │────▶│Repository│────▶│PostgreSQL│     │ WebSocket│
│Validator │     │  (Port)  │     │  (Neon)  │────▶│  Event   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 2. Planning View Flow (Read)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ TanStack │────▶│   API    │
│ (React)  │     │  Query   │     │ Handler  │
└──────────┘     └──────────┘     └──────────┘
                      │                 │
                      │                 ▼
                      │           ┌──────────┐
                      │           │  Query   │
                      │           │ Handler  │
                      │           └──────────┘
                      │                 │
                      │                 ▼
                      │           ┌──────────┐
                      │           │PostgreSQL│
                      │           │  (Neon)  │
                      │           └──────────┘
                      │                 │
                      ▼                 │
                 ┌──────────┐          │
                 │  Cache   │◀─────────┘
                 │(staleTime)│
                 └──────────┘
```

### 3. Real-time Validation Flow

```
User Input → Debounce(300ms) → API Call → Domain Validation
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                    │
                    ▼                                                    ▼
              [Valid]                                              [Invalid]
                    │                                                    │
                    ▼                                                    ▼
            Save to DB                                          Return Errors
                    │                                                    │
                    ▼                                                    ▼
            Broadcast Event                                    Show UI Alerts
                    │                                        (Red indicators)
                    ▼
            Update Other Clients
```

---

## Business Rules Engine

### Period Calculation (Rust Implementation)

```rust
// packages/api/src/domain/services/period_calculator.rs

use chrono::{NaiveDate, Duration};

pub struct PeriodCalculator {
    anchor_date: NaiveDate, // 2026-01-12
}

impl PeriodCalculator {
    pub fn new(anchor_date: NaiveDate) -> Self {
        Self { anchor_date }
    }

    /// Calculate all 13 periods for a given year
    pub fn calculate_periods(&self, year: i32) -> Vec<Period> {
        let delta_years = year - 2026;
        let start = self.anchor_date + Duration::days(364 * delta_years as i64);

        (1..=13)
            .map(|i| {
                let period_start = start + Duration::days(28 * (i - 1) as i64);
                let period_end = period_start + Duration::days(27);

                Period {
                    number: i,
                    start_date: period_start,
                    end_date: period_end,
                    hour_quota: 160,
                }
            })
            .collect()
    }

    /// Find which period contains a specific date
    pub fn get_period_for_date(&self, date: NaiveDate, year: i32) -> Option<u8> {
        self.calculate_periods(year)
            .iter()
            .find(|p| date >= p.start_date && date <= p.end_date)
            .map(|p| p.number)
    }
}
```

### Night Hours Calculation

```rust
// packages/api/src/domain/value_objects/night_hours.rs

#[derive(Debug, Clone, Copy)]
pub enum NightHoursCategory {
    Full,    // 8h night (121, 6121, 7121)
    Partial, // 2h night (101, 102, 111, 112, etc.)
    None,    // 0h night (AG, rest codes)
}

impl NightHoursCategory {
    pub fn from_code(code: &str) -> Self {
        match code {
            "121" | "6121" | "7121" => Self::Full,
            "101" | "102" | "6101" | "6102" | "7101" | "7102" |
            "111" | "112" | "6111" | "6112" | "7111" | "7112" |
            "X_AM" | "X_PM" => Self::Partial,
            _ => Self::None,
        }
    }

    pub fn hours(&self) -> f32 {
        match self {
            Self::Full => 8.0,
            Self::Partial => 2.0,
            Self::None => 0.0,
        }
    }
}
```

### Quota Validation

```rust
// packages/api/src/domain/services/quota_validator.rs

#[derive(Debug)]
pub struct QuotaValidationResult {
    pub is_valid: bool,
    pub errors: Vec<QuotaError>,
    pub warnings: Vec<QuotaWarning>,
}

#[derive(Debug)]
pub enum QuotaError {
    HoursExceeded { actual: f32, max: f32 },
    MissingRecoveryDay { holidays_worked: u8, rr_count: u8 },
}

#[derive(Debug)]
pub enum QuotaWarning {
    ChCountMismatch { actual: u8, expected: u8 },
    RhCountMismatch { actual: u8, expected: u8 },
    CvCountMismatch { actual: u8, expected: u8 },
}

pub fn validate_period_quotas(balance: &PeriodBalance) -> QuotaValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // Hard constraint: hours <= 160
    if balance.total_hours > 160.0 {
        errors.push(QuotaError::HoursExceeded {
            actual: balance.total_hours,
            max: 160.0,
        });
    }

    // Hard constraint: RR required for holidays worked
    if balance.holidays_worked > 0 && balance.rr_count < balance.holidays_worked {
        errors.push(QuotaError::MissingRecoveryDay {
            holidays_worked: balance.holidays_worked,
            rr_count: balance.rr_count,
        });
    }

    // Soft constraints (warnings)
    if balance.ch_count != 4 {
        warnings.push(QuotaWarning::ChCountMismatch {
            actual: balance.ch_count,
            expected: 4,
        });
    }

    if balance.rh_count != 4 {
        warnings.push(QuotaWarning::RhCountMismatch {
            actual: balance.rh_count,
            expected: 4,
        });
    }

    if balance.cv_count != 1 {
        warnings.push(QuotaWarning::CvCountMismatch {
            actual: balance.cv_count,
            expected: 1,
        });
    }

    QuotaValidationResult {
        is_valid: errors.is_empty(),
        errors,
        warnings,
    }
}
```

---

## API Design

### REST Endpoints

```
Authentication
├── POST   /api/v1/auth/login
├── POST   /api/v1/auth/logout
├── POST   /api/v1/auth/refresh
└── GET    /api/v1/auth/me

Users
├── GET    /api/v1/users
├── GET    /api/v1/users/:id
├── POST   /api/v1/users
├── PATCH  /api/v1/users/:id
├── DELETE /api/v1/users/:id
└── GET    /api/v1/users/:id/balance

Shift Types
├── GET    /api/v1/shift-types
├── GET    /api/v1/shift-types/:id
├── POST   /api/v1/shift-types
├── PATCH  /api/v1/shift-types/:id
└── DELETE /api/v1/shift-types/:id

Periods
├── GET    /api/v1/periods
├── GET    /api/v1/periods/:id
├── GET    /api/v1/periods/:id/balances
└── POST   /api/v1/periods/generate

Schedules
├── GET    /api/v1/schedules
├── GET    /api/v1/schedules/matrix
├── POST   /api/v1/schedules
├── PATCH  /api/v1/schedules/:id
├── DELETE /api/v1/schedules/:id
└── POST   /api/v1/schedules/bulk

Leave Requests
├── GET    /api/v1/leave-requests
├── POST   /api/v1/leave-requests
├── PATCH  /api/v1/leave-requests/:id
└── POST   /api/v1/leave-requests/:id/approve

Statistics
├── GET    /api/v1/statistics/period/:id
├── GET    /api/v1/statistics/user/:id
└── GET    /api/v1/statistics/dashboard

Holidays
├── GET    /api/v1/holidays
├── POST   /api/v1/holidays
└── DELETE /api/v1/holidays/:id
```

### WebSocket Events

```typescript
// Real-time updates
interface WSEvent {
  type: 'schedule.updated' | 'period.validated' | 'notification';
  payload: unknown;
  timestamp: string;
}

// Schedule update broadcast
interface ScheduleUpdatedEvent {
  type: 'schedule.updated';
  payload: {
    scheduleId: string;
    userId: string;
    date: string;
    shiftTypeCode: string;
    updatedBy: string;
  };
}
```

---

## Security Model

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Login   │────▶│ Validate │────▶│  Issue   │
│          │     │ Request  │     │ Creds    │     │  Tokens  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                        │
                                  ┌─────────────────────┼─────────────────────┐
                                  │                     │                     │
                                  ▼                     ▼                     ▼
                            Access Token          Refresh Token          HttpOnly
                            (15 min)              (7 days)               Cookie
```

### Role-Based Access Control

| Permission | Admin | Planner | Agent |
|------------|-------|---------|-------|
| Manage users | ✅ | ❌ | ❌ |
| Manage shift types | ✅ | ❌ | ❌ |
| View all schedules | ✅ | ✅ | ❌ |
| Edit all schedules | ✅ | ✅ | ❌ |
| View own schedule | ✅ | ✅ | ✅ |
| Request leave | ✅ | ✅ | ✅ |
| Approve leave | ✅ | ✅ | ❌ |
| View statistics | ✅ | ✅ | Own |
| Manage holidays | ✅ | ❌ | ❌ |

### Security Headers

```rust
// API middleware
fn security_headers() -> impl Layer {
    DefaultHeaders::new()
        .header("X-Content-Type-Options", "nosniff")
        .header("X-Frame-Options", "DENY")
        .header("X-XSS-Protection", "1; mode=block")
        .header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        .header("Content-Security-Policy", "default-src 'self'")
}
```

---

## Performance Considerations

### Frontend Virtualization

The planning matrix can display 50+ agents × 28 days = 1400+ cells. We use **TanStack Virtual** for efficient rendering.

```typescript
// Only render visible rows
const virtualizer = useVirtualizer({
  count: agents.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48, // row height
  overscan: 5,
});
```

### Database Indexing Strategy

```sql
-- Critical indexes for performance
CREATE INDEX idx_schedules_matrix ON schedules(organization_id, date, user_id);
CREATE INDEX idx_schedules_period_stats ON schedules(period_id, shift_type_id);
CREATE INDEX idx_period_balances_lookup ON period_balances(user_id, period_id);
```

### Caching Strategy

- **TanStack Query**: `staleTime: 5 minutes` for planning data
- **Zustand**: Client-side state for UI preferences
- **PostgreSQL**: Materialized views for statistics (refreshed on schedule change)

---

## Appendix: Color Palette

### Shift Type Colors

| Code | Hex | Preview | Description |
|------|-----|---------|-------------|
| 101 | `#FFD9E6` | ![](https://via.placeholder.com/20/FFD9E6/FFD9E6) | Light pink |
| 102 | `#FFE6F0` | ![](https://via.placeholder.com/20/FFE6F0/FFE6F0) | Very light pink |
| 111 | `#D9E6FF` | ![](https://via.placeholder.com/20/D9E6FF/D9E6FF) | Light blue |
| 112 | `#E6F0FF` | ![](https://via.placeholder.com/20/E6F0FF/E6F0FF) | Very light blue |
| 121 | `#FFE6CC` | ![](https://via.placeholder.com/20/FFE6CC/FFE6CC) | Light orange |
| X_AM | `#D9F2D9` | ![](https://via.placeholder.com/20/D9F2D9/D9F2D9) | Light green |
| X_PM | `#D9F2D9` | ![](https://via.placeholder.com/20/D9F2D9/D9F2D9) | Light green |
| X_10 | `#E6D9FF` | ![](https://via.placeholder.com/20/E6D9FF/E6D9FF) | Light purple |
| AG | `#FF4444` | ![](https://via.placeholder.com/20/FF4444/FF4444) | Red (Strike) |
| CN | `#FFFFCC` | ![](https://via.placeholder.com/20/FFFFCC/FFFFCC) | Light yellow |
| JC | `#FFFFCC` | ![](https://via.placeholder.com/20/FFFFCC/FFFFCC) | Light yellow |
| RH | `#CCCCCC` | ![](https://via.placeholder.com/20/CCCCCC/CCCCCC) | Medium gray |
| CH | `#D5D5D5` | ![](https://via.placeholder.com/20/D5D5D5/D5D5D5) | Light gray |
| RR | `#C9C9C9` | ![](https://via.placeholder.com/20/C9C9C9/C9C9C9) | Gray |
| CV | `#96D1CC` | ![](https://via.placeholder.com/20/96D1CC/96D1CC) | Water green |
| ZM | `#F0F0F0` | ![](https://via.placeholder.com/20/F0F0F0/F0F0F0) | Very light gray |

---

*Document maintained by the PlanningOS development team.*
