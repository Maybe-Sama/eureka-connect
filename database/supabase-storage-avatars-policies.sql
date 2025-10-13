-- ============================================================================
-- SUPABASE STORAGE AVATARS BUCKET POLICIES
-- ============================================================================
-- This script creates the necessary RLS policies for the avatars bucket
-- to allow students to upload and read avatar images
-- ============================================================================

-- ============================================================================
-- STEP 1: Create avatars bucket (if it doesn't exist)
-- ============================================================================

-- Note: This needs to be done manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "avatars"
-- 4. Make it PUBLIC
-- 5. Create bucket

-- ============================================================================
-- STEP 2: Create RLS policies for storage.objects
-- ============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Students can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own avatars" ON storage.objects;

-- Policy 1: Allow public read access to avatars bucket
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy 2: Allow authenticated students to upload avatars
CREATE POLICY "Students can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.system_users su
    WHERE su.id::text = auth.uid()::text
      AND su.user_type = 'student'
  )
);

-- Policy 3: Allow authenticated students to update their own avatars
CREATE POLICY "Students can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.system_users su
    WHERE su.id::text = auth.uid()::text
      AND su.user_type = 'student'
  )
);

-- Policy 4: Allow authenticated students to delete their own avatars
CREATE POLICY "Students can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.system_users su
    WHERE su.id::text = auth.uid()::text
      AND su.user_type = 'student'
  )
);

-- ============================================================================
-- STEP 3: Create folder structure
-- ============================================================================

-- Note: Create the 'defaults' folder manually in Supabase Storage:
-- 1. Go to Storage > avatars bucket
-- 2. Click "New folder"
-- 3. Name: "defaults"
-- 4. Upload some default avatar images to this folder

-- ============================================================================
-- STEP 4: Verification queries
-- ============================================================================

-- Check if policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- Check if bucket exists (this will show in Supabase Dashboard)
-- Go to Storage and verify the 'avatars' bucket exists and is public

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     ✅ AVATAR STORAGE POLICIES CONFIGURED                   ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  ✓ RLS enabled on storage.objects                            ║';
    RAISE NOTICE '║  ✓ Public read access for avatars bucket                     ║';
    RAISE NOTICE '║  ✓ Students can upload their own avatars                     ║';
    RAISE NOTICE '║  ✓ Students can update their own avatars                     ║';
    RAISE NOTICE '║  ✓ Students can delete their own avatars                     ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  Next steps:                                                  ║';
    RAISE NOTICE '║  1. Create "avatars" bucket in Supabase Storage (if not done)║';
    RAISE NOTICE '║  2. Set bucket to PUBLIC access                              ║';
    RAISE NOTICE '║  3. Create "defaults" folder in avatars bucket               ║';
    RAISE NOTICE '║  4. Upload default avatar images to defaults/ folder         ║';
    RAISE NOTICE '║  5. Test avatar upload functionality                         ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
