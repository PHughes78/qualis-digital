# Deploy Edge Functions to Supabase

## Step 1: Install Supabase CLI

### Option A: Using Chocolatey (Recommended for Windows)
1. Open PowerShell as Administrator
2. If you don't have Chocolatey, install it first:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```
3. Install Supabase CLI:
   ```powershell
   choco install supabase
   ```

### Option B: Manual Download
1. Go to https://github.com/supabase/cli/releases/latest
2. Download `supabase_windows_amd64.zip`
3. Extract it and add the location to your PATH

### Option C: Using Scoop
1. Install Scoop if you don't have it:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
   ```
2. Install Supabase CLI:
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for you to authenticate.

## Step 3: Link Your Project

Get your project reference ID from your Supabase dashboard (Settings > General > Reference ID)

```bash
supabase link --project-ref your-project-ref
```

## Step 4: Set Environment Variables

You need to set these secrets for your edge function:

```bash
# Set Resend API key for email notifications
supabase secrets set RESEND_API_KEY=your_resend_api_key

# Set the notification email sender
supabase secrets set NOTIFICATION_EMAIL_FROM="Qualis Digital <no-reply@yourdomain.com>"
```

## Step 5: Deploy the Edge Function

```bash
# Deploy the send-notifications function
supabase functions deploy send-notifications

# Or deploy all functions
supabase functions deploy
```

## Step 6: Test the Function

```bash
# Invoke the function to test it
supabase functions invoke send-notifications --method POST
```

## Step 7: Set up Scheduled Invocation (Optional)

To run this function automatically on a schedule, you can use:

1. **Supabase Database Webhook** - Create a pg_cron job
2. **External Cron Service** - Use a service like cron-job.org or GitHub Actions
3. **Vercel Cron** - Add to your vercel.json

### Example: Using pg_cron in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Troubleshooting

### Function not deploying?
- Make sure you're in the project root directory
- Check that `supabase/functions/send-notifications/index.ts` exists
- Verify you're logged in: `supabase projects list`

### Secrets not working?
- List current secrets: `supabase secrets list`
- Secrets are only available after deployment
- You can also set them via the Supabase Dashboard

### Function errors?
- Check logs: `supabase functions logs send-notifications`
- Or view in dashboard: Project Settings > Edge Functions > Logs

## Current Edge Functions

### send-notifications
- **Purpose**: Processes queued notifications and sends emails via Resend
- **Trigger**: Manual POST request or scheduled job
- **Required Secrets**:
  - `RESEND_API_KEY` - Your Resend API key
  - `NOTIFICATION_EMAIL_FROM` - Sender email address
- **Environment Variables** (auto-set):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Next Steps

1. Install Supabase CLI (choose one of the methods above)
2. Login to Supabase
3. Link your project
4. Set the required secrets
5. Deploy the function
6. Test it
7. (Optional) Set up scheduled invocation

For more information, visit: https://supabase.com/docs/guides/functions
