-- PlanningOS Seed Data
-- Version: 1.0.0
-- Description: Initial seed data including default organization, roles, and shift types

-- ============================================
-- DEFAULT ORGANIZATION
-- ============================================

INSERT INTO organizations (id, name, slug, year_start_date, timezone, config)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'PlanningOS Demo',
    'demo',
    '2026-01-12',
    'Europe/Brussels',
    '{
        "defaultLanguage": "fr",
        "dateFormat": "DD/MM/YYYY",
        "weekStartsOn": 1
    }'::JSONB
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SYSTEM ROLES
-- ============================================

INSERT INTO roles (id, organization_id, name, display_name, permissions, is_system)
VALUES
    -- Admin role
    (
        '00000000-0000-0000-0001-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'admin',
        'Administrateur',
        '[
            "users:read", "users:write", "users:delete",
            "roles:read", "roles:write",
            "schedules:read", "schedules:write", "schedules:delete",
            "shift_types:read", "shift_types:write", "shift_types:delete",
            "periods:read", "periods:write",
            "holidays:read", "holidays:write", "holidays:delete",
            "leave_requests:read", "leave_requests:approve",
            "statistics:read",
            "audit:read",
            "settings:read", "settings:write"
        ]'::JSONB,
        true
    ),
    -- Planner role
    (
        '00000000-0000-0000-0001-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'planner',
        'Planificateur',
        '[
            "users:read",
            "schedules:read", "schedules:write",
            "shift_types:read",
            "periods:read",
            "holidays:read",
            "leave_requests:read", "leave_requests:approve",
            "statistics:read"
        ]'::JSONB,
        true
    ),
    -- Agent role
    (
        '00000000-0000-0000-0001-000000000003',
        '00000000-0000-0000-0000-000000000001',
        'agent',
        'Agent',
        '[
            "schedules:read:own",
            "shift_types:read",
            "periods:read",
            "holidays:read",
            "leave_requests:read:own", "leave_requests:write:own",
            "statistics:read:own"
        ]'::JSONB,
        true
    )
ON CONFLICT (organization_id, name) DO NOTHING;

-- ============================================
-- SHIFT TYPES (from generate.py)
-- LISTE_PRESTATIONS + LISTE_REPOS + special codes
-- ============================================

INSERT INTO shift_types (organization_id, code, description, category, color_hex, duration_hours, night_hours, is_countable, requires_recovery, is_holiday_indicator, is_rest_day, display_order)
VALUES
    -- ============================================
    -- PRESTATIONS STANDARD (2h night)
    -- ============================================
    ('00000000-0000-0000-0000-000000000001', '101', 'Service Standard Matin', 'standard', 'FFD9E6', 8.00, 2.00, true, false, false, false, 1),
    ('00000000-0000-0000-0000-000000000001', '102', 'Service Standard Après-midi', 'standard', 'FFE6F0', 8.00, 2.00, true, false, false, false, 2),
    ('00000000-0000-0000-0000-000000000001', '6101', 'Service 6-Standard Matin', 'standard', 'FFD9E6', 8.00, 2.00, true, false, false, false, 3),
    ('00000000-0000-0000-0000-000000000001', '6102', 'Service 6-Standard Après-midi', 'standard', 'FFE6F0', 8.00, 2.00, true, false, false, false, 4),
    ('00000000-0000-0000-0000-000000000001', '7101', 'Service Férié Matin', 'standard', 'FFD9E6', 8.00, 2.00, true, true, true, false, 5),
    ('00000000-0000-0000-0000-000000000001', '7102', 'Service Férié Après-midi', 'standard', 'FFE6F0', 8.00, 2.00, true, true, true, false, 6),

    -- ============================================
    -- PRESTATIONS INTERMEDIATE (2h night)
    -- ============================================
    ('00000000-0000-0000-0000-000000000001', '111', 'Service Intermédiaire Matin', 'intermediate', 'D9E6FF', 8.00, 2.00, true, false, false, false, 10),
    ('00000000-0000-0000-0000-000000000001', '112', 'Service Intermédiaire Après-midi', 'intermediate', 'E6F0FF', 8.00, 2.00, true, false, false, false, 11),
    ('00000000-0000-0000-0000-000000000001', '6111', 'Service 6-Intermédiaire Matin', 'intermediate', 'D9E6FF', 8.00, 2.00, true, false, false, false, 12),
    ('00000000-0000-0000-0000-000000000001', '6112', 'Service 6-Intermédiaire Après-midi', 'intermediate', 'E6F0FF', 8.00, 2.00, true, false, false, false, 13),
    ('00000000-0000-0000-0000-000000000001', '7111', 'Service Férié Inter. Matin', 'intermediate', 'D9E6FF', 8.00, 2.00, true, true, true, false, 14),
    ('00000000-0000-0000-0000-000000000001', '7112', 'Service Férié Inter. Après-midi', 'intermediate', 'E6F0FF', 8.00, 2.00, true, true, true, false, 15),

    -- ============================================
    -- PRESTATIONS NUIT (8h night)
    -- ============================================
    ('00000000-0000-0000-0000-000000000001', '121', 'Service Nuit', 'night', 'FFE6CC', 8.00, 8.00, true, false, false, false, 20),
    ('00000000-0000-0000-0000-000000000001', '6121', 'Service 6-Nuit', 'night', 'FFE6CC', 8.00, 8.00, true, false, false, false, 21),
    ('00000000-0000-0000-0000-000000000001', '7121', 'Service Férié Nuit', 'night', 'FFE6CC', 8.00, 8.00, true, true, true, false, 22),

    -- ============================================
    -- PRESTATIONS PARTIELLES (2h night)
    -- ============================================
    ('00000000-0000-0000-0000-000000000001', 'X_AM', 'Demi-Service Matin', 'partial', 'D9F2D9', 8.00, 2.00, true, false, false, false, 30),
    ('00000000-0000-0000-0000-000000000001', 'X_PM', 'Demi-Service Après-midi', 'partial', 'D9F2D9', 8.00, 2.00, true, false, false, false, 31),
    ('00000000-0000-0000-0000-000000000001', 'X_10', 'Service 10 heures', 'special', 'E6D9FF', 10.00, 0.00, true, false, false, false, 32),

    -- ============================================
    -- CODE SPECIAL: GREVE (0h night, RED display)
    -- ============================================
    ('00000000-0000-0000-0000-000000000001', 'AG', 'Grève', 'special', 'FF4444', 8.00, 0.00, true, false, false, false, 40),

    -- ============================================
    -- REPOS (0h duration, not countable)
    -- ============================================
    ('00000000-0000-0000-0000-000000000001', 'RH', 'Repos Hebdomadaire', 'rest', 'CCCCCC', 0.00, 0.00, false, false, false, true, 50),
    ('00000000-0000-0000-0000-000000000001', 'CH', 'Congé Habituel', 'rest', 'D5D5D5', 0.00, 0.00, false, false, false, true, 51),
    ('00000000-0000-0000-0000-000000000001', 'RR', 'Repos de Récupération', 'rest', 'C9C9C9', 0.00, 0.00, false, false, false, true, 52),
    ('00000000-0000-0000-0000-000000000001', 'ZM', 'Zone Morte', 'rest', 'F0F0F0', 0.00, 0.00, false, false, false, true, 53),

    -- ============================================
    -- CONGES (8h duration, countable for balance)
    -- ============================================
    ('00000000-0000-0000-0000-000000000001', 'CN', 'Congé Normalisé', 'leave', 'FFFFCC', 8.00, 0.00, true, false, false, false, 60),
    ('00000000-0000-0000-0000-000000000001', 'JC', 'Jour Chômé', 'leave', 'FFFFCC', 8.00, 0.00, true, false, false, false, 61),
    ('00000000-0000-0000-0000-000000000001', 'CV', 'Congé Vieillesse', 'leave', '96D1CC', 0.00, 0.00, false, false, false, true, 62)

ON CONFLICT (organization_id, code) DO UPDATE
SET description = EXCLUDED.description,
    category = EXCLUDED.category,
    color_hex = EXCLUDED.color_hex,
    duration_hours = EXCLUDED.duration_hours,
    night_hours = EXCLUDED.night_hours,
    is_countable = EXCLUDED.is_countable,
    requires_recovery = EXCLUDED.requires_recovery,
    is_holiday_indicator = EXCLUDED.is_holiday_indicator,
    is_rest_day = EXCLUDED.is_rest_day,
    display_order = EXCLUDED.display_order;

-- ============================================
-- DEFAULT ADMIN USER
-- Password: Admin123! (bcrypt hash)
-- ============================================

INSERT INTO users (
    id, organization_id, role_id,
    email, password_hash,
    first_name, last_name, matricule,
    cn_entitlement, jc_entitlement,
    is_active, email_verified_at
)
VALUES (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'admin@planningos.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VGKmCtZ3WVmX.K',
    'Admin',
    'System',
    'ADMIN001',
    25,
    15,
    true,
    NOW()
)
ON CONFLICT (organization_id, email) DO NOTHING;

-- ============================================
-- SAMPLE PLANNER USER
-- Password: Planner123!
-- ============================================

INSERT INTO users (
    id, organization_id, role_id,
    email, password_hash,
    first_name, last_name, matricule,
    cn_entitlement, jc_entitlement,
    is_active, email_verified_at
)
VALUES (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'planner@planningos.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VGKmCtZ3WVmX.K',
    'Jean',
    'Planificateur',
    'PLN001',
    20,
    10,
    true,
    NOW()
)
ON CONFLICT (organization_id, email) DO NOTHING;

-- ============================================
-- SAMPLE AGENT USERS
-- Password: Agent123!
-- ============================================

INSERT INTO users (
    id, organization_id, role_id,
    email, password_hash,
    first_name, last_name, matricule,
    cn_entitlement, jc_entitlement,
    is_active, email_verified_at
)
VALUES
    (
        '00000000-0000-0000-0002-000000000003',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0001-000000000003',
        'agent1@planningos.local',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VGKmCtZ3WVmX.K',
        'Marie',
        'Dupont',
        'AGT001',
        20,
        10,
        true,
        NOW()
    ),
    (
        '00000000-0000-0000-0002-000000000004',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0001-000000000003',
        'agent2@planningos.local',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VGKmCtZ3WVmX.K',
        'Pierre',
        'Martin',
        'AGT002',
        20,
        10,
        true,
        NOW()
    ),
    (
        '00000000-0000-0000-0002-000000000005',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0001-000000000003',
        'agent3@planningos.local',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VGKmCtZ3WVmX.K',
        'Sophie',
        'Bernard',
        'AGT003',
        20,
        10,
        true,
        NOW()
    )
ON CONFLICT (organization_id, email) DO NOTHING;

-- ============================================
-- GENERATE PERIODS FOR 2026
-- ============================================

SELECT generate_periods_for_year(
    '00000000-0000-0000-0000-000000000001',
    2026
);

-- ============================================
-- BELGIAN HOLIDAYS 2026 (Computus-based)
-- Easter Sunday 2026: April 5
-- ============================================

INSERT INTO holidays (organization_id, date, name, is_moveable)
VALUES
    -- Fixed holidays
    ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'Nouvel An', false),
    ('00000000-0000-0000-0000-000000000001', '2026-05-01', 'Fête du Travail', false),
    ('00000000-0000-0000-0000-000000000001', '2026-07-21', 'Fête Nationale', false),
    ('00000000-0000-0000-0000-000000000001', '2026-08-15', 'Assomption', false),
    ('00000000-0000-0000-0000-000000000001', '2026-11-01', 'Toussaint', false),
    ('00000000-0000-0000-0000-000000000001', '2026-11-11', 'Armistice', false),
    ('00000000-0000-0000-0000-000000000001', '2026-12-25', 'Noël', false),

    -- Easter-derived holidays (Easter 2026: April 5)
    ('00000000-0000-0000-0000-000000000001', '2026-04-06', 'Lundi de Pâques', true),      -- Easter + 1
    ('00000000-0000-0000-0000-000000000001', '2026-05-14', 'Ascension', true),            -- Easter + 39
    ('00000000-0000-0000-0000-000000000001', '2026-05-25', 'Lundi de Pentecôte', true)    -- Easter + 50

ON CONFLICT (organization_id, date) DO UPDATE
SET name = EXCLUDED.name,
    is_moveable = EXCLUDED.is_moveable;

-- ============================================
-- OUTPUT SUMMARY
-- ============================================

DO $$
DECLARE
    v_org_count INTEGER;
    v_role_count INTEGER;
    v_user_count INTEGER;
    v_shift_count INTEGER;
    v_period_count INTEGER;
    v_holiday_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_org_count FROM organizations;
    SELECT COUNT(*) INTO v_role_count FROM roles;
    SELECT COUNT(*) INTO v_user_count FROM users;
    SELECT COUNT(*) INTO v_shift_count FROM shift_types;
    SELECT COUNT(*) INTO v_period_count FROM periods;
    SELECT COUNT(*) INTO v_holiday_count FROM holidays;

    RAISE NOTICE '=== Seed Data Summary ===';
    RAISE NOTICE 'Organizations: %', v_org_count;
    RAISE NOTICE 'Roles: %', v_role_count;
    RAISE NOTICE 'Users: %', v_user_count;
    RAISE NOTICE 'Shift Types: %', v_shift_count;
    RAISE NOTICE 'Periods: %', v_period_count;
    RAISE NOTICE 'Holidays: %', v_holiday_count;
    RAISE NOTICE '========================';
END $$;
