-- Run this SQL in the Supabase SQL Editor
-- This adds image support for care homes

-- Step 1: Add image_url column to care_homes table
ALTER TABLE care_homes
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Create storage bucket for care home images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('care-home-images', 'care-home-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload care home images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update care home images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete care home images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view care home images" ON storage.objects;

-- Step 4: Create storage policies for care home images
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload care home images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'care-home-images');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update care home images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'care-home-images');

-- Allow authenticated users to delete care home images
CREATE POLICY "Authenticated users can delete care home images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'care-home-images');

-- Allow public read access to care home images
CREATE POLICY "Public can view care home images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'care-home-images');

-- Verification: Check if column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'care_homes' AND column_name = 'image_url';

-- Verification: Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'care-home-images';
