# Company Branding & Settings Feature

## Overview
This feature allows business owners to customize the company's branding and information displayed throughout the Qualis Digital platform, including the login page.

## Features Implemented

### 1. Database Schema
**Migration**: `007_company_settings.sql`

- **Table**: `company_settings` (singleton table - one row only)
  - `company_name`: Company display name
  - `company_description`: Brief description shown on login and public areas
  - `logo_url`: URL to uploaded company logo
  - `primary_color`: Brand color (future feature for theme customization)
  - `updated_by`: Tracks who made the last update
  - Automatic `updated_at` timestamp via trigger

- **Storage Bucket**: `company-logos`
  - Public read access (for login page visibility)
  - Upload/update/delete restricted to business_owner role

### 2. Row Level Security Policies
- **Read**: Anyone can view company settings (needed for unauthenticated login page)
- **Update**: Only users with `business_owner` role can modify settings
- **Storage**: Only business_owner can upload/manage logos

### 3. Company Settings Context
**File**: `src/contexts/CompanySettingsContext.tsx`

- Global context providing company settings to all components
- Real-time updates via Supabase subscriptions
- Accessible even on unauthenticated pages (login)
- Added to root layout provider tree

### 4. Company Settings Page
**Route**: `/settings/company`

**Features**:
- Logo upload with preview (max 2MB, image files only)
- Company name and description editor
- Primary brand color picker (prepared for future theming)
- Live preview showing how branding appears on login page
- Restricted to business_owner role only
- Validates and displays errors
- Success notifications
- Cancel button returns to dashboard

### 5. Dynamic Branding in AuthForm
**Updates to**: `src/components/auth/AuthForm.tsx`

- Replaced hardcoded "Qualis Digital" with dynamic `settings.company_name`
- Replaced placeholder description with dynamic `settings.company_description`
- Replaced `/vercel.svg` placeholder with uploaded `settings.logo_url`
- Falls back to defaults if settings not loaded or missing

### 6. Business Owner Dashboard Integration
**Updates to**: `src/components/dashboards/BusinessOwnerDashboard.tsx`

- Added "Company Settings" as primary action button (first in Quick Actions)
- Settings icon from lucide-react
- Quick access for business owners to manage branding

## Usage Instructions

### For Business Owners:

1. **Access Settings**:
   - Log in as a business owner
   - Go to Dashboard
   - Click "Company Settings" in Quick Actions

2. **Upload Logo**:
   - Click "Choose File" under Company Logo
   - Select your logo image (PNG, JPG, or SVG recommended)
   - Preview appears immediately
   - Logo must be under 2MB
   - Square format (200x200px minimum) recommended

3. **Update Company Details**:
   - Edit Company Name
   - Update Company Description (appears on login page)
   - Choose primary brand color (reserved for future theming)

4. **Save Changes**:
   - Click "Save Changes"
   - Settings update across entire platform in real-time
   - Logo appears on login page for all users

5. **Preview**:
   - Check the preview card to see how branding looks
   - Simulates the login page hero panel appearance

### Testing the Feature:

1. **Run the migration**:
   ```sql
   -- Execute in Supabase SQL Editor or via Supabase CLI
   -- File: supabase/migrations/007_company_settings.sql
   ```

2. **Verify default settings exist**:
   - Company settings table should have one row with defaults
   - Storage bucket `company-logos` should be created

3. **Test as business owner**:
   - Create or use existing business_owner account
   - Navigate to `/settings/company`
   - Upload a logo and update details
   - Save and verify changes

4. **Test on login page**:
   - Sign out
   - Visit `/auth`
   - Verify custom logo, company name, and description appear

5. **Test authorization**:
   - Try accessing `/settings/company` as carer or manager
   - Should redirect to `/unauthorized`

## Technical Notes

### Security
- RLS policies ensure only business_owner can modify settings
- Public read access required for unauthenticated login page branding
- Storage policies mirror table-level permissions

### Real-time Updates
- CompanySettingsContext subscribes to Postgres changes
- Any update triggers automatic refresh across all connected clients
- No page reload needed to see updated branding

### Performance
- Settings cached in React context after initial load
- Logo stored in Supabase storage with public CDN URLs
- Single database row (singleton pattern) ensures fast queries

### Future Enhancements
- **Primary color theming**: Apply `primary_color` to buttons, links, accents
- **Multiple logos**: Support light/dark mode variants
- **Favicon upload**: Custom favicon for browser tabs
- **Email templates**: Use branding in system emails
- **White labeling**: Full rebrand capability for resellers

## Files Created/Modified

**New Files**:
- `supabase/migrations/007_company_settings.sql`
- `src/contexts/CompanySettingsContext.tsx`
- `src/app/settings/company/page.tsx`
- `COMPANY_BRANDING_FEATURE.md` (this file)

**Modified Files**:
- `src/app/layout.tsx` (added CompanySettingsProvider)
- `src/components/auth/AuthForm.tsx` (dynamic branding)
- `src/components/dashboards/BusinessOwnerDashboard.tsx` (settings link)

## Database Schema

```sql
-- Company Settings Table
CREATE TABLE company_settings (
  id UUID PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_description TEXT,
  logo_url TEXT,
  primary_color TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);
```

## Environment Variables
No additional environment variables required. Uses existing Supabase configuration.

## Next Steps
1. Run the migration in your Supabase project
2. Access `/settings/company` as a business_owner
3. Upload your company logo
4. Customize company name and description
5. Verify branding on login page

---
**Feature Status**: ✅ Complete and ready for testing
**Last Updated**: 2025-10-17
