-- ============================================================================
-- TEST AVATAR CLEANUP FUNCTIONALITY
-- ============================================================================
-- This script helps test the avatar cleanup functionality
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current avatar status for all students
-- ============================================================================

SELECT 
  s.id,
  s.first_name,
  s.last_name,
  s.avatar_url,
  CASE 
    WHEN s.avatar_url IS NULL THEN '❌ Sin avatar'
    WHEN s.avatar_url LIKE '%/defaults/%' THEN '🔵 Avatar predefinido'
    WHEN s.avatar_url LIKE '%user-%' THEN '🟢 Avatar personalizado'
    ELSE '❓ Avatar desconocido'
  END as avatar_type,
  CASE 
    WHEN s.avatar_url LIKE '%user-%' THEN 
      SUBSTRING(s.avatar_url FROM '.*/([^/]+)$')
    ELSE NULL
  END as custom_avatar_filename
FROM public.students s
ORDER BY s.id;

-- ============================================================================
-- STEP 2: Count avatars by type
-- ============================================================================

SELECT 
  'Total estudiantes' as category,
  COUNT(*) as count
FROM public.students
UNION ALL
SELECT 
  'Sin avatar' as category,
  COUNT(*) as count
FROM public.students 
WHERE avatar_url IS NULL
UNION ALL
SELECT 
  'Avatar predefinido' as category,
  COUNT(*) as count
FROM public.students 
WHERE avatar_url LIKE '%/defaults/%'
UNION ALL
SELECT 
  'Avatar personalizado' as category,
  COUNT(*) as count
FROM public.students 
WHERE avatar_url LIKE '%user-%';

-- ============================================================================
-- STEP 3: Check storage files (if accessible)
-- ============================================================================

-- Note: This would need to be run in Supabase Dashboard > Storage
-- to see what files actually exist in the avatars bucket

-- ============================================================================
-- STEP 4: Test cleanup logic (simulation)
-- ============================================================================

-- Simulate the cleanup logic that the API uses
WITH avatar_analysis AS (
  SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.avatar_url,
    CASE 
      WHEN s.avatar_url IS NULL THEN 'none'
      WHEN s.avatar_url LIKE '%/defaults/%' THEN 'predefined'
      WHEN s.avatar_url LIKE '%user-%' THEN 'custom'
      ELSE 'unknown'
    END as avatar_type,
    CASE 
      WHEN s.avatar_url LIKE '%user-%' THEN 
        SUBSTRING(s.avatar_url FROM '.*/([^/]+)$')
      ELSE NULL
    END as custom_avatar_filename
  FROM public.students s
)
SELECT 
  *,
  CASE 
    WHEN avatar_type = 'custom' THEN '🗑️ Este avatar personalizado se eliminaría al cambiar'
    WHEN avatar_type = 'predefined' THEN '🔵 Este avatar predefinido NO se eliminaría'
    WHEN avatar_type = 'none' THEN '⚪ Sin avatar - se puede subir uno nuevo'
    ELSE '❓ Tipo desconocido'
  END as cleanup_action
FROM avatar_analysis
ORDER BY avatar_type, id;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  total_students INTEGER;
  students_with_custom_avatars INTEGER;
  students_with_predefined_avatars INTEGER;
  students_without_avatars INTEGER;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO total_students FROM public.students;
  
  SELECT COUNT(*) INTO students_with_custom_avatars 
  FROM public.students 
  WHERE avatar_url LIKE '%user-%';
  
  SELECT COUNT(*) INTO students_with_predefined_avatars 
  FROM public.students 
  WHERE avatar_url LIKE '%/defaults/%';
  
  SELECT COUNT(*) INTO students_without_avatars 
  FROM public.students 
  WHERE avatar_url IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                AVATAR CLEANUP TEST RESULTS                   ║';
  RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║                                                               ║';
  RAISE NOTICE '║  📊 Statistics:                                               ║';
  RAISE NOTICE '║     • Total estudiantes: %', total_students, '                                        ║';
  RAISE NOTICE '║     • Con avatar personalizado: %', students_with_custom_avatars, '                                    ║';
  RAISE NOTICE '║     • Con avatar predefinido: %', students_with_predefined_avatars, '                                    ║';
  RAISE NOTICE '║     • Sin avatar: %', students_without_avatars, '                                        ║';
  RAISE NOTICE '║                                                               ║';
  RAISE NOTICE '║  🔧 Cleanup Logic:                                            ║';
  RAISE NOTICE '║     • Avatares personalizados se eliminan al cambiar          ║';
  RAISE NOTICE '║     • Avatares predefinidos NO se eliminan                    ║';
  RAISE NOTICE '║     • Solo se puede tener un avatar personalizado por usuario ║';
  RAISE NOTICE '║                                                               ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
