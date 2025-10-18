-- Create a private bucket for care documents if it does not exist yet
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Ensure authenticated users can read documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can read documents'
  ) THEN
    CREATE POLICY "Authenticated users can read documents"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END
$$;

-- Ensure authenticated users can upload documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload documents"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'documents');
  END IF;
END
$$;

-- Ensure authenticated users can update documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update documents'
  ) THEN
    CREATE POLICY "Authenticated users can update documents"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'documents')
      WITH CHECK (bucket_id = 'documents');
  END IF;
END
$$;

-- Ensure authenticated users can delete documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete documents"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END
$$;
