-- ============================================================================
-- ADD AVATAR_URL FIELD TO STUDENTS TABLE
-- ============================================================================
-- This migration adds the avatar_url field to the students table for profile pictures
-- ============================================================================

-- Add avatar_url column to students table if it doesn't exist
DO $$ 
BEGIN
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'avatar_url') THEN
        ALTER TABLE public.students ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to students table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in students table';
    END IF;
END $$;

-- Create index for avatar_url lookups
CREATE INDEX IF NOT EXISTS idx_students_avatar_url ON public.students(avatar_url);

-- Add comment for documentation
COMMENT ON COLUMN public.students.avatar_url IS 'URL of the student profile picture stored in Supabase Storage';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if avatar_url column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'students' 
               AND column_name = 'avatar_url') THEN
        RAISE NOTICE '✅ avatar_url column successfully added to students table';
    ELSE
        RAISE NOTICE '❌ Failed to add avatar_url column to students table';
    END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     ✅ AVATAR_URL FIELD ADDED SUCCESSFULLY                   ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  ✓ avatar_url column added to students table                 ║';
    RAISE NOTICE '║  ✓ Index created for performance                             ║';
    RAISE NOTICE '║  ✓ Column documented                                         ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  Next steps:                                                  ║';
    RAISE NOTICE '║  1. Create "avatars" bucket in Supabase Storage              ║';
    RAISE NOTICE '║  2. Set bucket to public access                              ║';
    RAISE NOTICE '║  3. Upload default avatar images to defaults/ folder         ║';
    RAISE NOTICE '║  4. Test avatar upload functionality                         ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
