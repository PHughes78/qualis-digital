-- Add image_url column to care_homes table
ALTER TABLE care_homes
ADD COLUMN image_url TEXT;

-- Create storage bucket for care home images
INSERT INTO storage.buckets (id, name, public)
VALUES ('care-home-images', 'care-home-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for care home images
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
