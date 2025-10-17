# Company Settings Migration Instructions

## Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the entire contents of `RUN_COMPANY_SETTINGS_MIGRATION.sql`
5. Click **"Run"** to execute

## Option 2: Using Supabase CLI

If you have the Supabase CLI configured and linked to your project:

```powershell
cd "C:\Code\Qualis\Qualis Internal CRM"
supabase db push
```

This will apply all pending migrations including `007_company_settings.sql`.

## What This Migration Does

✅ Creates `company_settings` table with:
  - company_name
  - company_description
  - logo_url
  - primary_color
  - Auto-updating timestamps

✅ Creates `company-logos` storage bucket (public read)

✅ Sets up Row Level Security (RLS):
  - Everyone can read company settings (for login page branding)
  - Only business_owner role can update settings
  - Only business_owner role can upload/manage logos

✅ Inserts default company settings

✅ Creates trigger for automatic timestamp updates

## Verification Queries

After running the migration, verify it worked:

```sql
-- Check table exists
SELECT * FROM public.company_settings;

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'company-logos';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'company_settings';
```

## Next Steps

1. Run the migration
2. Log in as a business_owner user
3. Navigate to `/settings/company`
4. Upload your company logo and customize branding
