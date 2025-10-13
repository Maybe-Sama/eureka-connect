-- ============================================================================
-- VERIFY AVATAR SETUP
-- ============================================================================
-- This script verifies that the avatar system is properly configured
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if avatar_url column exists in students table
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Check storage policies for avatars bucket
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
        AND policyname = 'Public read access for avatars'
    ) THEN '✅ Public read policy exists'
    ELSE '❌ Public read policy MISSING'
  END as public_read_policy;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
        AND policyname = 'Students can upload their own avatars'
    ) THEN '✅ Student upload policy exists'
    ELSE '❌ Student upload policy MISSING'
  END as student_upload_policy;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
        AND policyname = 'Students can update their own avatars'
    ) THEN '✅ Student update policy exists'
    ELSE '❌ Student update policy MISSING'
  END as student_update_policy;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
        AND policyname = 'Students can delete their own avatars'
    ) THEN '✅ Student delete policy exists'
    ELSE '❌ Student delete policy MISSING'
  END as student_delete_policy;

-- ============================================================================
-- STEP 3: Check if RLS is enabled on storage.objects
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'storage' 
        AND c.relname = 'objects'
        AND c.relrowsecurity = true
    ) THEN '✅ RLS enabled on storage.objects'
    ELSE '❌ RLS NOT enabled on storage.objects'
  END as rls_status;

-- ============================================================================
-- STEP 4: Check if there are any students with avatars
-- ============================================================================

SELECT 
  COUNT(*) as total_students,
  COUNT(avatar_url) as students_with_avatars,
  COUNT(*) - COUNT(avatar_url) as students_without_avatars
FROM public.students;

-- ============================================================================
-- STEP 5: Show sample student data with avatar status
-- ============================================================================

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
LIMIT 10;

-- ============================================================================
-- STEP 6: Check system_users table for student relationships
-- ============================================================================

SELECT 
  COUNT(*) as total_system_users,
  COUNT(CASE WHEN user_type = 'student' THEN 1 END) as student_users,
  COUNT(CASE WHEN user_type = 'student' AND student_id IS NOT NULL THEN 1 END) as students_with_student_id
FROM public.system_users;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  avatar_column_exists BOOLEAN;
  rls_enabled BOOLEAN;
  public_read_policy_exists BOOLEAN;
  upload_policy_exists BOOLEAN;
  total_students INTEGER;
  students_with_avatars INTEGER;
BEGIN
  -- Check avatar column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'students' 
      AND column_name = 'avatar_url'
  ) INTO avatar_column_exists;
  
  -- Check RLS
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' 
      AND c.relname = 'objects'
      AND c.relrowsecurity = true
  ) INTO rls_enabled;
  
  -- Check policies
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
      AND policyname = 'Public read access for avatars'
  ) INTO public_read_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
      AND policyname = 'Students can upload their own avatars'
  ) INTO upload_policy_exists;
  
  -- Get student counts
  SELECT COUNT(*), COUNT(avatar_url) 
  INTO total_students, students_with_avatars
  FROM public.students;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                    AVATAR SETUP VERIFICATION                 ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║                                                               ║';
  
  IF avatar_column_exists THEN
    RAISE NOTICE '║  ✅ avatar_url column exists in students table              ║';
  ELSE
    RAISE NOTICE '║  ❌ avatar_url column MISSING in students table             ║';
  END IF;
  
  IF rls_enabled THEN
    RAISE NOTICE '║  ✅ RLS enabled on storage.objects                          ║';
  ELSE
    RAISE NOTICE '║  ❌ RLS NOT enabled on storage.objects                      ║';
  END IF;
  
  IF public_read_policy_exists THEN
    RAISE NOTICE '║  ✅ Public read policy exists                               ║';
  ELSE
    RAISE NOTICE '║  ❌ Public read policy MISSING                              ║';
  END IF;
  
  IF upload_policy_exists THEN
    RAISE NOTICE '║  ✅ Student upload policy exists                            ║';
  ELSE
    RAISE NOTICE '║  ❌ Student upload policy MISSING                           ║';
  END IF;
  
  RAISE NOTICE '║                                                               ║';
  RAISE NOTICE '║  📊 Statistics:                                               ║';
  RAISE NOTICE '║     • Total students: %', total_students, '                                        ║';
  RAISE NOTICE '║     • Students with avatars: %', students_with_avatars, '                                    ║';
  RAISE NOTICE '║                                                               ║';
  
  IF avatar_column_exists AND rls_enabled AND public_read_policy_exists AND upload_policy_exists THEN
    RAISE NOTICE '║  🎉 AVATAR SYSTEM IS READY TO USE!                         ║';
  ELSE
    RAISE NOTICE '║  ⚠️  AVATAR SYSTEM NEEDS CONFIGURATION                     ║';
  END IF;
  
  RAISE NOTICE '║                                                               ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
