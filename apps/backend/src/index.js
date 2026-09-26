const express = require("express");
const cors = require("cors");
const { sql } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get("/api/health", async (req, res) => {
  try {
    const dbRes = await sql`SELECT current_database() as db, version() as version;`;
    res.json({
      status: "ok",
      database: dbRes[0]?.db,
      neon: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 2. Drives Endpoints
app.get("/api/drives", async (req, res) => {
  try {
    const drives = await sql`SELECT * FROM drives ORDER BY created_at DESC;`;
    res.json(drives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/drives", async (req, res) => {
  try {
    const { title, category, target_amount, dueDate, urgency_level, location_name } = req.body;
    const id = crypto.randomUUID();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + id.slice(0, 8);
    const defaultOrgId = "00000000-0000-0000-0000-000000000001";

    await sql`
      INSERT INTO drives (
        id, org_id, title, slug, category, status, urgency_level, drive_type,
        target_amount, raised_amount, target_items_count, item_unit_name, target_volunteers_count,
        end_date, location_name
      ) VALUES (
        ${id}, ${defaultOrgId}, ${title}, ${slug},
        ${category.toLowerCase().replace(/\s+/g, "_")}, 'active', ${urgency_level || "medium"}, 'hybrid',
        ${Number(target_amount)}, 0.00, 1000, 'kits', 25,
        ${dueDate ? new Date(dueDate).toISOString() : null}, ${location_name || "Community Center"}
      );
    `;
    res.status(201).json({ id, title, slug, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Donors Endpoints
app.get("/api/donors", async (req, res) => {
  try {
    const donors = await sql`SELECT * FROM donors ORDER BY total_donated_amount DESC;`;
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/donors", async (req, res) => {
  try {
    const { name, email, type } = req.body;
    const id = crypto.randomUUID();
    const donorEmail = email || `${name.toLowerCase().replace(/\s+/g, ".")}@example.org`;

    await sql`
      INSERT INTO donors (id, full_name, email, donor_tier, total_donated_amount, total_donations_count)
      VALUES (${id}, ${name}, ${donorEmail}, 'bronze', 0.00, 0)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;
    `;
    res.status(201).json({ id, name, email: donorEmail, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Volunteers Endpoints
app.get("/api/volunteers", async (req, res) => {
  try {
    const volunteers = await sql`SELECT * FROM volunteers ORDER BY total_hours_logged DESC;`;
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/volunteers", async (req, res) => {
  try {
    const { name, email, skill } = req.body;
    const id = crypto.randomUUID();
    const volEmail = email || `${name.toLowerCase().replace(/\s+/g, ".")}@volunteer.org`;

    await sql`
      INSERT INTO volunteers (id, full_name, email, skills, availability, total_hours_logged, shifts_completed_count, volunteer_rating)
      VALUES (${id}, ${name}, ${volEmail}, ARRAY[${skill}], ARRAY['Weekdays', 'Weekends'], 0.00, 0, 5.00)
      ON CONFLICT (email) DO UPDATE SET skills = array_append(volunteers.skills, ${skill});
    `;
    res.status(201).json({ id, name, email: volEmail, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Donations / Contributions (Triggers automatic updates on Neon)
app.get("/api/donations", async (req, res) => {
  try {
    const donations = await sql`SELECT * FROM donations ORDER BY created_at DESC LIMIT 50;`;
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/donations", async (req, res) => {
  try {
    const { drive_id, donor_id, donor_name, amount } = req.body;
    const id = crypto.randomUUID();
    const receipt = `RCPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${id.slice(0, 6).toUpperCase()}`;

    await sql`
      INSERT INTO donations (
        id, drive_id, donor_id, donor_name, donor_email, donation_type, amount, status, payment_method, receipt_number
      ) VALUES (
        ${id}, ${drive_id}, ${donor_id}, ${donor_name},
        ${donor_name.toLowerCase().replace(/\s+/g, ".")}@example.org, 'monetary', ${Number(amount)},
        'completed', 'stripe', ${receipt}
      );
    `;
    res.status(201).json({ id, receipt, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Analytics & Summaries (from PostgreSQL Views)
app.get("/api/analytics/progress-summary", async (req, res) => {
  try {
    const summary = await sql`SELECT * FROM v_drive_progress_summary ORDER BY raised_amount DESC;`;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/upcoming-shifts", async (req, res) => {
  try {
    const shifts = await sql`SELECT * FROM v_upcoming_shifts;`;
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/impact-leaderboard", async (req, res) => {
  try {
    const leaderboard = await sql`SELECT * FROM v_organization_impact_leaderboard;`;
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Kindred Backend REST API listening on port ${PORT}`);
});
