# 🌾 Kisan Setu - Online Supabase Database Connection Guide

This guide provides step-by-step instructions on how to set up, connect, and sync your **Kisan Setu** application with an online **Supabase PostgreSQL Database**.

---

## 📑 Quick Checklist

- [ ] Create a free Supabase account at [supabase.com](https://supabase.com)
- [ ] Create a new Supabase project
- [ ] Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] Add credentials to your `.env` file
- [ ] Run the SQL schema script ([`supabase_schema.sql`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/supabase_schema.sql)) in Supabase SQL Editor
- [ ] (Optional) Seed initial data using `npm run seed:supabase`

---

## 🛠️ Step 1: Create a Supabase Project

1. Open your browser and go to [https://supabase.com](https://supabase.com).
2. Sign in with GitHub or your email.
3. Click **"New Project"**.
4. Choose your Organization, set a **Project Name** (e.g., `Kisan-Setu-DB`), set a secure **Database Password**, and select a region close to your users (e.g., `South Asia (Mumbai)`).
5. Click **"Create new project"** and wait ~1-2 minutes while Supabase provisions your cloud PostgreSQL database.

---

## 🔑 Step 2: Get Your Supabase Credentials

1. In your Supabase Project Dashboard, go to **Project Settings** (gear icon on the bottom left sidebar) -> **API**.
2. Copy the following keys:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **anon / public Key**: `eyJhbGciOiJIUzI1Ni...`
   - **service_role Key** *(Optional - for admin access)*: `eyJhbGciOiJIUzI1...`

---

## 📝 Step 3: Update Your `.env` File

Open the [`.env`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/.env) file located in the root directory of the project and paste your actual credentials:

```env
# --- Supabase Online Database Connection Details ---
SUPABASE_URL=https://your-actual-project-ref.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_supabase_service_role_key_here

# Frontend Variables (Used by React Vite)
VITE_SUPABASE_URL=https://your-actual-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

---

## 🗄️ Step 4: Run the Database Schema (SQL Editor)

To create all necessary tables (`centres`, `farmers`, `tokens`, `announcements`, `msp_catalog`, `notifications`, `voice_history`) and security policies:

1. In your Supabase Dashboard, click on **SQL Editor** from the left navigation menu.
2. Click **"New Query"**.
3. Open the file [`supabase_schema.sql`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/supabase_schema.sql) in your code editor, copy all its contents, and paste them into the SQL Editor in Supabase.
4. Click **"Run"** (or press Ctrl+Enter).
5. You should see `Success. No rows returned`. All tables and indexes are now created!

---

## 🌱 Step 5: Seed Initial Data into Supabase

We have included a seed script to populate your online database with initial procurement centers, tokens, announcements, and MSP crop rates:

Run the following command in your terminal:

```bash
npm run seed:supabase
```

Output should show:
```text
🚀 Starting Supabase Database Migration & Seeding...
📦 Seeding MSP Catalog...
✅ MSP Catalog seeded successfully!
🏢 Seeding Procurement Centres...
✅ 10 Centres seeded successfully!
🎟️  Seeding Initial Procurement Tokens...
✅ 45 Tokens seeded successfully!
📢 Seeding Initial Announcements...
✅ Announcements seeded successfully!

🎉 Supabase Online Database Seeding Completed!
```

---

## 📁 Connection Files Added to the Project

The following files have been prepared and configured for your project:

1. [`.env`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/.env): Pre-configured environment file template for your credentials.
2. [`.env.example`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/.env.example): Reference environment variable documentation.
3. [`supabase_schema.sql`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/supabase_schema.sql): PostgreSQL table schemas, indexes, and Row Level Security (RLS) rules.
4. [`src/lib/supabaseClient.ts`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/src/lib/supabaseClient.ts): Frontend Supabase client for React components.
5. [`server/supabase.js`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/server/supabase.js): Backend Supabase client service for Express API endpoints.
6. [`server/seedSupabase.js`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/server/seedSupabase.js): Data migration & seeding script.

---

## 🚀 Step 6: Testing & Verification

1. Start your backend Express server:
   ```bash
   npm run server
   ```
2. In a separate terminal, start your Vite React frontend:
   ```bash
   npm run dev
   ```
3. Test Supabase helper connection from JavaScript:
   ```javascript
   import { SupabaseService } from './server/supabase.js';
   const result = await SupabaseService.checkConnection();
   console.log(result);
   ```

---

## 🔍 Need Help / Troubleshooting

- **CORS Issues**: Ensure your site domain (e.g. `http://localhost:5173`) is listed under **Supabase Dashboard -> Authentication -> URL Configuration**.
- **Permission Denied / RLS Error**: Ensure you ran the SQL schema in Step 4 which configures the Row Level Security (RLS) policies allowing read/write operations.
