-- ============================================================================
-- MIGRATION: Add Student Preferences and Email Verification
-- ============================================================================
-- This migration adds:
-- 1. student_preferences table for storing student UI preferences
-- 2. Email verification fields to system_users table
-- 3. RLS policies for secure access control
-- ============================================================================

-- ============================================================================
-- STEP 1: Create student_preferences Table
-- ============================================================================
-- This table stores UI preferences for each student (colors, themes, etc.)

CREATE TABLE IF NOT EXISTS public.student_preferences (
  id BIGSERIAL PRIMARY KEY,
  student_id INTEGER UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  primary_color TEXT NOT NULL DEFAULT '#0ea5e9',   -- color primario (por defecto azul)
  accent_color  TEXT NOT NULL DEFAULT '#22c55e',   -- color de acento (por defecto verde)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.student_preferences IS 'Stores UI preferences for each student';
COMMENT ON COLUMN public.student_preferences.primary_color IS 'Primary color for student UI theme';
COMMENT ON COLUMN public.student_preferences.accent_color IS 'Accent color for student UI theme';

-- ============================================================================
-- STEP 2: Enable RLS and Create Security Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS sp_select_student_prefs ON public.student_preferences;
DROP POLICY IF EXISTS sp_update_student_prefs ON public.student_preferences;
DROP POLICY IF EXISTS sp_insert_student_prefs ON public.student_preferences;

-- Policy for SELECT: only the student owner can read their preferences
CREATE POLICY sp_select_student_prefs
ON public.student_preferences FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.system_users su
    WHERE su.id::text = auth.uid()::text
      AND su.user_type = 'student'
      AND su.student_id = student_preferences.student_id
  )
);

-- Policy for UPDATE: only the student owner can modify their preferences
CREATE POLICY sp_update_student_prefs
ON public.student_preferences FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.system_users su
    WHERE su.id::text = auth.uid()::text
      AND su.user_type = 'student'
      AND su.student_id = student_preferences.student_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.system_users su
    WHERE su.id::text = auth.uid()::text
      AND su.user_type = 'student'
      AND su.student_id = student_preferences.student_id
  )
);

-- Policy for INSERT: service_role can create preferences (for initialization)
CREATE POLICY sp_insert_student_prefs
ON public.student_preferences FOR INSERT TO service_role
WITH CHECK (true);

-- ============================================================================
-- STEP 3: Add Email Verification Fields to system_users
-- ============================================================================

-- Add email verification fields to system_users table
ALTER TABLE public.system_users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.system_users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN public.system_users.email_verification_token IS 'Token used for email verification';
COMMENT ON COLUMN public.system_users.email_verification_expires IS 'Expiration time for email verification token';

-- ============================================================================
-- STEP 4: Create Indexes for Performance
-- ============================================================================

-- Index for quick lookups by verification token
CREATE INDEX IF NOT EXISTS idx_system_users_verif_token
  ON public.system_users (email_verification_token);

-- Index for student_preferences lookups by student_id
CREATE INDEX IF NOT EXISTS idx_student_preferences_student_id
  ON public.student_preferences (student_id);

-- ============================================================================
-- STEP 5: Initialize Preferences for Existing Students
-- ============================================================================

-- Initialize preferences for existing students who don't have an entry yet
INSERT INTO public.student_preferences (student_id)
SELECT id
FROM public.students
WHERE id NOT IN (SELECT student_id FROM public.student_preferences);

-- ============================================================================
-- STEP 6: Grant Permissions
-- ============================================================================

-- Grant necessary permissions to service_role
GRANT ALL ON public.student_preferences TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.student_preferences_id_seq TO service_role;

-- ============================================================================
-- STEP 7: Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Check if student_preferences table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_preferences') THEN
        RAISE NOTICE '✅ student_preferences table created';
    ELSE
        RAISE NOTICE '❌ student_preferences table NOT created';
    END IF;
    
    -- Check if RLS is enabled
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_preferences' AND relnamespace = 'public'::regnamespace) THEN
        RAISE NOTICE '✅ RLS enabled on student_preferences';
    ELSE
        RAISE NOTICE '❌ RLS not enabled on student_preferences';
    END IF;
    
    -- Check if email verification fields were added
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_users' AND column_name = 'email_verified') THEN
        RAISE NOTICE '✅ Email verification fields added to system_users';
    ELSE
        RAISE NOTICE '❌ Email verification fields NOT added to system_users';
    END IF;
    
    -- Count policies
    RAISE NOTICE '';
    RAISE NOTICE 'Policy counts:';
    RAISE NOTICE '  student_preferences: % policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_preferences');
    
    -- Count initialized preferences
    RAISE NOTICE '';
    RAISE NOTICE 'Initialized preferences: % entries', (SELECT COUNT(*) FROM public.student_preferences);
    
    RAISE NOTICE '';
    RAISE NOTICE '=== END VERIFICATION ===';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     ✅ STUDENT PREFERENCES & EMAIL VERIFICATION ADDED        ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  ✓ student_preferences table created                          ║';
    RAISE NOTICE '║  ✓ RLS policies configured for secure access                 ║';
    RAISE NOTICE '║  ✓ Email verification fields added to system_users           ║';
    RAISE NOTICE '║  ✓ Performance indexes created                               ║';
    RAISE NOTICE '║  ✓ Existing students initialized with default preferences    ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  New features:                                                ║';
    RAISE NOTICE '║  - Student UI customization (colors)                         ║';
    RAISE NOTICE '║  - Email verification system ready                            ║';
    RAISE NOTICE '║  - Secure preference management                               ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
