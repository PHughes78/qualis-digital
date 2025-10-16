-- Add city column to care_homes table to align with UI
ALTER TABLE care_homes 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update existing records to extract city from address if needed
-- This is a placeholder - you may need to manually update existing records
UPDATE care_homes 
SET city = 'Not specified' 
WHERE city IS NULL OR city = '';

-- Add comment to the table
COMMENT ON TABLE care_homes IS 'Care facilities managed by the organization';

-- Add comments to new column
COMMENT ON COLUMN care_homes.city IS 'City where the care home is located';
