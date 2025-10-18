-- Migration: Add client_type classification to clients table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'client_type'
  ) THEN
    CREATE TYPE client_type AS ENUM ('adult', 'child');
  END IF;
END
$$;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS client_type client_type;

UPDATE public.clients
SET client_type = CASE
  WHEN date_of_birth > (CURRENT_DATE - INTERVAL '18 years') THEN 'child'::client_type
  ELSE 'adult'::client_type
END
WHERE client_type IS NULL;

ALTER TABLE public.clients
  ALTER COLUMN client_type SET NOT NULL,
  ALTER COLUMN client_type SET DEFAULT 'adult'::client_type;

COMMENT ON COLUMN public.clients.client_type IS 'Classification flag indicating whether the resident is a child or adult.';
