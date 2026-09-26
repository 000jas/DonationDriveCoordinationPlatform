const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set in environment or .env file');
    process.exit(1);
  }

  console.log('Connecting to Neon Lakebase Postgres...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✔ Connected to Neon Database.');

    // 1. Run Schema
    console.log('\n--- 1. Applying Database Schema ---');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✔ Schema applied successfully with tables, triggers, indexes, and views.');

    // 2. Run Seed
    console.log('\n--- 2. Seeding Initial Data ---');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✔ Seed data populated successfully.');

    // 3. Verification & Diagnostics
    console.log('\n--- 3. Verifying Database Setup & Table Counts ---');

    const tableNames = [
      'organizations',
      'drives',
      'drive_item_needs',
      'donors',
      'donations',
      'volunteers',
      'volunteer_roles',
      'volunteer_assignments',
      'drive_milestones',
      'impact_updates'
    ];

    const counts = [];
    for (const table of tableNames) {
      const res = await client.query(`SELECT count(*) as count FROM ${table};`);
      counts.push({ Table: table, Count: parseInt(res.rows[0].count, 10) });
    }
    console.table(counts);

    // 4. Query Drive Progress View (Automatically updated by triggers)
    console.log('\n--- 4. Live Drive Progress Summary (Computed by Triggers & Views) ---');
    const driveProgress = await client.query(`
      SELECT 
        title, 
        category,
        urgency_level,
        target_amount, 
        raised_amount, 
        financial_progress_pct || '%' AS financial_progress,
        target_items_count,
        collected_items_count,
        items_progress_pct || '%' AS items_progress,
        target_volunteers_count,
        registered_volunteers_count,
        volunteer_fill_pct || '%' AS volunteer_slots_filled,
        completed_volunteer_hours
      FROM v_drive_progress_summary
      ORDER BY raised_amount DESC;
    `);
    console.table(driveProgress.rows);

    // 5. Query Upcoming Shifts
    console.log('\n--- 5. Upcoming Volunteer Shifts (from v_upcoming_shifts) ---');
    const shifts = await client.query(`
      SELECT role_title, drive_title, shift_date, start_time, capacity, filled_count, open_slots, location
      FROM v_upcoming_shifts;
    `);
    console.table(shifts.rows);

    // 6. Query Organization Impact Leaderboard
    console.log('\n--- 6. Organization Impact Leaderboard ---');
    const orgs = await client.query(`
      SELECT org_name, category, total_drives, active_drives, total_funds_raised, total_goods_collected, total_volunteer_hours
      FROM v_organization_impact_leaderboard;
    `);
    console.table(orgs.rows);

    console.log('\n✅ Neon Postgres Database setup complete and fully operational!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
