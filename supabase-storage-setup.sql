-- ===================================================================
-- SUPABASE STORAGE BUCKET SETUP
-- ===================================================================
-- This script sets up storage buckets and RLS policies for VerificaYa
-- Run this AFTER creating the buckets in Supabase Dashboard
--
-- IMPORTANT: Buckets must be created via Dashboard first!
-- Dashboard > Storage > Create bucket
--
-- Buckets to create:
-- 1. 'documents' - For tenant uploaded documents (private)
-- 2. 'reports' - For generated PDF reports (private)
-- ===================================================================

-- ===================================================================
-- STEP 1: VERIFY BUCKETS EXIST
-- ===================================================================
-- Run this to check if buckets are created
SELECT id, name, public, created_at
FROM storage.buckets
WHERE name IN ('documents', 'reports');

-- Expected result: 2 rows
-- If you see 0 rows, create buckets in Dashboard first!

-- ===================================================================
-- STEP 2: DOCUMENTS BUCKET POLICIES
-- ===================================================================
-- Allow authenticated users to upload documents for their screenings

-- Policy 1: Allow authenticated uploads to documents bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow users to view their own documents
DROP POLICY IF EXISTS "Allow users to view own documents" ON storage.objects;

CREATE POLICY "Allow users to view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to update their own documents
DROP POLICY IF EXISTS "Allow users to update own documents" ON storage.objects;

CREATE POLICY "Allow users to update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own documents
DROP POLICY IF EXISTS "Allow users to delete own documents" ON storage.objects;

CREATE POLICY "Allow users to delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ===================================================================
-- STEP 3: REPORTS BUCKET POLICIES
-- ===================================================================
-- Allow service role full access (API generates reports)
-- Allow landlords to view reports for their screenings

-- Policy 1: Service role can do everything with reports
DROP POLICY IF EXISTS "Service role can manage reports" ON storage.objects;

CREATE POLICY "Service role can manage reports"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'reports')
WITH CHECK (bucket_id = 'reports');

-- Policy 2: Authenticated users can view reports
-- (Additional screening_id check should be done at API level)
DROP POLICY IF EXISTS "Authenticated users can view reports" ON storage.objects;

CREATE POLICY "Authenticated users can view reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

-- ===================================================================
-- STEP 4: VERIFY POLICIES
-- ===================================================================
-- Check that all policies were created

SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%documents%' OR policyname LIKE '%reports%')
ORDER BY policyname;

-- Expected: 6 policies
-- - 4 for documents bucket (INSERT, SELECT, UPDATE, DELETE)
-- - 2 for reports bucket (ALL for service_role, SELECT for authenticated)

-- ===================================================================
-- STEP 5: TEST QUERIES (Optional)
-- ===================================================================

-- Test 1: Check documents bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'documents';

-- Test 2: Check reports bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'reports';

-- Test 3: List all storage policies
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- ===================================================================
-- TROUBLESHOOTING
-- ===================================================================
--
-- Error: "policy for relation "objects" already exists"
-- Solution: Run the DROP POLICY commands before CREATE POLICY
--
-- Error: "bucket does not exist"
-- Solution: Create buckets in Dashboard > Storage first
--
-- Error: "permission denied for schema storage"
-- Solution: Make sure you're running this as the postgres user
--
-- ===================================================================

-- ===================================================================
-- NOTES FOR MANUAL BUCKET CREATION
-- ===================================================================
--
-- In Supabase Dashboard > Storage:
--
-- 1. CREATE 'documents' BUCKET:
--    - Name: documents
--    - Public: OFF (unchecked)
--    - File size limit: 10 MB (10485760 bytes)
--    - Allowed MIME types:
--      * image/jpeg
--      * image/png
--      * application/pdf
--      * image/jpg
--
-- 2. CREATE 'reports' BUCKET:
--    - Name: reports
--    - Public: OFF (unchecked)
--    - File size limit: 5 MB (5242880 bytes)
--    - Allowed MIME types:
--      * application/pdf
--
-- ===================================================================

-- Mark as complete
SELECT '✅ Storage bucket policies configured successfully!' as status;
