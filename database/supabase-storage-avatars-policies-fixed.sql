-- ============================================================================
-- SUPABASE STORAGE AVATARS BUCKET POLICIES (FIXED VERSION)
-- ============================================================================
-- This script creates the necessary policies for the avatars bucket
-- using the correct Supabase approach for storage policies
-- ============================================================================

-- ============================================================================
-- IMPORTANT: This script should be run in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Create storage policies using Supabase's storage policy syntax
-- ============================================================================

-- Note: These policies need to be created through the Supabase Dashboard
-- Go to: Storage > Policies > New Policy

-- Policy 1: Public read access for avatars bucket
-- Policy Name: "Public read access for avatars"
-- Target roles: public
-- Operation: SELECT
-- USING expression: bucket_id = 'avatars'

-- Policy 2: Allow authenticated users to upload to avatars bucket
-- Policy Name: "Authenticated users can upload avatars"
-- Target roles: authenticated
-- Operation: INSERT
-- WITH CHECK expression: bucket_id = 'avatars'

-- Policy 3: Allow authenticated users to update avatars
-- Policy Name: "Authenticated users can update avatars"
-- Target roles: authenticated
-- Operation: UPDATE
-- USING expression: bucket_id = 'avatars'
-- WITH CHECK expression: bucket_id = 'avatars'

-- Policy 4: Allow authenticated users to delete avatars
-- Policy Name: "Authenticated users can delete avatars"
-- Target roles: authenticated
-- Operation: DELETE
-- USING expression: bucket_id = 'avatars'

-- ============================================================================
-- ALTERNATIVE: Use Supabase CLI or Dashboard to create policies
-- ============================================================================

-- If you have Supabase CLI installed, you can run:
-- supabase storage policy create "Public read access for avatars" --bucket avatars --operation SELECT --target public --using "bucket_id = 'avatars'"
-- supabase storage policy create "Authenticated users can upload avatars" --bucket avatars --operation INSERT --target authenticated --with-check "bucket_id = 'avatars'"
-- supabase storage policy create "Authenticated users can update avatars" --bucket avatars --operation UPDATE --target authenticated --using "bucket_id = 'avatars'" --with-check "bucket_id = 'avatars'"
-- supabase storage policy create "Authenticated users can delete avatars" --bucket avatars --operation DELETE --target authenticated --using "bucket_id = 'avatars'"

-- ============================================================================
-- MANUAL STEPS IN SUPABASE DASHBOARD
-- ============================================================================

-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket "avatars" if it doesn't exist
-- 3. Set bucket to PUBLIC
-- 4. Go to Storage > Policies
-- 5. Create the following policies:

-- Policy 1: Public read access
-- - Policy name: "Public read access for avatars"
-- - Target roles: public
-- - Operation: SELECT
-- - USING: bucket_id = 'avatars'

-- Policy 2: Authenticated upload
-- - Policy name: "Authenticated users can upload avatars"
-- - Target roles: authenticated
-- - Operation: INSERT
-- - WITH CHECK: bucket_id = 'avatars'

-- Policy 3: Authenticated update
-- - Policy name: "Authenticated users can update avatars"
-- - Target roles: authenticated
-- - Operation: UPDATE
-- - USING: bucket_id = 'avatars'
-- - WITH CHECK: bucket_id = 'avatars'

-- Policy 4: Authenticated delete
-- - Policy name: "Authenticated users can delete avatars"
-- - Target roles: authenticated
-- - Operation: DELETE
-- - USING: bucket_id = 'avatars'

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if avatar_url column exists in students table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'avatar_url'
    ) THEN '✅ avatar_url column exists in students table'
    ELSE '❌ avatar_url column MISSING in students table'
  END as avatar_column_status;

-- Check if there are any students with avatars
SELECT 
  COUNT(*) as total_students,
  COUNT(avatar_url) as students_with_avatars,
  COUNT(*) - COUNT(avatar_url) as students_without_avatars
FROM public.students;

-- Show sample student data with avatar status
SELECT 
  s.id,
  s.first_name,
  s.last_name,
  CASE 
    WHEN s.avatar_url IS NOT NULL THEN '✅ Has avatar'
    ELSE '❌ No avatar'
  END as avatar_status,
  s.avatar_url
FROM public.students s
ORDER BY s.id
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     📋 AVATAR STORAGE SETUP INSTRUCTIONS                    ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  ⚠️  This script cannot modify storage policies directly      ║';
    RAISE NOTICE '║      You need to create them manually in Supabase Dashboard  ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  📝 Manual steps required:                                   ║';
    RAISE NOTICE '║  1. Go to Supabase Dashboard > Storage                       ║';
    RAISE NOTICE '║  2. Create bucket "avatars" (if not exists)                  ║';
    RAISE NOTICE '║  3. Set bucket to PUBLIC                                     ║';
    RAISE NOTICE '║  4. Go to Storage > Policies                                 ║';
    RAISE NOTICE '║  5. Create the 4 policies listed above                       ║';
    RAISE NOTICE '║  6. Create "defaults" folder in avatars bucket               ║';
    RAISE NOTICE '║  7. Upload default avatar images to defaults/ folder         ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  🔗 Or use Supabase CLI (if available):                     ║';
    RAISE NOTICE '║     Run the supabase storage policy create commands above    ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
