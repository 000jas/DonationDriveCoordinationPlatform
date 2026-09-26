-- ==============================================================================
-- SMART DONATION DRIVE & VOLUNTEER COORDINATION PLATFORM
-- Lakebase PostgreSQL Schema on Neon
-- ==============================================================================

-- Enable UUID & Text Search Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    category VARCHAR(100) NOT NULL DEFAULT 'Non-Profit', -- 'Disaster Response', 'Food Security', 'Medical', 'Education', 'Animal Welfare', 'Community Support'
    verification_status VARCHAR(50) NOT NULL DEFAULT 'verified', -- 'pending', 'verified', 'rejected'
    tax_id_ein VARCHAR(100),
    website_url VARCHAR(255),
    logo_url TEXT,
    mission_statement TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(50),
    country VARCHAR(100) DEFAULT 'USA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. DRIVES (Donation Drives & Volunteer Missions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    tagline VARCHAR(300),
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'disaster_relief', 'food_security', 'education', 'medical_aid', 'winter_relief', 'animal_welfare', 'environmental', 'shelter'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'draft', 'active', 'paused', 'completed', 'cancelled'
    urgency_level VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    drive_type VARCHAR(50) NOT NULL DEFAULT 'hybrid', -- 'hybrid', 'monetary_only', 'goods_only', 'volunteer_only'
    
    -- Monetary Goal & Progress
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    raised_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Goods / Items Goal & Progress
    target_items_count INT NOT NULL DEFAULT 0,
    collected_items_count INT NOT NULL DEFAULT 0,
    item_unit_name VARCHAR(100) DEFAULT 'items', -- e.g. 'meals', 'care packages', 'winter coats', 'supply kits'
    
    -- Volunteer Goal & Progress
    target_volunteers_count INT NOT NULL DEFAULT 0,
    registered_volunteers_count INT NOT NULL DEFAULT 0,
    target_volunteer_hours NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    completed_volunteer_hours NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    
    -- Timing & Location
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    location_name VARCHAR(255),
    location_address TEXT,
    is_virtual BOOLEAN NOT NULL DEFAULT FALSE,
    featured_image_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. DRIVE ITEM NEEDS (Specific in-kind requirements for a drive)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drive_item_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General', -- 'Food', 'Medical', 'Hygiene', 'Clothing', 'Tools', 'Educational'
    target_quantity INT NOT NULL,
    collected_quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'units', -- 'boxes', 'cans', 'pairs', 'pallets', 'kits'
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    drop_off_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. DONORS (CRM Directory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    donor_tier VARCHAR(50) NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum', 'champion'
    total_donated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_donations_count INT NOT NULL DEFAULT 0,
    is_anonymous_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. DONATIONS (Monetary & Item contributions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donation_type VARCHAR(50) NOT NULL DEFAULT 'monetary', -- 'monetary', 'item', 'services'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    item_need_id UUID REFERENCES drive_item_needs(id) ON DELETE SET NULL,
    item_description TEXT,
    item_quantity INT NOT NULL DEFAULT 0,
    
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'refunded', 'pledged', 'received'
    payment_method VARCHAR(50) DEFAULT 'stripe', -- 'stripe', 'card', 'paypal', 'bank_transfer', 'in_person', 'dropoff'
    transaction_reference VARCHAR(255),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    donor_message TEXT,
    receipt_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. VOLUNTEERS (Volunteer Profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    skills TEXT[] DEFAULT '{}', -- e.g. ARRAY['First Aid', 'Logistics', 'Driving', 'Food Prep', 'Medical', 'Translation', 'Crowd Management']
    availability VARCHAR[] DEFAULT '{}', -- e.g. ARRAY['Weekdays', 'Weekends', 'Mornings', 'Evenings', 'Emergency On-Call']
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    total_hours_logged NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    shifts_completed_count INT NOT NULL DEFAULT 0,
    volunteer_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    is_background_checked BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. VOLUNTEER ROLES (Available Shifts & Tasks for a Drive)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    required_skills TEXT[] DEFAULT '{}',
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL,
    filled_count INT NOT NULL DEFAULT 0,
    location VARCHAR(255),
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. VOLUNTEER ASSIGNMENTS (Shift Registrations & Attendance Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES volunteer_roles(id) ON DELETE CASCADE,
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed', -- 'registered', 'confirmed', 'attended', 'no_show', 'cancelled'
    hours_logged NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    coordinator_notes TEXT,
    feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_volunteer_role_assignment UNIQUE (role_id, volunteer_id)
);

-- ------------------------------------------------------------------------------
-- 9. DRIVE MILESTONES (Target Badges & Achievements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drive_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'financial', 'items', 'volunteers', 'hours'
    target_value NUMERIC(12, 2) NOT NULL,
    is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
    achieved_at TIMESTAMPTZ,
    reward_badge VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. IMPACT UPDATES (Public Bulletins & Drive News)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS impact_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
    author_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    metrics_highlight JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_drives_org_id ON drives(org_id);
CREATE INDEX IF NOT EXISTS idx_drives_category ON drives(category);
CREATE INDEX IF NOT EXISTS idx_drives_status ON drives(status);
CREATE INDEX IF NOT EXISTS idx_drives_urgency ON drives(urgency_level);
CREATE INDEX IF NOT EXISTS idx_drives_title_trgm ON drives USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_donations_drive_id ON donations(drive_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_skills ON volunteers USING gin (skills);

CREATE INDEX IF NOT EXISTS idx_volunteer_roles_drive_id ON volunteer_roles(drive_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_roles_date ON volunteer_roles(shift_date);

CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_drive ON volunteer_assignments(drive_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_volunteer ON volunteer_assignments(volunteer_id);

-- ==============================================================================
-- AUTOMATED TRIGGERS FOR REAL-TIME ROLLUPS & TARGET PROGRESS
-- ==============================================================================

-- 1. Trigger to update Drive & Donor totals when a donation is created/updated
CREATE OR REPLACE FUNCTION fn_update_donation_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Drive Raised Amount
    UPDATE drives
    SET raised_amount = COALESCE((
        SELECT SUM(amount)
        FROM donations
        WHERE drive_id = NEW.drive_id AND status = 'completed' AND donation_type = 'monetary'
    ), 0.00),
    collected_items_count = COALESCE((
        SELECT SUM(item_quantity)
        FROM donations
        WHERE drive_id = NEW.drive_id AND status IN ('completed', 'received') AND donation_type = 'item'
    ), 0),
    updated_at = NOW()
    WHERE id = NEW.drive_id;

    -- Update Item Need specific collected quantity if item_need_id is provided
    IF NEW.item_need_id IS NOT NULL THEN
        UPDATE drive_item_needs
        SET collected_quantity = COALESCE((
            SELECT SUM(item_quantity)
            FROM donations
            WHERE item_need_id = NEW.item_need_id AND status IN ('completed', 'received')
        ), 0)
        WHERE id = NEW.item_need_id;
    END IF;

    -- Update Donor total giving and tier if donor_id is linked
    IF NEW.donor_id IS NOT NULL THEN
        UPDATE donors
        SET total_donated_amount = COALESCE((
            SELECT SUM(amount)
            FROM donations
            WHERE donor_id = NEW.donor_id AND status = 'completed' AND donation_type = 'monetary'
        ), 0.00),
        total_donations_count = (
            SELECT COUNT(*)
            FROM donations
            WHERE donor_id = NEW.donor_id AND status IN ('completed', 'received')
        ),
        donor_tier = CASE
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donor_id = NEW.donor_id AND status = 'completed') >= 10000 THEN 'champion'
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donor_id = NEW.donor_id AND status = 'completed') >= 5000 THEN 'platinum'
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donor_id = NEW.donor_id AND status = 'completed') >= 1000 THEN 'gold'
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donor_id = NEW.donor_id AND status = 'completed') >= 250 THEN 'silver'
            ELSE 'bronze'
        END,
        updated_at = NOW()
        WHERE id = NEW.donor_id;
    END IF;

    -- Check and auto-complete drive milestones
    UPDATE drive_milestones
    SET is_achieved = TRUE,
        achieved_at = NOW()
    WHERE drive_id = NEW.drive_id
      AND is_achieved = FALSE
      AND (
          (target_type = 'financial' AND target_value <= (SELECT raised_amount FROM drives WHERE id = NEW.drive_id))
          OR
          (target_type = 'items' AND target_value <= (SELECT collected_items_count FROM drives WHERE id = NEW.drive_id))
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_donation_progress ON donations;
CREATE TRIGGER trg_donation_progress
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION fn_update_donation_progress();


-- 2. Trigger to update Volunteer Roles, Shifts, and Drive volunteer counts
CREATE OR REPLACE FUNCTION fn_update_volunteer_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Volunteer Role filled slots count
    UPDATE volunteer_roles
    SET filled_count = (
        SELECT COUNT(*)
        FROM volunteer_assignments
        WHERE role_id = NEW.role_id AND status IN ('registered', 'confirmed', 'attended')
    )
    WHERE id = NEW.role_id;

    -- Update Drive Total Registered Volunteers & Hours Completed
    UPDATE drives
    SET registered_volunteers_count = (
        SELECT COUNT(DISTINCT volunteer_id)
        FROM volunteer_assignments
        WHERE drive_id = NEW.drive_id AND status IN ('registered', 'confirmed', 'attended')
    ),
    completed_volunteer_hours = COALESCE((
        SELECT SUM(hours_logged)
        FROM volunteer_assignments
        WHERE drive_id = NEW.drive_id AND status = 'attended'
    ), 0.00),
    updated_at = NOW()
    WHERE id = NEW.drive_id;

    -- Update Volunteer Profile total hours and shifts completed
    UPDATE volunteers
    SET total_hours_logged = COALESCE((
        SELECT SUM(hours_logged)
        FROM volunteer_assignments
        WHERE volunteer_id = NEW.volunteer_id AND status = 'attended'
    ), 0.00),
    shifts_completed_count = (
        SELECT COUNT(*)
        FROM volunteer_assignments
        WHERE volunteer_id = NEW.volunteer_id AND status = 'attended'
    ),
    updated_at = NOW()
    WHERE id = NEW.volunteer_id;

    -- Check milestones for volunteers and hours
    UPDATE drive_milestones
    SET is_achieved = TRUE,
        achieved_at = NOW()
    WHERE drive_id = NEW.drive_id
      AND is_achieved = FALSE
      AND (
          (target_type = 'volunteers' AND target_value <= (SELECT registered_volunteers_count FROM drives WHERE id = NEW.drive_id))
          OR
          (target_type = 'hours' AND target_value <= (SELECT completed_volunteer_hours FROM drives WHERE id = NEW.drive_id))
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_volunteer_progress ON volunteer_assignments;
CREATE TRIGGER trg_volunteer_progress
AFTER INSERT OR UPDATE OR DELETE ON volunteer_assignments
FOR EACH ROW
EXECUTE FUNCTION fn_update_volunteer_progress();


-- ==============================================================================
-- ANALYTICAL & REPORTING VIEWS
-- ==============================================================================

-- 1. Drive Progress Comprehensive Summary View
CREATE OR REPLACE VIEW v_drive_progress_summary AS
SELECT 
    d.id AS drive_id,
    d.title,
    d.slug,
    d.category,
    d.status,
    d.urgency_level,
    d.drive_type,
    o.id AS org_id,
    o.name AS org_name,
    o.logo_url AS org_logo,
    
    -- Monetary Progress
    d.target_amount,
    d.raised_amount,
    CASE 
        WHEN d.target_amount > 0 THEN ROUND((d.raised_amount / d.target_amount) * 100, 1)
        ELSE 100.0
    END AS financial_progress_pct,
    
    -- Items Progress
    d.target_items_count,
    d.collected_items_count,
    d.item_unit_name,
    CASE 
        WHEN d.target_items_count > 0 THEN ROUND((d.collected_items_count::numeric / d.target_items_count) * 100, 1)
        ELSE 100.0
    END AS items_progress_pct,
    
    -- Volunteers Progress
    d.target_volunteers_count,
    d.registered_volunteers_count,
    CASE 
        WHEN d.target_volunteers_count > 0 THEN ROUND((d.registered_volunteers_count::numeric / d.target_volunteers_count) * 100, 1)
        ELSE 100.0
    END AS volunteer_fill_pct,
    
    d.completed_volunteer_hours,
    d.start_date,
    d.end_date,
    d.location_name,
    d.featured_image_url
FROM drives d
JOIN organizations o ON d.org_id = o.id;

-- 2. Organization Impact Leaderboard View
CREATE OR REPLACE VIEW v_organization_impact_leaderboard AS
SELECT 
    o.id AS org_id,
    o.name AS org_name,
    o.category,
    o.verification_status,
    COUNT(DISTINCT d.id) AS total_drives,
    COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END) AS active_drives,
    COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) AS completed_drives,
    COALESCE(SUM(d.raised_amount), 0.00) AS total_funds_raised,
    COALESCE(SUM(d.collected_items_count), 0) AS total_goods_collected,
    COALESCE(SUM(d.completed_volunteer_hours), 0.00) AS total_volunteer_hours
FROM organizations o
LEFT JOIN drives d ON o.id = d.org_id
GROUP BY o.id, o.name, o.category, o.verification_status
ORDER BY total_funds_raised DESC;

-- 3. Top Donors Leaderboard
CREATE OR REPLACE VIEW v_donor_leaderboard AS
SELECT 
    dn.id AS donor_id,
    dn.full_name,
    dn.donor_tier,
    dn.total_donated_amount,
    dn.total_donations_count,
    MAX(don.created_at) AS last_donation_at
FROM donors dn
LEFT JOIN donations don ON dn.id = don.donor_id
GROUP BY dn.id, dn.full_name, dn.donor_tier, dn.total_donated_amount, dn.total_donations_count
ORDER BY dn.total_donated_amount DESC;

-- 4. Top Volunteers Activity Digest
CREATE OR REPLACE VIEW v_volunteer_leaderboard AS
SELECT 
    v.id AS volunteer_id,
    v.full_name,
    v.total_hours_logged,
    v.shifts_completed_count,
    v.volunteer_rating,
    v.skills,
    v.availability
FROM volunteers v
ORDER BY v.total_hours_logged DESC, v.shifts_completed_count DESC;

-- 5. Upcoming Volunteer Shifts & Availability View
CREATE OR REPLACE VIEW v_upcoming_shifts AS
SELECT 
    vr.id AS role_id,
    vr.title AS role_title,
    vr.shift_date,
    vr.start_time,
    vr.end_time,
    vr.capacity,
    vr.filled_count,
    (vr.capacity - vr.filled_count) AS open_slots,
    vr.location,
    vr.required_skills,
    d.id AS drive_id,
    d.title AS drive_title,
    d.urgency_level,
    o.name AS org_name
FROM volunteer_roles vr
JOIN drives d ON vr.drive_id = d.id
JOIN organizations o ON d.org_id = o.id
WHERE vr.shift_date >= CURRENT_DATE
ORDER BY vr.shift_date ASC, vr.start_time ASC;
