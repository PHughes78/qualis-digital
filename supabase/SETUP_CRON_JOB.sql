-- Setup Cron Job for Email Notifications
-- Run this in your Supabase SQL Editor

-- First, enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to invoke the edge function with proper auth
CREATE OR REPLACE FUNCTION invoke_send_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
BEGIN
  -- Get the service role key from your vault or set it as a constant
  -- IMPORTANT: Replace 'your-service-role-key' with your actual service role key
  service_role_key := 'your-service-role-key';
  
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

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'process-email-notifications',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT invoke_send_notifications();'
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('process-email-notifications');
