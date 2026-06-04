-- ====================================================================
-- Supabase Storage Security Policies for Bucket: Privora
-- ====================================================================
-- This script creates the 'Privora' bucket (if it doesn't exist)
-- and defines Row Level Security (RLS) policies for uploads and downloads.
--
-- How to apply:
-- 1. Go to your Supabase Dashboard (https://supabase.com).
-- 2. Select your project.
-- 3. Click on the "SQL Editor" tab on the left sidebar.
-- 4. Create a new query, paste this script, and click "Run".
-- ====================================================================

-- 1. Ensure the 'Privora' bucket exists and is private by default
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Privora',
  'Privora',
  false,             -- private bucket (requires signed URLs or SELECT policies to access)
  10485760,          -- 10 MB in bytes (10 * 1024 * 1024)
  NULL               -- NULL allows all mime types (we will restrict using RLS)
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = NULL;

-- 2. Enable Row Level Security on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflict errors
DROP POLICY IF EXISTS "Privora Storage Insert Policy" ON storage.objects;
DROP POLICY IF EXISTS "Privora Storage Select Policy" ON storage.objects;
DROP POLICY IF EXISTS "Privora Storage Update Policy" ON storage.objects;
DROP POLICY IF EXISTS "Privora Storage Delete Policy" ON storage.objects;

-- 4. INSERT Policy (Uploads validation)
CREATE POLICY "Privora Storage Insert Policy" ON storage.objects
FOR INSERT
TO public, authenticated, anon
WITH CHECK (
  bucket_id = 'Privora'
  -- Rule A: Max file size must be <= 10MB (10,485,760 bytes)
  AND coalesce((metadata->>'size')::int, 0) <= 10485760
  -- Rule B: Do NOT allow ZIP files (check extension and MIME type)
  AND lower(storage.extension(name)) <> 'zip'
  AND coalesce(metadata->>'mimetype', '') NOT IN (
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'application/octet-stream'
  )
  -- Rule C: Images folder path (Images/*) ONLY allows image MIME types
  AND (
    CASE 
      WHEN name LIKE 'Images/%' THEN (metadata->>'mimetype') LIKE 'image/%'
      ELSE TRUE -- Allow other document types in other paths
    END
  )
);

-- 5. SELECT Policy (Reading files)
-- Allows reading files inside the Privora bucket
CREATE POLICY "Privora Storage Select Policy" ON storage.objects
FOR SELECT
TO public, authenticated, anon
USING (bucket_id = 'Privora');

-- 6. UPDATE Policy (Updating files / metadata)
CREATE POLICY "Privora Storage Update Policy" ON storage.objects
FOR UPDATE
TO public, authenticated, anon
USING (bucket_id = 'Privora')
WITH CHECK (
  bucket_id = 'Privora'
  -- Enforce same restrictions on updates
  AND coalesce((metadata->>'size')::int, 0) <= 10485760
  AND lower(storage.extension(name)) <> 'zip'
  AND coalesce(metadata->>'mimetype', '') NOT IN (
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'application/octet-stream'
  )
  AND (
    CASE 
      WHEN name LIKE 'Images/%' THEN (metadata->>'mimetype') LIKE 'image/%'
      ELSE TRUE
    END
  )
);

-- 7. DELETE Policy (Deleting files)
-- Allows deleting files inside the Privora bucket
CREATE POLICY "Privora Storage Delete Policy" ON storage.objects
FOR DELETE
TO public, authenticated, anon
USING (bucket_id = 'Privora');
