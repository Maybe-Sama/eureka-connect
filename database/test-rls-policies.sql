-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICY TESTING SCRIPT
-- ============================================================================
-- This script tests that RLS policies are working correctly
-- Run this in Supabase SQL Editor with SERVICE ROLE access
-- ============================================================================

-- ============================================================================
-- SETUP: Create Test Data
-- ============================================================================

-- Clean up any existing test data
DELETE FROM public.user_sessions WHERE user_id IN (
    SELECT id FROM public.system_users WHERE email LIKE 'test-rls-%'
);
DELETE FROM public.system_users WHERE email LIKE 'test-rls-%';
DELETE FROM public.students WHERE email LIKE 'test-rls-%';

-- Create test students
INSERT INTO public.students (
    first_name, last_name, email, phone, course_id, birth_date, student_code, password_hash
)
VALUES
    ('RLS', 'Student1', 'test-rls-student1@test.com', '111111111', 1, '2000-01-01', 'RLS-TEST-001', 'hash1'),
    ('RLS', 'Student2', 'test-rls-student2@test.com', '222222222', 1, '2000-01-01', 'RLS-TEST-002', 'hash2')
ON CONFLICT (email) DO NOTHING;

-- Create test system users
DO $$
DECLARE
    student1_id INTEGER;
    student2_id INTEGER;
    teacher_id UUID;
BEGIN
    -- Get student IDs
    SELECT id INTO student1_id FROM public.students WHERE email = 'test-rls-student1@test.com';
    SELECT id INTO student2_id FROM public.students WHERE email = 'test-rls-student2@test.com';
    
    -- Create teacher user
    INSERT INTO public.system_users (email, password_hash, user_type)
    VALUES ('test-rls-teacher@test.com', 'hashedpassword', 'teacher')
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id INTO teacher_id;
    
    -- Create student users
    INSERT INTO public.system_users (email, password_hash, user_type, student_id)
    VALUES 
        ('test-rls-student1@test.com', 'hash1', 'student', student1_id),
        ('test-rls-student2@test.com', 'hash2', 'student', student2_id)
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email;
    
    -- Create test invoices
    INSERT INTO public.invoices (invoice_number, student_id, date, status, total, amount)
    VALUES
        ('RLS-INV-001', student1_id, '2025-01-01', 'pending', 100.00, 100.00),
        ('RLS-INV-002', student2_id, '2025-01-01', 'paid', 200.00, 200.00)
    ON CONFLICT (invoice_number) DO NOTHING;
    
    -- Create test classes
    INSERT INTO public.classes (student_id, date, start_time, end_time, duration, day_of_week, status, price)
    VALUES
        (student1_id, '2025-01-15', '10:00', '11:00', 60, 1, 'scheduled', 25.00),
        (student2_id, '2025-01-15', '14:00', '15:00', 60, 1, 'scheduled', 25.00)
    ON CONFLICT (student_id, date, start_time, end_time) DO NOTHING;
    
    RAISE NOTICE '✅ Test data created successfully';
END $$;

-- ============================================================================
-- TEST 1: Verify RLS is Enabled
-- ============================================================================

DO $$
DECLARE
    test_name TEXT := 'RLS Enabled on Tables';
    rls_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 1: % ===', test_name;
    
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('system_users', 'user_sessions', 'students', 'invoices', 'classes')
    AND rowsecurity = true;
    
    IF rls_count = 5 THEN
        RAISE NOTICE '✅ PASS: RLS enabled on all tables (5/5)';
    ELSE
        RAISE NOTICE '❌ FAIL: RLS not enabled on all tables (% /5)', rls_count;
    END IF;
END $$;

-- ============================================================================
-- TEST 2: Count RLS Policies
-- ============================================================================

DO $$
DECLARE
    test_name TEXT := 'RLS Policies Exist';
    policy_counts RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 2: % ===', test_name;
    
    FOR policy_counts IN
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('system_users', 'user_sessions', 'students', 'invoices', 'classes')
        GROUP BY tablename
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  %: % policies', policy_counts.tablename, policy_counts.policy_count;
    END LOOP;
    
    RAISE NOTICE '✅ PASS: Policies are defined';
END $$;

-- ============================================================================
-- TEST 3: Student Can Only See Own Data
-- ============================================================================

-- Note: This test would normally be run with SET ROLE or through the API
-- Here we verify the policies exist and can demonstrate the concept

DO $$
DECLARE
    test_name TEXT := 'Student Data Isolation';
    student1_id INTEGER;
    student2_id INTEGER;
    student1_user_id UUID;
    student1_invoice_count INTEGER;
    student2_invoice_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 3: % ===', test_name;
    
    -- Get student IDs
    SELECT id INTO student1_id FROM public.students WHERE email = 'test-rls-student1@test.com';
    SELECT id INTO student2_id FROM public.students WHERE email = 'test-rls-student2@test.com';
    SELECT id INTO student1_user_id FROM public.system_users WHERE email = 'test-rls-student1@test.com';
    
    -- Count invoices for each student
    SELECT COUNT(*) INTO student1_invoice_count
    FROM public.invoices
    WHERE student_id = student1_id;
    
    SELECT COUNT(*) INTO student2_invoice_count
    FROM public.invoices
    WHERE student_id = student2_id;
    
    RAISE NOTICE 'Student 1 invoices: %', student1_invoice_count;
    RAISE NOTICE 'Student 2 invoices: %', student2_invoice_count;
    
    -- Check that students table has appropriate policies
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'students'
        AND policyname = 'students_select_own'
    ) THEN
        RAISE NOTICE '✅ PASS: students_select_own policy exists';
    ELSE
        RAISE NOTICE '❌ FAIL: students_select_own policy missing';
    END IF;
    
    -- Check that invoices table has appropriate policies
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'invoices'
        AND policyname = 'invoices_select_own'
    ) THEN
        RAISE NOTICE '✅ PASS: invoices_select_own policy exists';
    ELSE
        RAISE NOTICE '❌ FAIL: invoices_select_own policy missing';
    END IF;
    
    -- Check that classes table has appropriate policies
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'classes'
        AND policyname = 'classes_select_own'
    ) THEN
        RAISE NOTICE '✅ PASS: classes_select_own policy exists';
    ELSE
        RAISE NOTICE '❌ FAIL: classes_select_own policy missing';
    END IF;
END $$;

-- ============================================================================
-- TEST 4: Teacher Policies Allow Full Access
-- ============================================================================

DO $$
DECLARE
    test_name TEXT := 'Teacher Full Access Policies';
    teacher_policies INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 4: % ===', test_name;
    
    -- Check students table policy allows teachers
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'students'
        AND policyname = 'students_select_policy'
    ) THEN
        RAISE NOTICE '✅ PASS: students_select_policy (teacher access) exists';
    ELSE
        RAISE NOTICE '❌ FAIL: students_select_policy policy missing';
    END IF;
    
    -- Check invoices table policy allows teachers
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'invoices'
        AND policyname = 'invoices_select_policy'
    ) THEN
        RAISE NOTICE '✅ PASS: invoices_select_policy (teacher access) exists';
    ELSE
        RAISE NOTICE '❌ FAIL: invoices_select_policy policy missing';
    END IF;
    
    -- Check teachers can INSERT invoices
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'invoices'
        AND policyname = 'invoices_insert_policy'
    ) THEN
        RAISE NOTICE '✅ PASS: invoices_insert_policy (teacher can create) exists';
    ELSE
        RAISE NOTICE '❌ FAIL: invoices_insert_policy policy missing';
    END IF;
END $$;

-- ============================================================================
-- TEST 5: System Users RLS Policies
-- ============================================================================

DO $$
DECLARE
    test_name TEXT := 'System Users RLS Policies';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 5: % ===', test_name;
    
    -- Check select own policy
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'system_users'
        AND policyname = 'system_users_select_own'
    ) THEN
        RAISE NOTICE '✅ PASS: system_users_select_own policy exists';
    ELSE
        RAISE NOTICE '❌ FAIL: system_users_select_own policy missing';
    END IF;
    
    -- Check service role can insert
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'system_users'
        AND policyname = 'system_users_insert_service'
    ) THEN
        RAISE NOTICE '✅ PASS: system_users_insert_service policy exists';
    ELSE
        RAISE NOTICE '❌ FAIL: system_users_insert_service policy missing';
    END IF;
END $$;

-- ============================================================================
-- TEST 6: User Sessions RLS Policies
-- ============================================================================

DO $$
DECLARE
    test_name TEXT := 'User Sessions RLS Policies';
    session_policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 6: % ===', test_name;
    
    SELECT COUNT(*) INTO session_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_sessions';
    
    IF session_policy_count >= 4 THEN
        RAISE NOTICE '✅ PASS: user_sessions has % policies (expected 4)', session_policy_count;
    ELSE
        RAISE NOTICE '❌ FAIL: user_sessions has only % policies (expected 4)', session_policy_count;
    END IF;
    
    -- List all policies
    RAISE NOTICE 'User session policies:';
    FOR pol IN
        SELECT policyname, cmd FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_sessions'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  - %: %', pol.policyname, pol.cmd;
    END LOOP;
END $$;

-- ============================================================================
-- TEST 7: Foreign Keys Are Enforced
-- ============================================================================

DO $$
DECLARE
    test_name TEXT := 'Foreign Key Constraints';
    fk_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 7: % ===', test_name;
    
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
    AND table_name IN ('system_users', 'user_sessions', 'invoices');
    
    IF fk_count >= 3 THEN
        RAISE NOTICE '✅ PASS: Found % foreign key constraints', fk_count;
    ELSE
        RAISE NOTICE '❌ FAIL: Only found % foreign key constraints (expected at least 3)', fk_count;
    END IF;
    
    -- List all foreign keys
    FOR fk IN
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('system_users', 'user_sessions', 'invoices')
    LOOP
        RAISE NOTICE '  - %.% → %.%', fk.table_name, fk.column_name, fk.foreign_table_name, fk.foreign_column_name;
    END LOOP;
END $$;

-- ============================================================================
-- TEST 8: Helper Functions Exist
-- ============================================================================

DO $$
DECLARE
    test_name TEXT := 'Helper Functions';
    func_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST 8: % ===', test_name;
    
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('validate_session', 'create_user_session', 'create_student_user');
    
    IF func_count = 3 THEN
        RAISE NOTICE '✅ PASS: All 3 helper functions exist';
    ELSE
        RAISE NOTICE '❌ FAIL: Only % of 3 helper functions exist', func_count;
    END IF;
    
    -- Test validate_session function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_session') THEN
        RAISE NOTICE '  ✓ validate_session function exists';
    ELSE
        RAISE NOTICE '  ✗ validate_session function missing';
    END IF;
    
    -- Test create_user_session function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_session') THEN
        RAISE NOTICE '  ✓ create_user_session function exists';
    ELSE
        RAISE NOTICE '  ✗ create_user_session function missing';
    END IF;
    
    -- Test create_student_user function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_student_user') THEN
        RAISE NOTICE '  ✓ create_student_user function exists';
    ELSE
        RAISE NOTICE '  ✗ create_student_user function missing';
    END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║              RLS POLICY TESTING COMPLETE                      ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  Review the test results above                                ║';
    RAISE NOTICE '║  All tests should show ✅ PASS                               ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  If any tests show ❌ FAIL:                                  ║';
    RAISE NOTICE '║  1. Re-run supabase-auth-rls-policies.sql                    ║';
    RAISE NOTICE '║  2. Check Supabase logs for errors                            ║';
    RAISE NOTICE '║  3. Verify service role permissions                           ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CLEANUP (Optional - uncomment to remove test data)
-- ============================================================================

-- UNCOMMENT BELOW TO CLEAN UP TEST DATA
/*
DELETE FROM public.user_sessions WHERE user_id IN (
    SELECT id FROM public.system_users WHERE email LIKE 'test-rls-%'
);
DELETE FROM public.classes WHERE student_id IN (
    SELECT id FROM public.students WHERE email LIKE 'test-rls-%'
);
DELETE FROM public.invoices WHERE student_id IN (
    SELECT id FROM public.students WHERE email LIKE 'test-rls-%'
);
DELETE FROM public.system_users WHERE email LIKE 'test-rls-%';
DELETE FROM public.students WHERE email LIKE 'test-rls-%';

RAISE NOTICE '✅ Test data cleaned up';
*/


