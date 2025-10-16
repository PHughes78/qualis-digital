-- Verification queries to check if everything is set up correctly

-- 1. Check if image_url column exists in care_homes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'care_homes' AND column_name = 'image_url';

-- 2. Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'care-home-images';

-- 3. Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%care home images%';
