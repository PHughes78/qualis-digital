-- Add photo_url column to clients if it does not exist
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create a private bucket for client photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-pictures', 'client-pictures', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read client pictures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can read client pictures'
  ) THEN
    CREATE POLICY "Authenticated users can read client pictures"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'client-pictures');
  END IF;
END
$$;

-- Allow authenticated users to upload client pictures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload client pictures'
  ) THEN
    CREATE POLICY "Authenticated users can upload client pictures"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'client-pictures');
  END IF;
END
$$;

-- Allow authenticated users to update client pictures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update client pictures'
  ) THEN
    CREATE POLICY "Authenticated users can update client pictures"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'client-pictures')
      WITH CHECK (bucket_id = 'client-pictures');
  END IF;
END
$$;

-- Allow authenticated users to delete client pictures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete client pictures'
  ) THEN
    CREATE POLICY "Authenticated users can delete client pictures"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'client-pictures');
  END IF;
END
$$;
