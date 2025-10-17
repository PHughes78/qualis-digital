-- Migration: Company Settings
-- Description: Add company_settings table for branding and company information
-- Restricted to business_owner role for updates

-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Qualis Digital',
  company_description TEXT DEFAULT 'Unified UK care management platform',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default company settings (singleton pattern - only one row)
INSERT INTO public.company_settings (company_name, company_description)
VALUES ('Qualis Digital', 'Unified UK care management platform')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read company settings (needed for branding on auth page)
CREATE POLICY "Company settings are viewable by everyone"
  ON public.company_settings
  FOR SELECT
  TO public
  USING (true);

-- Only business owners can update company settings
CREATE POLICY "Only business owners can update company settings"
  ON public.company_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_owner'
    )
  );

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company logos
-- Anyone can view logos (public bucket)
CREATE POLICY "Company logos are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- Only business owners can upload/update logos
CREATE POLICY "Business owners can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_owner'
    )
  );

CREATE POLICY "Business owners can update company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_owner'
    )
  )
  WITH CHECK (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_owner'
    )
  );

CREATE POLICY "Business owners can delete company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_owner'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

COMMENT ON TABLE public.company_settings IS 'Company branding and information settings (singleton table - one row only)';
