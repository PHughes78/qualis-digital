-- SECURE Cron Job Setup using Supabase Vault
-- Run this in your Supabase SQL Editor

-- Step 1: Store your service role key in Vault (do this ONCE)
-- Replace 'your-actual-service-role-key' with your real key from Project Settings > API
SELECT vault.create_secret(
  'your-actual-service-role-key',
  'service_role_key'
);

-- Step 2: Create a secure function to invoke the edge function
CREATE OR REPLACE FUNCTION invoke_send_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
BEGIN
  -- Retrieve the service role key from vault
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;
  
  -- Call the edge function with authorization
  PERFORM net.http_post(
    url := 'https://wszgwkhnlvtnzstcwfuq.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Step 3: Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'process-email-notifications',
  '*/5 * * * *',  -- Every 5 minutes (adjust as needed)
  'SELECT invoke_send_notifications();'
);

-- ✅ Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'process-email-notifications';

-- 📊 Check recent cron job runs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-notifications')
ORDER BY start_time DESC 
LIMIT 10;

-- ❌ To remove the cron job (if needed):
-- SELECT cron.unschedule('process-email-notifications');

-- ❌ To delete the vault secret (if needed):
-- DELETE FROM vault.secrets WHERE name = 'service_role_key';
