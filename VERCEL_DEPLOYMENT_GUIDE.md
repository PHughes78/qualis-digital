# Vercel Deployment - Environment Variables Setup

## Your Deployment Status
✅ Project created: **qualisdigital**
✅ Team: **Adviser Cloud Team**
🔗 Project URL: https://vercel.com/adviser-cloud-team/qualisdigital

## ⚠️ Next Step: Add Environment Variables

Your build failed because the Supabase environment variables are missing. Here's how to add them:

### Option 1: Via Vercel Dashboard (Easiest)

1. **Go to your project settings:**
   https://vercel.com/adviser-cloud-team/qualisdigital/settings/environment-variables

2. **Add these 3 environment variables:**

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://wszgwkhnlvtnzstcwfuq.supabase.co`
   - Environment: Production, Preview, Development (select all)

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzemd3a2hubHZ0bnpzdGN3ZnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzI1NDMsImV4cCI6MjA3NjIwODU0M30.wZNmqPKU-vCoWElBS7XPusEBqxyNqkfEXeHklatGqZw`
   - Environment: Production, Preview, Development (select all)

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzemd3a2hubHZ0bnpzdGN3ZnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYzMjU0MywiZXhwIjoyMDc2MjA4NTQzfQ.dvgZCMhagy7AbXgzlBFIejH8e5sT0ZMSzbg7uTjBymc`
   - Environment: Production, Preview, Development (select all)

3. **Click "Save"** after each variable

4. **Redeploy** by running: `vercel --prod`

### Option 2: Via CLI (Alternative)

Run these commands one by one:

```powershell
# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# When prompted, paste: https://wszgwkhnlvtnzstcwfuq.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# When prompted, paste the anon key from above

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# When prompted, paste the service role key from above
```

Then redeploy:
```powershell
vercel --prod
```

## Quick Links

- **Vercel Project Dashboard:** https://vercel.com/adviser-cloud-team/qualisdigital
- **Environment Variables:** https://vercel.com/adviser-cloud-team/qualisdigital/settings/environment-variables
- **Deployments:** https://vercel.com/adviser-cloud-team/qualisdigital/deployments
- **Supabase Dashboard:** https://supabase.com/dashboard/project/wszgwkhnlvtnzstcwfuq

## After Adding Variables

Once you've added the environment variables via the dashboard, just run:

```powershell
vercel --prod
```

This will trigger a new deployment with the environment variables configured.

---

**Recommendation:** Use Option 1 (Vercel Dashboard) - it's faster and you can see all variables at once.
