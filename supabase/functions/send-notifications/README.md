# Send Notifications Function

Supabase Edge Function that drains the `notification_queue` table, sends any queued email notifications through Resend, and updates delivery status.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL; injected automatically when deployed via Supabase CLI. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key with permissions to read/update `notification_queue` and `profiles`. |
| `RESEND_API_KEY` | API key for [Resend](https://resend.com/) to deliver emails. |
| `NOTIFICATION_EMAIL_FROM` | Optional. Friendly sender, e.g. `Qualis Digital <notifications@qualis.digital>`. Defaults to `Qualis Digital <no-reply@qualis.digital>`. |

### Setting secrets (examples)

```bash
# Set once per Supabase project (replace values in angle brackets)
supabase secrets set \
  RESEND_API_KEY=<your-resend-api-key> \
  NOTIFICATION_EMAIL_FROM="Qualis Digital <notifications@qualis.digital>" \
  --project-ref your-project-ref
```

When running locally with `supabase functions serve`, add the same keys to a `.env` file under `supabase/`:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=<your-resend-api-key>
NOTIFICATION_EMAIL_FROM="Qualis Digital <notifications@qualis.digital>"
```

> **Never commit secrets**. Keep keys in environment variables or Supabase secrets only.

## Deploy & Schedule

1. Deploy the function:
   ```bash
   supabase functions deploy send-notifications --project-ref your-project-ref
   ```
2. Invoke manually (useful for testing):
   ```bash
   supabase functions invoke send-notifications --project-ref your-project-ref --no-verify-jwt --method POST
   ```
3. Automate with a Supabase cron job so queued emails are processed regularly:
   ```bash
   supabase cron upsert send-notifications \
     --project-ref your-project-ref \
     --schedule '*/5 * * * *' \
     --http-method POST \
     --edge-function send-notifications
   ```
4. Optionally adjust batch size with the `batch` query parameter (default 25):
   ```bash
   curl -X POST "https://<project-ref>.functions.supabase.co/send-notifications?batch=50"
   ```

## Workflow Overview

1. Pulls up to `batch` queued rows where `channel = 'email'`.
2. Marks them as `sending` to prevent duplicate delivery.
3. Looks up recipient email addresses in `profiles`.
4. Sends each email via Resend, updating `status` to `sent` or `failed` with an `error_message`.

The workflow endpoint in `src/app/api/workflows/events/route.ts` already stores `subject` and `body` in `payload`, so emails include the same summary recipients see in-app. Adapt the `sendEmail` helper if you prefer another provider.
