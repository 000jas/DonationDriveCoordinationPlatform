import { neon } from "@neondatabase/serverless";

export const NEON_CONFIG = {
  projectId: import.meta.env.VITE_NEON_PROJECT_ID || "wild-pine-65165913",
  projectName: import.meta.env.VITE_NEON_PROJECT_NAME || "smart-donation-volunteer-platform",
  branch: import.meta.env.VITE_NEON_BRANCH || "main",
  region: import.meta.env.VITE_NEON_REGION || "aws-us-east-2",
  databaseUrl:
    import.meta.env.VITE_NEON_DATABASE_URL ||
    "postgresql://neondb_owner:npg_yrDL2ZJMC7IW@ep-weathered-water-b4ronyb7-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require",
};

// Initialize serverless SQL client over HTTP (ideal for client, edge and serverless environments)
export const sql = neon(NEON_CONFIG.databaseUrl);

export interface DriveRow {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  category: string;
  status: string;
  urgency_level: string;
  drive_type: string;
  target_amount: string | number;
  raised_amount: string | number;
  currency: string;
  target_items_count: number;
  collected_items_count: number;
  item_unit_name: string;
  target_volunteers_count: number;
  registered_volunteers_count: number;
  target_volunteer_hours: string | number;
  completed_volunteer_hours: string | number;
  start_date: string;
  end_date: string | null;
  location_name: string | null;
  featured_image_url: string | null;
}

export interface DonorRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  donor_tier: string;
  total_donated_amount: string | number;
  total_donations_count: number;
}

export interface VolunteerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  skills: string[];
  availability: string[];
  total_hours_logged: string | number;
  shifts_completed_count: number;
  volunteer_rating: string | number;
}

export interface DonationRow {
  id: string;
  drive_id: string;
  donor_id: string | null;
  donor_name: string;
  donor_email: string;
  donation_type: string;
  amount: string | number;
  item_description: string | null;
  item_quantity: number;
  status: string;
  receipt_number: string | null;
  created_at: string;
}

export interface ImpactUpdateRow {
  id: string;
  drive_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface VolunteerRoleRow {
  id: string;
  drive_id: string;
  title: string;
  description: string | null;
  required_skills: string[];
  shift_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  filled_count: number;
  location: string | null;
}

export interface VolunteerAssignmentRow {
  id: string;
  role_id: string;
  drive_id: string;
  volunteer_id: string;
  status: string;
  hours_logged: string | number;
}

/**
 * Test connectivity with Neon Postgres and return latency + metadata
 */
export async function checkNeonConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string; version?: string }> {
  const start = performance.now();
  try {
    const res = await sql`SELECT current_database() as db, version() as version;`;
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs, version: res[0]?.version };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs, error: message };
  }
}

/**
 * Fetch all platform data live from Neon Lakebase Postgres
 */
export async function fetchAllFromNeon() {
  const [drives, donors, volunteers, donations, updates, roles, assignments] = await Promise.all([
    sql`SELECT * FROM drives ORDER BY created_at DESC;` as Promise<DriveRow[]>,
    sql`SELECT * FROM donors ORDER BY total_donated_amount DESC;` as Promise<DonorRow[]>,
    sql`SELECT * FROM volunteers ORDER BY total_hours_logged DESC;` as Promise<VolunteerRow[]>,
    sql`SELECT * FROM donations ORDER BY created_at DESC LIMIT 50;` as Promise<DonationRow[]>,
    sql`SELECT * FROM impact_updates ORDER BY created_at DESC LIMIT 20;` as Promise<ImpactUpdateRow[]>,
    sql`SELECT * FROM volunteer_roles ORDER BY shift_date ASC;` as Promise<VolunteerRoleRow[]>,
    sql`SELECT * FROM volunteer_assignments ORDER BY created_at DESC;` as Promise<VolunteerAssignmentRow[]>,
  ]);

  return {
    drives,
    donors,
    volunteers,
    donations,
    updates,
    roles,
    assignments,
  };
}

/**
 * Insert a new drive into Neon Postgres
 */
export async function createDriveInNeon(params: {
  title: string;
  category: string;
  target_amount: number;
  urgency_level?: string;
  item_unit_name?: string;
  target_items_count?: number;
  target_volunteers_count?: number;
  location_name?: string;
  dueDate?: string;
}) {
  const id = crypto.randomUUID();
  const slug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + id.slice(0, 8);
  const defaultOrgId = "00000000-0000-0000-0000-000000000001"; // Hope Harvest Food Bank

  await sql`
    INSERT INTO drives (
      id, org_id, title, slug, category, status, urgency_level, drive_type,
      target_amount, raised_amount, target_items_count, item_unit_name, target_volunteers_count,
      end_date, location_name
    ) VALUES (
      ${id},
      ${defaultOrgId},
      ${params.title},
      ${slug},
      ${params.category.toLowerCase().replace(/\s+/g, "_")},
      'active',
      ${params.urgency_level || "medium"},
      'hybrid',
      ${params.target_amount},
      0.00,
      ${params.target_items_count || 1000},
      ${params.item_unit_name || "kits"},
      ${params.target_volunteers_count || 25},
      ${params.dueDate ? new Date(params.dueDate).toISOString() : null},
      ${params.location_name || "Community Hub"}
    );
  `;
  return id;
}

/**
 * Insert a new donor into Neon Postgres
 */
export async function createDonorInNeon(params: {
  name: string;
  email: string;
  type?: string;
}) {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO donors (
      id, full_name, email, donor_tier, total_donated_amount, total_donations_count
    ) VALUES (
      ${id},
      ${params.name},
      ${params.email || `${params.name.toLowerCase().replace(/\s+/g, ".")}@example.org`},
      'bronze',
      0.00,
      0
    ) ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;
  `;
  return id;
}

/**
 * Insert a new volunteer into Neon Postgres
 */
export async function createVolunteerInNeon(params: {
  name: string;
  email?: string;
  skill: string;
}) {
  const id = crypto.randomUUID();
  const email = params.email || `${params.name.toLowerCase().replace(/\s+/g, ".")}@volunteer.org`;
  await sql`
    INSERT INTO volunteers (
      id, full_name, email, skills, availability, total_hours_logged, shifts_completed_count, volunteer_rating
    ) VALUES (
      ${id},
      ${params.name},
      ${email},
      ARRAY[${params.skill}],
      ARRAY['Weekdays', 'Weekends'],
      0.00,
      0,
      5.00
    ) ON CONFLICT (email) DO UPDATE SET skills = array_append(volunteers.skills, ${params.skill});
  `;
  return id;
}

/**
 * Record a monetary or in-kind donation in Neon Postgres
 * This triggers Neon's PostgreSQL triggers to automatically update drives.raised_amount, donor lifetime totals, and milestones!
 */
export async function createDonationInNeon(params: {
  drive_id: string;
  donor_id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  donation_type?: "monetary" | "item";
  item_description?: string;
  item_quantity?: number;
}) {
  const id = crypto.randomUUID();
  const receipt = `RCPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${id.slice(0, 6).toUpperCase()}`;

  await sql`
    INSERT INTO donations (
      id, drive_id, donor_id, donor_name, donor_email, donation_type, amount,
      item_description, item_quantity, status, payment_method, receipt_number
    ) VALUES (
      ${id},
      ${params.drive_id},
      ${params.donor_id},
      ${params.donor_name},
      ${params.donor_email},
      ${params.donation_type || "monetary"},
      ${params.amount},
      ${params.item_description || null},
      ${params.item_quantity || 0},
      'completed',
      'stripe',
      ${receipt}
    );
  `;
  return { id, receipt };
}

/**
 * Assign a volunteer to a drive role in Neon Postgres
 */
export async function assignVolunteerInNeon(params: {
  drive_id: string;
  volunteer_id: string;
  role_id?: string;
}) {
  const id = crypto.randomUUID();
  let roleId = params.role_id;

  if (!roleId) {
    // Find or create a default role for this drive
    const existingRoles = await sql`
      SELECT id FROM volunteer_roles WHERE drive_id = ${params.drive_id} LIMIT 1;
    `;
    if (existingRoles.length > 0) {
      roleId = existingRoles[0].id;
    } else {
      roleId = crypto.randomUUID();
      await sql`
        INSERT INTO volunteer_roles (
          id, drive_id, title, shift_date, start_time, end_time, capacity, filled_count
        ) VALUES (
          ${roleId},
          ${params.drive_id},
          'General Volunteer Support',
          CURRENT_DATE + INTERVAL '1 day',
          '09:00:00',
          '13:00:00',
          20,
          0
        );
      `;
    }
  }

  await sql`
    INSERT INTO volunteer_assignments (
      id, role_id, drive_id, volunteer_id, status, hours_logged
    ) VALUES (
      ${id},
      ${roleId},
      ${params.drive_id},
      ${params.volunteer_id},
      'confirmed',
      0.00
    ) ON CONFLICT (role_id, volunteer_id) DO NOTHING;
  `;
  return id;
}
