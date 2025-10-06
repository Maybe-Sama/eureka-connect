-- ============================================================================
-- QUICK VERIFICATION QUERIES
-- ============================================================================
-- Use these individual queries in Supabase SQL Editor
-- Run each query separately to avoid syntax errors with automatic limits
-- ============================================================================

-- ============================================================================
-- Query 1: Check All Required Tables Exist
-- ============================================================================

SELECT 
    'Tables Check' as test_name,
    COUNT(*) as found_count,
    4 as expected_count,
    CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('system_users', 'user_sessions', 'students', 'invoices');

-- Expected: status = '✅ PASS', found_count = 4

-- ============================================================================
-- Query 2: Check RLS is Enabled on All Tables
-- ============================================================================

SELECT 
    'RLS Enabled Check' as test_name,
    COUNT(*) as enabled_count,
    5 as expected_count,
    CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('system_users', 'user_sessions', 'students', 'invoices', 'classes')
AND rowsecurity = true;

-- Expected: status = '✅ PASS', enabled_count = 5

-- ============================================================================
-- Query 3: Check Helper Functions Exist
-- ============================================================================

SELECT 
    'Helper Functions Check' as test_name,
    COUNT(*) as found_count,
    3 as expected_count,
    CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('validate_session', 'create_user_session', 'create_student_user');

-- Expected: status = '✅ PASS', found_count = 3

-- ============================================================================
-- Query 4: List All Helper Functions (Detailed)
-- ============================================================================

SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('validate_session', 'create_user_session', 'create_student_user')
ORDER BY p.proname;

-- Should show:
-- validate_session(text)
-- create_user_session(uuid, text, integer)
-- create_student_user(text, text)

-- ============================================================================
-- Query 5: Check Required Columns in students Table
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'students'
AND column_name IN ('student_code', 'password_hash', 'start_date', 'fixed_schedule')
ORDER BY column_name;

-- Should return 4 rows with these columns

-- ============================================================================
-- Query 6: Check Foreign Keys Exist
-- ============================================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('system_users', 'user_sessions', 'invoices');

-- Should show foreign keys for:
-- system_users.student_id → students.id
-- user_sessions.user_id → system_users.id
-- invoices.student_id → students.id

-- ============================================================================
-- Query 7: Count RLS Policies Per Table
-- ============================================================================

SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('system_users', 'user_sessions', 'students', 'invoices', 'classes')
GROUP BY tablename
ORDER BY tablename;

-- Expected minimum policy counts:
-- classes: 1+
-- invoices: 5+
-- students: 2+
-- system_users: 4
-- user_sessions: 4

-- ============================================================================
-- Query 8: Verify student_code Column Has UNIQUE Constraint
-- ============================================================================

SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'students'
AND kcu.column_name = 'student_code'
AND tc.constraint_type = 'UNIQUE';

-- Should return at least 1 row showing UNIQUE constraint

-- ============================================================================
-- Query 9: Check if Any Students Have student_code Set
-- ============================================================================

SELECT 
    COUNT(*) as students_with_code,
    COUNT(CASE WHEN student_code IS NOT NULL THEN 1 END) as codes_set
FROM public.students;

-- codes_set should be > 0 for testing

-- ============================================================================
-- Query 10: Combined Verification Summary
-- ============================================================================

SELECT 
    'Setup Verification' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name IN ('system_users', 'user_sessions', 'students', 'invoices')) = 4
        AND (SELECT COUNT(*) FROM pg_tables 
             WHERE schemaname = 'public'
             AND tablename IN ('system_users', 'user_sessions', 'students', 'invoices', 'classes')
             AND rowsecurity = true) = 5
        AND (SELECT COUNT(*) FROM pg_proc p
             JOIN pg_namespace n ON p.pronamespace = n.oid
             WHERE n.nspname = 'public'
             AND p.proname IN ('validate_session', 'create_user_session', 'create_student_user')) = 3
        THEN '✅ ALL CHECKS PASS - Ready for Testing'
        ELSE '❌ SOME CHECKS FAILED - Review individual queries above'
    END as status;

-- This is the final verification - should show ✅ ALL CHECKS PASS

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
-- 
-- In Supabase SQL Editor:
-- 1. Copy ONE query at a time (from one -- ==== section to the next)
-- 2. Paste into SQL Editor
-- 3. Click "Run" (or press Ctrl+Enter)
-- 4. Review the results
-- 5. Move to the next query
--
-- If you see "limit 100" error:
-- - Click the "Limit" dropdown above the editor
-- - Select "No limit"
-- - Re-run the query
--
-- ============================================================================


