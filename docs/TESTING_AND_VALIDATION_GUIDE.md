# Testing and Validation Guide

This document provides comprehensive test cases to validate the authentication system, role-based routing, student dashboard, and Row Level Security policies.

## 📋 Pre-Testing Checklist

Before running tests, ensure:

- [ ] ✅ Supabase project is set up
- [ ] ✅ `supabase-auth-schema.sql` has been executed
- [ ] ✅ `supabase-auth-rls-policies.sql` has been executed
- [ ] ✅ `.env.local` contains correct Supabase credentials
- [ ] ✅ Development server is running (`pnpm dev`)
- [ ] ✅ At least one student exists in the database with a unique `student_code`

---

## Test Suite 1: Route Protection

### Test 1.1: Dashboard Protection (Unauthenticated)

**Objective**: Verify `/dashboard` is inaccessible without login

**Steps**:
1. Open browser in incognito/private mode
2. Clear all cookies and localStorage
3. Navigate to `http://localhost:3000/dashboard`

**Expected Result**:
- ✅ LoginForm appears automatically
- ✅ User is NOT shown the teacher dashboard
- ✅ URL remains at `/dashboard` but content is login form

**Verification**:
```javascript
// Check in browser console
console.log(localStorage.getItem('session_token')); // Should be null
console.log(document.cookie); // Should not contain user_type
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 1.2: Student Dashboard Protection (Unauthenticated)

**Objective**: Verify `/student-dashboard` routes are inaccessible without login

**Steps**:
1. In incognito mode with no session
2. Try accessing:
   - `http://localhost:3000/student-dashboard`
   - `http://localhost:3000/student-dashboard/profile`
   - `http://localhost:3000/student-dashboard/calendar`
   - `http://localhost:3000/student-dashboard/invoices`

**Expected Result**:
- ✅ LoginForm appears for all routes
- ✅ No student data is displayed
- ✅ No flash of protected content

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

## Test Suite 2: Student Registration

### Test 2.1: Code Verification - Invalid Code

**Objective**: Verify registration rejects invalid student codes

**Pre-requisite**: Know a student code that does NOT exist (e.g., "INVALID123")

**Steps**:
1. Navigate to registration page
2. Enter invalid code: `INVALID123`
3. Click "Verificar Código"

**Expected Result**:
- ✅ Error message: "Código inválido"
- ✅ Does NOT proceed to password step
- ✅ No user created in system_users

**Verification Query**:
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM public.students WHERE student_code = 'INVALID123';
-- Should return: 0
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 2.2: Code Verification - Valid Code

**Objective**: Verify registration accepts valid, unused student codes

**Pre-requisite**: Have a valid student_code from the database

**Get a valid code**:
```sql
-- Run in Supabase SQL Editor
SELECT id, student_code, first_name, last_name, email
FROM public.students
WHERE student_code IS NOT NULL
AND id NOT IN (SELECT student_id FROM public.system_users WHERE student_id IS NOT NULL)
LIMIT 1;
```

**Steps**:
1. Navigate to `/register`
2. Enter the valid student code
3. Click "Verificar Código"

**Expected Result**:
- ✅ Success message: "Código verificado correctamente"
- ✅ Proceeds to password setup step (Step 2)
- ✅ Shows welcome message with student name
- ✅ Shows password and confirm password fields

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 2.3: Code Verification - Already Registered

**Objective**: Verify registration prevents duplicate registration

**Pre-requisite**: Have a student_code that's already in system_users

**Get an already-registered code**:
```sql
-- Run in Supabase SQL Editor
SELECT s.student_code, s.first_name, s.last_name
FROM public.students s
INNER JOIN public.system_users su ON s.id = su.student_id
WHERE s.student_code IS NOT NULL
LIMIT 1;
```

**Steps**:
1. Navigate to `/register`
2. Enter the already-registered student code
3. Click "Verificar Código"

**Expected Result**:
- ✅ Error message: "Este código ya ha sido registrado"
- ✅ Does NOT proceed to password step
- ✅ User directed to login instead

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 2.4: Password Validation - Mismatch

**Objective**: Verify password confirmation validation

**Pre-requisite**: Valid student code verified (Step 2 reached)

**Steps**:
1. Complete code verification with valid code
2. Enter password: `password123`
3. Enter confirm password: `password456` (different)
4. Click "Completar Registro"

**Expected Result**:
- ✅ Error message: "Las contraseñas no coinciden"
- ✅ Registration does NOT complete
- ✅ User remains on password step

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 2.5: Password Validation - Too Short

**Objective**: Verify minimum password length requirement

**Steps**:
1. Complete code verification with valid code
2. Enter password: `pass` (less than 6 characters)
3. Enter confirm password: `pass`
4. Click "Completar Registro"

**Expected Result**:
- ✅ Error message: "La contraseña debe tener al menos 6 caracteres"
- ✅ Registration does NOT complete

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 2.6: Successful Registration

**Objective**: Verify complete registration flow creates user correctly

**Pre-requisite**: Valid, unused student code

**Steps**:
1. Navigate to `/register`
2. Enter valid student code
3. Click "Verificar Código"
4. Enter password: `testpassword123`
5. Enter confirm password: `testpassword123`
6. Click "Completar Registro"

**Expected Result**:
- ✅ Success message: "¡Registro Exitoso!"
- ✅ Automatic redirect to `/login` after 2 seconds
- ✅ User created in `system_users` table
- ✅ `password_hash` updated in `students` table

**Verification Queries**:
```sql
-- Verify user was created
SELECT su.id, su.email, su.user_type, su.student_id, s.first_name, s.last_name
FROM public.system_users su
JOIN public.students s ON su.student_id = s.id
WHERE s.student_code = 'YOUR_TEST_CODE';
-- Should return 1 row

-- Verify password_hash was set
SELECT id, student_code, password_hash IS NOT NULL as has_password
FROM public.students
WHERE student_code = 'YOUR_TEST_CODE';
-- has_password should be true
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

## Test Suite 3: Student Login and Dashboard Access

### Test 3.1: Student Login

**Objective**: Verify student can log in with registered credentials

**Pre-requisite**: Student registered in Test 2.6

**Steps**:
1. Navigate to `/login`
2. Switch to "Estudiante" tab
3. Enter student code: `YOUR_TEST_CODE`
4. Enter password: `testpassword123`
5. Click "Iniciar Sesión"

**Expected Result**:
- ✅ Login successful
- ✅ Redirect to `/student-dashboard/profile`
- ✅ Session token stored in localStorage
- ✅ `user_type` cookie set to 'student'

**Verification**:
```javascript
// Check in browser console
console.log(localStorage.getItem('session_token')); // Should have value
console.log(document.cookie.includes('user_type=student')); // Should be true
```

**Verification Query**:
```sql
-- Verify session was created
SELECT us.id, us.session_token, us.expires_at, su.email, su.user_type
FROM public.user_sessions us
JOIN public.system_users su ON us.user_id = su.id
WHERE su.user_type = 'student'
ORDER BY us.created_at DESC
LIMIT 1;
-- Should show recent session
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 3.2: Student Profile Page

**Objective**: Verify student sees correct personal information

**Pre-requisite**: Student logged in from Test 3.1

**Steps**:
1. Already on `/student-dashboard/profile` (after login)
2. Review displayed information

**Expected Result**:
- ✅ Student name displayed correctly
- ✅ Email shown
- ✅ Phone number shown
- ✅ Student code shown
- ✅ All profile sections populated with correct data
- ✅ No other students' data visible

**Data to Verify**:
- [ ] Personal Information section complete
- [ ] Identification section (if DNI/NIF exist)
- [ ] Address section (if address exists)
- [ ] "Actualizar información" help message shown
- [ ] All data matches database record

**Verification Query**:
```sql
-- Compare displayed data with database
SELECT 
    id,
    first_name,
    last_name,
    email,
    phone,
    student_code,
    dni,
    nif,
    address,
    city,
    province
FROM public.students
WHERE student_code = 'YOUR_TEST_CODE';
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 3.3: Student Calendar Page

**Objective**: Verify student sees their own schedule and classes

**Pre-requisite**: Student logged in and has classes in database

**Steps**:
1. Navigate to `/student-dashboard/calendar`
2. Review calendar and class list

**Expected Result**:
- ✅ Calendar displays current month
- ✅ Student's classes shown on appropriate dates
- ✅ Fixed schedule displayed in sidebar (if exists)
- ✅ Upcoming classes list shows student's classes
- ✅ No other students' classes visible
- ✅ Class status indicators (completed, cancelled, scheduled)

**Data to Verify**:
- [ ] Month navigation works
- [ ] Classes appear on correct dates
- [ ] Fixed schedule matches database
- [ ] Class times and durations correct
- [ ] Status colors appropriate

**Verification Query**:
```sql
-- Get student's classes for comparison
SELECT 
    c.id,
    c.date,
    c.start_time,
    c.end_time,
    c.duration,
    c.status,
    s.first_name,
    s.last_name
FROM public.classes c
JOIN public.students s ON c.student_id = s.id
WHERE s.student_code = 'YOUR_TEST_CODE'
ORDER BY c.date DESC, c.start_time
LIMIT 20;

-- Get fixed schedule
SELECT fixed_schedule
FROM public.students
WHERE student_code = 'YOUR_TEST_CODE';
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 3.4: Student Invoices Page

**Objective**: Verify student sees their own invoices only

**Pre-requisite**: Student logged in and has invoices in database

**Create test invoice** (if needed):
```sql
-- Create a test invoice for the student
INSERT INTO public.invoices (
    invoice_number,
    student_id,
    date,
    status,
    amount,
    total,
    description
)
SELECT
    'INV-TEST-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    id,
    TO_CHAR(NOW(), 'YYYY-MM-DD'),
    'pending',
    100.00,
    100.00,
    'Test invoice for validation'
FROM public.students
WHERE student_code = 'YOUR_TEST_CODE';
```

**Steps**:
1. Navigate to `/student-dashboard/invoices`
2. Review invoice list and stats

**Expected Result**:
- ✅ Stats cards show correct totals
- ✅ Invoice table shows student's invoices
- ✅ No other students' invoices visible
- ✅ Filter buttons work (All, Paid, Pending)
- ✅ Invoice details correct (number, date, amount, status)
- ✅ Status badges color-coded correctly

**Data to Verify**:
- [ ] Total invoices count matches
- [ ] Paid amount calculated correctly
- [ ] Pending amount calculated correctly
- [ ] Invoice list complete
- [ ] Dates formatted properly
- [ ] Status indicators correct

**Verification Query**:
```sql
-- Get student's invoices for comparison
SELECT 
    i.invoice_number,
    i.date,
    i.status,
    i.total,
    s.first_name,
    s.last_name
FROM public.invoices i
JOIN public.students s ON i.student_id = s.id
WHERE s.student_code = 'YOUR_TEST_CODE'
ORDER BY i.date DESC;

-- Verify totals
SELECT 
    COUNT(*) as total_invoices,
    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_total,
    SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END) as pending_total
FROM public.invoices i
JOIN public.students s ON i.student_id = s.id
WHERE s.student_code = 'YOUR_TEST_CODE';
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

## Test Suite 4: Role-Based Route Protection

### Test 4.1: Student Cannot Access Teacher Routes

**Objective**: Verify student is redirected from teacher routes

**Pre-requisite**: Student logged in

**Steps**:
1. While logged in as student
2. Attempt to navigate to teacher routes:
   - `/dashboard`
   - `/students`
   - `/courses`
   - `/calendar`
   - `/invoices`

**Expected Result**:
- ✅ Automatic redirect to `/student-dashboard/profile`
- ✅ No teacher dashboard content visible
- ✅ Redirect happens quickly (no flash)
- ✅ Console shows redirect log message

**Verification**:
```javascript
// Check in browser console
console.log(document.cookie.includes('user_type=student')); // Should be true
// Should see: "Estudiante intentando acceder a ruta de profesor, redirigiendo..."
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

### Test 4.2: Teacher Cannot Access Student Routes

**Objective**: Verify teacher is redirected from student routes

**Pre-requisite**: Teacher logged in

**Steps**:
1. Log in as teacher
2. Attempt to navigate to student routes:
   - `/student-dashboard`
   - `/student-dashboard/profile`
   - `/student-dashboard/calendar`
   - `/student-dashboard/invoices`

**Expected Result**:
- ✅ Automatic redirect to `/dashboard`
- ✅ No student dashboard content visible
- ✅ Console shows redirect log message

**Verification**:
```javascript
// Check in browser console
console.log(document.cookie.includes('user_type=teacher')); // Should be true
// Should see: "Profesor intentando acceder a ruta de estudiante, redirigiendo..."
```

**Status**: [ ] Pass [ ] Fail

**Notes**: _______________________________

---

## Test Suite 5: Row Level Security (RLS) Validation

### Test 5.1: Student Can Only Query Own Data

**Objective**: Verify RLS prevents students from accessing other students' data

**Pre-requisite**: 
- At least 2 students with different student_ids exist
- Test student logged in

**Test Method**: Use Supabase client with student session

**Setup Test Environment**:
```javascript
// In browser console after student login
const token = localStorage.getItem('session_token');
console.log('Testing with session token:', token);

// Create Supabase client with student session
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

// Note: In production, sessions would be validated via JWT
// For testing, we verify through SQL queries
```

**Test 5.1.1: Students Table Access**

```sql
-- This query would be executed by the student's session
-- In Supabase, impersonate the student user or test via API

-- Get current student's ID from their session
-- Then try to query all students

SELECT id, first_name, last_name, email
FROM public.students;

-- Expected: Should only return the logged-in student's record
-- Actual rows returned: _______
```

**Expected Result**:
- ✅ Returns ONLY the logged-in student's row
- ✅ Does NOT return other students' data
- ✅ No error (policy allows own data)

**Status**: [ ] Pass [ ] Fail

---

**Test 5.1.2: Invoices Table Access**

```sql
-- Attempt to query all invoices
SELECT invoice_number, student_id, total, status
FROM public.invoices;

-- Expected: Should only return invoices for the logged-in student
-- Actual rows returned: _______
```

**Expected Result**:
- ✅ Returns ONLY the logged-in student's invoices
- ✅ Does NOT return other students' invoices
- ✅ No error (policy allows own data)

**Verification Query** (as service_role):
```sql
-- Verify student ID
SELECT su.id, su.student_id, s.first_name, s.last_name
FROM public.system_users su
JOIN public.students s ON su.student_id = s.id
WHERE su.user_type = 'student'
AND su.email = 'STUDENT_EMAIL';

-- Count total invoices vs student's invoices
SELECT 
    (SELECT COUNT(*) FROM public.invoices) as total_invoices,
    (SELECT COUNT(*) FROM public.invoices WHERE student_id = YOUR_STUDENT_ID) as student_invoices;
```

**Status**: [ ] Pass [ ] Fail

---

**Test 5.1.3: Classes Table Access**

```sql
-- Attempt to query all classes
SELECT id, student_id, date, start_time, end_time
FROM public.classes
ORDER BY date DESC
LIMIT 20;

-- Expected: Should only return classes for the logged-in student
```

**Expected Result**:
- ✅ Returns ONLY the logged-in student's classes
- ✅ Does NOT return other students' classes

**Status**: [ ] Pass [ ] Fail

---

### Test 5.2: Student Cannot Modify Data

**Objective**: Verify students cannot INSERT, UPDATE, or DELETE

**Test 5.2.1: Cannot Insert Invoice**

```sql
-- Attempt to insert an invoice
INSERT INTO public.invoices (invoice_number, student_id, date, status, total)
VALUES ('TEST-INV-001', YOUR_STUDENT_ID, '2025-01-01', 'pending', 100.00);

-- Expected: Should FAIL with permission error
```

**Expected Result**:
- ✅ Insert FAILS
- ✅ Error message about policy violation
- ✅ No row inserted

**Status**: [ ] Pass [ ] Fail

---

**Test 5.2.2: Cannot Update Student Record**

```sql
-- Attempt to update student record
UPDATE public.students
SET phone = '999999999'
WHERE id = YOUR_STUDENT_ID;

-- Expected: Should FAIL with permission error
```

**Expected Result**:
- ✅ Update FAILS
- ✅ Error about insufficient permissions
- ✅ Data not modified

**Status**: [ ] Pass [ ] Fail

---

**Test 5.2.3: Cannot Delete Invoice**

```sql
-- Attempt to delete an invoice
DELETE FROM public.invoices
WHERE student_id = YOUR_STUDENT_ID;

-- Expected: Should FAIL with permission error
```

**Expected Result**:
- ✅ Delete FAILS
- ✅ Permission denied error
- ✅ No rows deleted

**Status**: [ ] Pass [ ] Fail

---

### Test 5.3: Teacher Has Full Access

**Objective**: Verify teachers can access all student data

**Pre-requisite**: Teacher logged in

**Test 5.3.1: Can Query All Students**

```sql
-- As teacher, query all students
SELECT COUNT(*) as total_students
FROM public.students;

-- Expected: Should return ALL students (not just one)
```

**Expected Result**:
- ✅ Returns all students in database
- ✅ No filtering by RLS
- ✅ Full access granted

**Status**: [ ] Pass [ ] Fail

---

**Test 5.3.2: Can Create/Update/Delete**

```sql
-- Test INSERT (create test student)
INSERT INTO public.students (
    first_name, last_name, email, phone, course_id, birth_date
)
VALUES (
    'Test', 'Teacher-Insert', 'test-teacher@test.com', '123456789', 1, '2000-01-01'
);

-- Expected: SUCCESS

-- Test UPDATE
UPDATE public.students
SET phone = '987654321'
WHERE email = 'test-teacher@test.com';

-- Expected: SUCCESS

-- Test DELETE
DELETE FROM public.students
WHERE email = 'test-teacher@test.com';

-- Expected: SUCCESS
```

**Expected Result**:
- ✅ All operations succeed
- ✅ No permission errors
- ✅ Teacher has full CRUD access

**Status**: [ ] Pass [ ] Fail

---

## Test Suite 6: Session Management

### Test 6.1: Session Expiry

**Objective**: Verify sessions expire after 24 hours

**Note**: This test requires waiting or manually updating the database

**Manual Test** (Update expiry for immediate testing):
```sql
-- Set session to expired
UPDATE public.user_sessions
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE session_token = 'YOUR_TEST_SESSION_TOKEN';
```

**Steps**:
1. After expiring session, refresh any page
2. Try to navigate to protected route

**Expected Result**:
- ✅ User is logged out
- ✅ Redirected to login page
- ✅ Session token cleared from localStorage
- ✅ Cookie cleared

**Status**: [ ] Pass [ ] Fail

---

### Test 6.2: Logout Clears Session

**Objective**: Verify logout properly cleans up

**Steps**:
1. Log in as student
2. Note session_token from localStorage
3. Click "Cerrar Sesión" button

**Expected Result**:
- ✅ Redirected to `/login`
- ✅ Session token removed from localStorage
- ✅ Cookie cleared
- ✅ Session deleted from database

**Verification Query**:
```sql
-- Check session was deleted
SELECT COUNT(*)
FROM public.user_sessions
WHERE session_token = 'YOUR_OLD_SESSION_TOKEN';

-- Should return: 0
```

**Status**: [ ] Pass [ ] Fail

---

## Test Summary

### Overall Results

**Test Suite 1: Route Protection**
- Test 1.1: [ ] Pass [ ] Fail
- Test 1.2: [ ] Pass [ ] Fail

**Test Suite 2: Student Registration**
- Test 2.1: [ ] Pass [ ] Fail
- Test 2.2: [ ] Pass [ ] Fail
- Test 2.3: [ ] Pass [ ] Fail
- Test 2.4: [ ] Pass [ ] Fail
- Test 2.5: [ ] Pass [ ] Fail
- Test 2.6: [ ] Pass [ ] Fail

**Test Suite 3: Student Dashboard**
- Test 3.1: [ ] Pass [ ] Fail
- Test 3.2: [ ] Pass [ ] Fail
- Test 3.3: [ ] Pass [ ] Fail
- Test 3.4: [ ] Pass [ ] Fail

**Test Suite 4: Route Protection**
- Test 4.1: [ ] Pass [ ] Fail
- Test 4.2: [ ] Pass [ ] Fail

**Test Suite 5: RLS Validation**
- Test 5.1.1: [ ] Pass [ ] Fail
- Test 5.1.2: [ ] Pass [ ] Fail
- Test 5.1.3: [ ] Pass [ ] Fail
- Test 5.2.1: [ ] Pass [ ] Fail
- Test 5.2.2: [ ] Pass [ ] Fail
- Test 5.2.3: [ ] Pass [ ] Fail
- Test 5.3.1: [ ] Pass [ ] Fail
- Test 5.3.2: [ ] Pass [ ] Fail

**Test Suite 6: Session Management**
- Test 6.1: [ ] Pass [ ] Fail
- Test 6.2: [ ] Pass [ ] Fail

### Total: _____ / 24 tests passed

---

## Issues Found

| Test # | Issue Description | Severity | Status |
|--------|------------------|----------|--------|
|        |                  |          |        |

---

## Recommendations

Based on test results, consider:

1. **If RLS tests fail**: Review and reapply `supabase-auth-rls-policies.sql`
2. **If route protection fails**: Check AuthContext and middleware implementation
3. **If registration fails**: Verify `create_student_user` function exists
4. **If login fails**: Check `validate_session` function and session token generation

---

**Test Date**: _______________
**Tested By**: _______________
**Environment**: [ ] Development [ ] Staging [ ] Production
**Status**: [ ] All Pass [ ] Some Failures [ ] Major Issues

---

## Quick Verification Script

Run this script to quickly verify core functionality:

```sql
-- ============================================================================
-- QUICK VERIFICATION SCRIPT
-- ============================================================================

-- 1. Check all tables exist
SELECT 'Tables Check' as test, 
    CASE WHEN COUNT(*) = 4 THEN 'PASS ✅' ELSE 'FAIL ❌' END as result
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('system_users', 'user_sessions', 'students', 'invoices');

-- 2. Check RLS is enabled
SELECT 'RLS Enabled' as test,
    CASE WHEN COUNT(*) = 4 THEN 'PASS ✅' ELSE 'FAIL ❌' END as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('system_users', 'user_sessions', 'students', 'invoices')
AND rowsecurity = true;

-- 3. Check helper functions exist
SELECT 'Helper Functions' as test,
    CASE WHEN COUNT(*) = 3 THEN 'PASS ✅' ELSE 'FAIL ❌' END as result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('validate_session', 'create_user_session', 'create_student_user');

-- 4. Check students have student_code
SELECT 'Student Code Column' as test,
    CASE WHEN COUNT(*) = 1 THEN 'PASS ✅' ELSE 'FAIL ❌' END as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'students'
AND column_name = 'student_code';

-- 5. Check invoices have student_id FK
SELECT 'Invoice Foreign Key' as test,
    CASE WHEN COUNT(*) >= 1 THEN 'PASS ✅' ELSE 'FAIL ❌' END as result
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name = 'invoices';

```

**Run this query and all tests should show PASS ✅**



