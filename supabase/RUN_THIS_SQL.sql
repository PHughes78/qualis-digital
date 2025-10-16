-- Copy and paste this SQL into your Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query)

-- Add city column to care_homes table
ALTER TABLE care_homes 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update any existing records
UPDATE care_homes 
SET city = 'Not specified' 
WHERE city IS NULL OR city = '';

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'care_homes' 
ORDER BY ordinal_position;
