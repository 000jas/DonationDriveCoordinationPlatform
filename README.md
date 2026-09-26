# Kindred: Smart Donation Drive & Volunteer Coordination Platform

A full-stack monorepo platform connecting donation drives, donors, and volunteer coordinators with real-time target tracking powered by **Neon Lakebase PostgreSQL**.

---

## 🏗️ Monorepo Architecture

```
Vibecode/
├── apps/
│   ├── frontend/        # React 19 + Vite + Tailwind CSS web dashboard
│   │   ├── src/
│   │   │   ├── lib/neon.ts   # Client-side Neon Serverless integration
│   │   │   ├── App.tsx       # Main dashboard & live interactive UI
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── backend/         # Express REST API for backend services & endpoints
│       ├── src/
│       │   ├── db.js         # Neon connection pool & query helpers
│       │   └── index.js      # REST endpoints (drives, donors, volunteers, analytics)
│       └── package.json
│
├── packages/
│   └── db/              # Database schema migrations, DDL, and seed scripts
│       ├── scripts/
│       │   ├── schema.sql    # DDL with tables, triggers, indexes, and views
│       │   ├── seed.sql      # Seed data insertion script
│       │   └── migrate.js    # Automated migration runner
│       └── package.json
│
├── .agents/skills/      # Installed Neon Agent Skills (neon, neon-postgres)
├── .env                 # Root environment variables
└── package.json         # Root workspace scripts & dependencies
```

---

## ⚡ Quick Start Commands (from root)

### 1. Run All Services (Frontend + Backend concurrently):
```bash
npm run dev
```

### 2. Run Only Frontend:
```bash
npm run dev:frontend
```
*Frontend runs on `http://localhost:5173`.*

### 3. Run Only Backend API:
```bash
npm run dev:backend
```
*Backend API runs on `http://localhost:4000`.*

### 4. Run Neon Database Migrations & Seed:
```bash
npm run db:migrate
```

### 5. Build for Production:
```bash
npm run build
```

---

## 🗄️ Neon Lakebase PostgreSQL Integration

- **Neon Project ID:** `snowy-base-99419665` (`vibecode`)
- **Active Branch:** `production`
- **Region:** `aws-us-east-2`

### Features Built-in:
- **Real-time Triggers:** Automatic calculation of `raised_amount`, `collected_items_count`, `volunteer_roles.filled_count`, `donor_tier`, and `drive_milestones`.
- **Analytical Views:** `v_drive_progress_summary`, `v_organization_impact_leaderboard`, `v_upcoming_shifts`, `v_donor_leaderboard`.
- **Live Latency & Health Indicator:** Live badge in the top navigation showing connection status and millisecond roundtrip time.
