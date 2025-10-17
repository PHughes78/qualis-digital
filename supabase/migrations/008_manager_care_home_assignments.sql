-- Migration: Add manager care home assignments
-- This allows business owners to assign specific care homes to managers

-- Create manager_care_homes junction table
CREATE TABLE IF NOT EXISTS public.manager_care_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  care_home_id UUID NOT NULL REFERENCES public.care_homes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(manager_id, care_home_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_manager_care_homes_manager ON public.manager_care_homes(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_care_homes_care_home ON public.manager_care_homes(care_home_id);

-- Enable Row Level Security
ALTER TABLE public.manager_care_homes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manager_care_homes

-- Business owners can do everything
CREATE POLICY "Business owners can manage all manager assignments"
  ON public.manager_care_homes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'business_owner'
    )
  );

-- Managers can view their own assignments
CREATE POLICY "Managers can view their own care home assignments"
  ON public.manager_care_homes
  FOR SELECT
  USING (manager_id = auth.uid());

-- Carers can view assignments for context (optional)
CREATE POLICY "Carers can view manager assignments"
  ON public.manager_care_homes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'carer'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.manager_care_homes IS 'Junction table linking managers to the care homes they manage';
COMMENT ON COLUMN public.manager_care_homes.manager_id IS 'Reference to the manager user';
COMMENT ON COLUMN public.manager_care_homes.care_home_id IS 'Reference to the care home being managed';
COMMENT ON COLUMN public.manager_care_homes.assigned_by IS 'Business owner who made the assignment';
