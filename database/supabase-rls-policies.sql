-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This script sets up Row Level Security policies for the class tracking system
-- Run this in Supabase SQL Editor after setting up triggers and functions
-- ============================================================================

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- RLS provides security at the database level, ensuring users can only access
-- data they're authorized to see. However, for server-side operations (API routes,
-- Edge Functions, triggers), you'll need to use the service role key which bypasses RLS.
--
-- This script assumes:
-- 1. You have authentication set up in Supabase
-- 2. Users are authenticated via Supabase Auth
-- 3. You want to restrict data access based on user roles
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on All Tables
-- ============================================================================

-- Enable RLS on courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Enable RLS on classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on class_generation_logs table (if it exists)
ALTER TABLE public.class_generation_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create Helper Functions for RLS
-- ============================================================================

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT auth.uid() IS NOT NULL;
$$;

-- Function to check if user is admin (customize based on your auth setup)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    );
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT raw_user_meta_data->>'role'
         FROM auth.users
         WHERE auth.uid() = id),
        'user'
    );
$$;

-- ============================================================================
-- STEP 3: RLS Policies for courses Table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;

-- SELECT: All authenticated users can view courses
CREATE POLICY "courses_select_policy"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Only admins can create courses
CREATE POLICY "courses_insert_policy"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- UPDATE: Only admins can update courses
CREATE POLICY "courses_update_policy"
ON public.courses
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete courses
CREATE POLICY "courses_delete_policy"
ON public.courses
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- STEP 4: RLS Policies for students Table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
DROP POLICY IF EXISTS "students_insert_policy" ON public.students;
DROP POLICY IF EXISTS "students_update_policy" ON public.students;
DROP POLICY IF EXISTS "students_delete_policy" ON public.students;

-- SELECT: All authenticated users can view students
CREATE POLICY "students_select_policy"
ON public.students
FOR SELECT
TO authenticated
USING (true);

-- INSERT: All authenticated users can create students
CREATE POLICY "students_insert_policy"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

-- UPDATE: All authenticated users can update students
CREATE POLICY "students_update_policy"
ON public.students
FOR UPDATE
TO authenticated
USING (public.is_authenticated())
WITH CHECK (public.is_authenticated());

-- DELETE: Only admins can delete students
CREATE POLICY "students_delete_policy"
ON public.students
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- STEP 5: RLS Policies for classes Table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "classes_select_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_insert_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_update_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_delete_policy" ON public.classes;

-- SELECT: All authenticated users can view classes
CREATE POLICY "classes_select_policy"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- INSERT: All authenticated users can create classes
-- This is needed for the class generation functions
CREATE POLICY "classes_insert_policy"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

-- UPDATE: All authenticated users can update classes
CREATE POLICY "classes_update_policy"
ON public.classes
FOR UPDATE
TO authenticated
USING (public.is_authenticated())
WITH CHECK (public.is_authenticated());

-- DELETE: All authenticated users can delete classes
CREATE POLICY "classes_delete_policy"
ON public.classes
FOR DELETE
TO authenticated
USING (public.is_authenticated());

-- ============================================================================
-- STEP 6: RLS Policies for class_generation_logs Table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "class_generation_logs_select_policy" ON public.class_generation_logs;
DROP POLICY IF EXISTS "class_generation_logs_insert_policy" ON public.class_generation_logs;

-- SELECT: Only admins can view logs
CREATE POLICY "class_generation_logs_select_policy"
ON public.class_generation_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

-- INSERT: System can insert logs (this is for triggers)
CREATE POLICY "class_generation_logs_insert_policy"
ON public.class_generation_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- STEP 7: Grant Permissions to Service Role
-- ============================================================================

-- Grant all permissions to service role (for API routes and Edge Functions)
-- The service role bypasses RLS, so it can perform all operations

GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.students TO service_role;
GRANT ALL ON public.classes TO service_role;
GRANT ALL ON public.class_generation_logs TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 8: Grant Permissions to Authenticated Users
-- ============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT, INSERT ON public.class_generation_logs TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 9: Create Policy for Anonymous Access (if needed)
-- ============================================================================

-- If you want to allow anonymous access to certain data (e.g., public course catalog)
-- Uncomment and customize these policies:

-- DROP POLICY IF EXISTS "courses_select_anonymous_policy" ON public.courses;
-- CREATE POLICY "courses_select_anonymous_policy"
-- ON public.courses
-- FOR SELECT
-- TO anon
-- USING (is_active = true);

-- ============================================================================
-- STEP 10: Verification Queries
-- ============================================================================

-- Check RLS is enabled on all tables
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('courses', 'students', 'classes', 'class_generation_logs')
ORDER BY tablename;

-- Check all policies exist
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check grants for authenticated role
SELECT 
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'authenticated'
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- Check grants for service_role
SELECT 
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'service_role'
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- ============================================================================
-- STEP 11: Test RLS Policies (Run as authenticated user)
-- ============================================================================

-- Test SELECT on courses (should work for authenticated users)
-- SELECT * FROM public.courses LIMIT 1;

-- Test INSERT on students (should work for authenticated users)
-- INSERT INTO public.students (first_name, last_name, email, birth_date, phone, course_id)
-- VALUES ('Test', 'Student', 'test@example.com', '2000-01-01', '123456789', 1);

-- Test SELECT on classes (should work for authenticated users)
-- SELECT * FROM public.classes LIMIT 1;

-- ============================================================================
-- IMPORTANT NOTES FOR API ROUTES AND EDGE FUNCTIONS
-- ============================================================================

-- When using Supabase client in your Next.js API routes or Edge Functions:
--
-- 1. For server-side operations (class generation, bulk updates, etc.):
--    Use the SERVICE ROLE key, which bypasses RLS:
--    
--    const supabase = createClient(
--      process.env.NEXT_PUBLIC_SUPABASE_URL,
--      process.env.SUPABASE_SERVICE_ROLE_KEY // This bypasses RLS
--    )
--
-- 2. For user-specific operations (frontend, user actions):
--    Use the ANON key with user authentication:
--    
--    const supabase = createClient(
--      process.env.NEXT_PUBLIC_SUPABASE_URL,
--      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
--    )
--
-- 3. Make sure your .env.local has both keys:
--    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
--    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SUPABASE ROW LEVEL SECURITY (RLS) POLICIES SETUP COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - RLS policies for courses table';
    RAISE NOTICE '  - RLS policies for students table';
    RAISE NOTICE '  - RLS policies for classes table';
    RAISE NOTICE '  - RLS policies for class_generation_logs table';
    RAISE NOTICE '  - Helper functions for role checking';
    RAISE NOTICE '  - Grants for authenticated and service_role';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Configuration:';
    RAISE NOTICE '  - Authenticated users can view all data';
    RAISE NOTICE '  - Authenticated users can create/update students and classes';
    RAISE NOTICE '  - Only admins can delete students or manage courses';
    RAISE NOTICE '  - Service role bypasses RLS for server-side operations';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Ensure your API routes use the SERVICE ROLE key';
    RAISE NOTICE '  2. Test the policies by creating/updating data as authenticated user';
    RAISE NOTICE '  3. Customize policies based on your specific security requirements';
    RAISE NOTICE '  4. Review the verification queries above';
    RAISE NOTICE '============================================================================';
END $$;
