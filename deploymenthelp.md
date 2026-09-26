# Deployment Guide for Kindred (Smart Donation Drive & Volunteer Coordination Platform)

This project can be deployed in two simple ways:

---

## 🌟 Option A (Simplest & Recommended): Deploy Frontend on Vercel Directly

Because Kindred's frontend utilizes the **Neon Serverless Driver (`@neondatabase/serverless`)**, it communicates directly with your Neon Lakebase PostgreSQL database over serverless HTTP/WebSockets. You can deploy the frontend on Vercel in 2 minutes without needing a separate backend server!

### Step-by-Step Vercel Deployment:

1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Import your GitHub repository: `000jas/DonationDriveCoordinationPlatform`.
3. In **Project Configuration**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select **`apps/frontend`**
   - **Build Command**: `npm run build` (or leave default `vite build`)
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_NEON_DATABASE_URL`:
     ```
     postgresql://neondb_owner:npg_OcZieWB54AzI@ep-wandering-pine-b5wgc1xc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - `VITE_NEON_PROJECT_ID`:
     ```
     snowy-base-99419665
     ```
   - `VITE_NEON_BRANCH`:
     ```
     production
     ```
5. Click **Deploy**. Your frontend will be live on a `*.vercel.app` URL with full read/write access to your Neon database!

---

## 🚀 Option B: Frontend on Vercel + Backend REST API on Render

Use this option if you want a dedicated Node.js/Express REST API server for external webhooks, mobile apps, or backend workers.

### 1. Deploy Backend on Render:
1. Go to [render.com](https://render.com) and click **"New +"** → **"Web Service"**.
2. Connect your GitHub repository: `000jas/DonationDriveCoordinationPlatform`.
3. Configure settings:
   - **Name**: `kindred-backend-api`
   - **Region**: `Ohio (US East)` (same as your Neon database region `aws-us-east-2`)
   - **Root Directory**: `apps/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
4. In **Environment Variables**, add:
   - `DATABASE_URL`:
     ```
     postgresql://neondb_owner:npg_OcZieWB54AzI@ep-wandering-pine-b5wgc1xc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - `PORT`: `4000`
5. Click **Create Web Service**. Once deployed, copy your Render URL (e.g., `https://kindred-backend-api.onrender.com`).

### 2. Deploy Frontend on Vercel:
Follow **Option A** above, and in Vercel's environment variables, add:
- `VITE_BACKEND_URL`: `https://kindred-backend-api.onrender.com`

---

## 🗄️ Database Migrations (One-time or on updates)

Your database (`snowy-base-99419665`) is already populated! If you ever need to re-run migrations from your computer or CI/CD:
```bash
npm run db:migrate
```