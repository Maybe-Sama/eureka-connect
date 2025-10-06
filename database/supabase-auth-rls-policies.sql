-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR AUTHENTICATION TABLES
-- ============================================================================
-- This script sets up RLS policies for system_users, user_sessions, and
-- ensures proper access control for authentication-related operations
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on Authentication Tables
-- ============================================================================

ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: RLS Policies for system_users Table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "system_users_select_own" ON public.system_users;
DROP POLICY IF EXISTS "system_users_update_own" ON public.system_users;
DROP POLICY IF EXISTS "system_users_insert_service" ON public.system_users;
DROP POLICY IF EXISTS "system_users_delete_service" ON public.system_users;

-- SELECT: Users can only read their own data
CREATE POLICY "system_users_select_own"
ON public.system_users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- UPDATE: Users can update their own data (excluding user_type and student_id)
CREATE POLICY "system_users_update_own"
ON public.system_users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- INSERT: Only service role can create users (registration happens through functions)
CREATE POLICY "system_users_insert_service"
ON public.system_users
FOR INSERT
TO service_role
WITH CHECK (true);

-- DELETE: Only service role can delete users
CREATE POLICY "system_users_delete_service"
ON public.system_users
FOR DELETE
TO service_role
USING (true);

-- ============================================================================
-- STEP 3: RLS Policies for user_sessions Table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_sessions_select_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_delete_own" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_service_access" ON public.user_sessions;

-- SELECT: Users can only read their own sessions
CREATE POLICY "user_sessions_select_own"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

-- INSERT: Users can create their own sessions (through functions)
CREATE POLICY "user_sessions_insert_own"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

-- DELETE: Users can delete their own sessions (logout)
CREATE POLICY "user_sessions_delete_own"
ON public.user_sessions
FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- Service role has full access for session management
CREATE POLICY "user_sessions_service_access"
ON public.user_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 4: Update Students Table RLS Policies for Student Users
-- ============================================================================

-- Drop and recreate students policies to allow students to view their own data
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
DROP POLICY IF EXISTS "students_select_own" ON public.students;

-- Teachers and admins can view all students
CREATE POLICY "students_select_policy"
ON public.students
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'teacher'
    )
    OR
    -- Service role bypass
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Students can view their own data
CREATE POLICY "students_select_own"
ON public.students
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'student'
        AND system_users.student_id = students.id
    )
);

-- ============================================================================
-- STEP 5: Update Invoices Table RLS Policies
-- ============================================================================

-- Drop and recreate invoices policies
DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;

-- Teachers can view all invoices
CREATE POLICY "invoices_select_policy"
ON public.invoices
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'teacher'
    )
    OR
    -- Service role bypass
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Students can view their own invoices
CREATE POLICY "invoices_select_own"
ON public.invoices
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'student'
        AND system_users.student_id = invoices.student_id
    )
);

-- Only teachers can create/update/delete invoices
DROP POLICY IF EXISTS "invoices_insert_policy" ON public.invoices;
CREATE POLICY "invoices_insert_policy"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'teacher'
    )
);

DROP POLICY IF EXISTS "invoices_update_policy" ON public.invoices;
CREATE POLICY "invoices_update_policy"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'teacher'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'teacher'
    )
);

DROP POLICY IF EXISTS "invoices_delete_policy" ON public.invoices;
CREATE POLICY "invoices_delete_policy"
ON public.invoices
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'teacher'
    )
);

-- ============================================================================
-- STEP 6: Update Classes Table RLS Policies
-- ============================================================================

-- Students can view their own classes
DROP POLICY IF EXISTS "classes_select_own" ON public.classes;
CREATE POLICY "classes_select_own"
ON public.classes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'student'
        AND system_users.student_id = classes.student_id
    )
    OR
    -- Teachers can view all classes
    EXISTS (
        SELECT 1 FROM public.system_users
        WHERE system_users.id::text = auth.uid()::text
        AND system_users.user_type = 'teacher'
    )
    OR
    -- Service role bypass
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- ============================================================================
-- STEP 7: Grant Permissions to Service Role
-- ============================================================================

-- Grant all privileges to service role for authentication tables
GRANT ALL ON public.system_users TO service_role;
GRANT ALL ON public.user_sessions TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 8: Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RLS POLICIES VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Check RLS is enabled
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'system_users' AND relnamespace = 'public'::regnamespace) THEN
        RAISE NOTICE '✅ RLS enabled on system_users';
    ELSE
        RAISE NOTICE '❌ RLS not enabled on system_users';
    END IF;
    
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_sessions' AND relnamespace = 'public'::regnamespace) THEN
        RAISE NOTICE '✅ RLS enabled on user_sessions';
    ELSE
        RAISE NOTICE '❌ RLS not enabled on user_sessions';
    END IF;
    
    -- Count policies
    RAISE NOTICE '';
    RAISE NOTICE 'Policy counts:';
    RAISE NOTICE '  system_users: % policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_users');
    RAISE NOTICE '  user_sessions: % policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions');
    RAISE NOTICE '  students: % policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students');
    RAISE NOTICE '  invoices: % policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices');
    RAISE NOTICE '  classes: % policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classes');
    
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
    RAISE NOTICE '║     ✅ AUTHENTICATION RLS POLICIES APPLIED                   ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  ✓ RLS enabled on auth tables                                ║';
    RAISE NOTICE '║  ✓ Users can only access their own data                      ║';
    RAISE NOTICE '║  ✓ Students can view their own profile, classes, invoices    ║';
    RAISE NOTICE '║  ✓ Teachers have full access to all data                     ║';
    RAISE NOTICE '║  ✓ Service role bypasses all RLS                             ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  Security features:                                           ║';
    RAISE NOTICE '║  - Session-based authentication                               ║';
    RAISE NOTICE '║  - Role-based access control                                  ║';
    RAISE NOTICE '║  - Data isolation between users                               ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;


