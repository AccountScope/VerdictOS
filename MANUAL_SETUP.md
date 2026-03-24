# VerdictOS Supabase Setup — Manual Steps

## Database Migrations

Go to your Supabase dashboard: https://supabase.com/dashboard/project/jazrnbmhppwiuezjnlnf

### Step 1: Run Schema Migration

1. Click **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `DATA_MODEL.sql`
4. Paste into the editor
5. Click **Run** (bottom right)

### Step 2: Run RLS Policies

1. Click **New query** again
2. Copy the entire contents of `RLS_POLICIES.sql`
3. Paste and **Run**

### Step 3: Run Indexes

1. Click **New query** again
2. Copy the entire contents of `INDEXES.sql`
3. Paste and **Run**

---

## Environment Variables

✅ Already created: `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://jazrnbmhppwiuezjnlnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphenJuYm1ocHB3aXVlempubG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTQ5MDMsImV4cCI6MjA4OTkzMDkwM30.g0weAtojAbHMWfmwv_v6pT3ds8BlZ1P7Php8zEIgFMY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphenJuYm1ocHB3aXVlempubG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1NDkwMywiZXhwIjoyMDg5OTMwOTAzfQ.qkk-VvDUtutZBxHuTaeo4rCRKy80EdQsyqjEtPNQocg
VERDICTOS_API_SECRET=868ea2da5f1ad4c64c60c6e7493babd05167e90d6ab89729d0161a2e935fa104
WEBHOOK_SIGNING_SECRET=c4e0f66fe5b067401f9fad797c75979fa696c094d116937aed6ae32cac932f04
```

---

## Test Local Dev Server

```bash
cd /data/.openclaw/workspace/verdictos-api
npm install
npm run dev
```

Open: http://localhost:3000/api/v1/health

Expected response:
```json
{"status":"ok"}
```

---

## Troubleshooting

**If migrations fail:**
- Check for existing tables (drop them first if re-running)
- Run migrations one at a time
- Check SQL Editor logs for specific errors

**If dev server fails:**
- Verify `.env.local` exists in project root
- Check Supabase project is active
- Verify API keys are correct
