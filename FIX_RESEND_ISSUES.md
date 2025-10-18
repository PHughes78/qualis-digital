# Fix Resend Email Issues

## Issue 1: Domain Not Verified (403 Error)

You're seeing this error:
```
"The qualis.digital domain is not verified"
```

### Quick Fix (For Testing)

Use Resend's test domain instead. In **Supabase Dashboard**:

1. Go to **Edge Functions** → find your function
2. Click **Secrets** or **Environment Variables**
3. Update `NOTIFICATION_EMAIL_FROM` to:
   ```
   Qualis Digital <onboarding@resend.dev>
   ```
4. Save

### Production Fix (Verify Your Domain)

1. Go to https://resend.com/domains
2. Click **"Add Domain"**
3. Enter: `qualis.digital`
4. Add the DNS records to your domain registrar:
   - **DKIM Record**: Add the TXT record
   - **Return-Path**: Add the CNAME record
5. Wait for verification (can take a few minutes to 48 hours)
6. Once verified, update the email to:
   ```
   Qualis Digital <notifications@qualis.digital>
   ```

## Issue 2: Rate Limit Exceeded (429 Error)

Resend free tier allows **2 requests per second**.

### ✅ Already Fixed!

I've updated the edge function to add a 500ms delay between emails. This ensures you stay within the rate limit.

### Additional Recommendations:

1. **Reduce batch size** - Instead of processing 25 emails at once, reduce to 10:
   ```sql
   -- In your cron job SQL, change the URL to:
   'https://wszgwkhnlvtnzstcwfuq.supabase.co/functions/v1/send-notifications?batch=10'
   ```

2. **Increase cron frequency** - Run more often but with smaller batches:
   ```sql
   -- Change from every 5 minutes to every 2 minutes
   SELECT cron.schedule(
     'process-email-notifications',
     '*/2 * * * *',  -- Every 2 minutes
     'SELECT invoke_send_notifications();'
   );
   ```

3. **Upgrade Resend** (if needed) - Higher tiers have higher rate limits

## Next Steps

1. **Update the email sender** to use `onboarding@resend.dev` (quick fix)
2. **Redeploy the function** with rate limiting:
   ```bash
   # If you have Supabase CLI installed:
   supabase functions deploy send-notifications --project-ref wszgwkhnlvtnzstcwfuq
   ```
   
   Or via Dashboard:
   - Go to **Edge Functions** → **send-notifications**
   - Click **Edit** or **Redeploy**
   - Copy the updated code from `supabase/functions/send-notifications/index.ts`
   - Deploy

3. **Test again** - Invoke the function manually to verify emails send

4. (Optional) **Verify your domain** for production use

## Testing

After making changes, test with:
```bash
curl -X POST \
  https://wszgwkhnlvtnzstcwfuq.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"batch": 5}'
```

Or use the **Invoke** button in the Supabase Dashboard.
