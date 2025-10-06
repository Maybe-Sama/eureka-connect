# Step 7/7: Testing and Validation - Complete Guide

## 📋 Overview

This document provides a complete guide for testing and validating all aspects of the authentication system, role-based routing, student dashboard, and Row Level Security policies.

---

## ✅ What to Test

### 1. Route Protection
- `/dashboard` and teacher routes inaccessible without login
- `/student-dashboard` routes inaccessible without login
- Automatic LoginForm display for unauthenticated users

### 2. Student Registration
- Code verification (valid/invalid/already used)
- Password validation (length, matching)
- User creation in `system_users`
- Successful login after registration

### 3. Student Dashboard
- Profile page shows correct student data
- Calendar shows only student's classes and schedule
- Invoices page shows only student's invoices
- All data isolated per student

### 4. Role-Based Routing
- Students cannot access teacher routes (auto-redirect)
- Teachers cannot access student routes (auto-redirect)
- Appropriate dashboard for each role

### 5. Row Level Security (RLS)
- Students can only read their own data
- Students cannot modify any data
- Teachers have full access to all data
- Proper policy enforcement

---

## 🚀 Quick Start Testing

### Pre-requisites Checklist

Before starting tests, ensure:

```sql
-- Run in Supabase SQL Editor to verify setup
SELECT 'Setup Verification' as check_name, 
    CASE WHEN (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('system_users', 'user_sessions', 'students', 'invoices')
    ) = 4 THEN '✅ PASS' ELSE '❌ FAIL - Run migrations' END as status;
```

**Required:**
- [ ] Database migrations executed (`supabase-auth-schema.sql`)
- [ ] RLS policies applied (`supabase-auth-rls-policies.sql`)
- [ ] `.env.local` configured with Supabase credentials
- [ ] Development server running (`pnpm dev`)
- [ ] At least one student with `student_code` in database

---

## 📝 Test Execution Procedure

### Phase 1: Automated Schema Tests

**Run RLS Policy Tests**:
```sql
-- Copy and run: database/test-rls-policies.sql in Supabase SQL Editor
-- This will:
-- ✓ Verify RLS is enabled on all tables
-- ✓ Count policies on each table
-- ✓ Check helper functions exist
-- ✓ Verify foreign keys are enforced
-- ✓ Create test data for validation
```

**Expected Output**:
```
✅ PASS: RLS enabled on all tables (5/5)
✅ PASS: Policies are defined
✅ PASS: students_select_own policy exists
✅ PASS: invoices_select_own policy exists
✅ PASS: classes_select_own policy exists
✅ PASS: All 3 helper functions exist
```

**If any tests fail**:
1. Re-run `database/supabase-auth-rls-policies.sql`
2. Check Supabase logs for errors
3. Verify service role key is configured

---

### Phase 2: Manual UI Tests

Follow the detailed test cases in `docs/TESTING_AND_VALIDATION_GUIDE.md`

**Priority Tests** (Run these first):

#### Test 1: Route Protection ⭐ CRITICAL
```
1. Open incognito browser
2. Navigate to http://localhost:3000/dashboard
3. Verify: LoginForm appears (not dashboard)
4. Navigate to http://localhost:3000/student-dashboard/profile
5. Verify: LoginForm appears (not student dashboard)

✅ PASS: Protected routes show LoginForm
❌ FAIL: Dashboard/student content visible without login
```

#### Test 2: Student Registration ⭐ CRITICAL
```
1. Get valid student_code from database:
   SELECT student_code FROM students 
   WHERE student_code IS NOT NULL 
   AND id NOT IN (SELECT student_id FROM system_users WHERE student_id IS NOT NULL)
   LIMIT 1;

2. Navigate to http://localhost:3000/register
3. Enter the student code
4. Click "Verificar Código"
5. Verify: Shows "Código verificado correctamente"
6. Enter password: testpass123
7. Confirm password: testpass123
8. Click "Completar Registro"
9. Verify: Shows "¡Registro Exitoso!"
10. Verify: Redirects to /login

✅ PASS: Registration complete, user created
❌ FAIL: Error during registration
```

**Verify in Database**:
```sql
SELECT su.id, su.email, su.user_type, su.student_id, s.first_name, s.last_name
FROM system_users su
JOIN students s ON su.student_id = s.id
WHERE s.student_code = 'YOUR_TEST_CODE';
-- Should return 1 row
```

#### Test 3: Student Login ⭐ CRITICAL
```
1. Navigate to http://localhost:3000/login
2. Click "Estudiante" tab
3. Enter student code from Test 2
4. Enter password: testpass123
5. Click "Iniciar Sesión"
6. Verify: Redirects to /student-dashboard/profile
7. Verify: Student name appears in sidebar
8. Verify: Session token in localStorage

✅ PASS: Login successful, dashboard loads
❌ FAIL: Login error or redirect failed
```

#### Test 4: Student Profile Data ⭐ CRITICAL
```
1. While logged in as student
2. Observe /student-dashboard/profile page
3. Verify: Student name matches database
4. Verify: Email, phone, student code displayed
5. Verify: Only THIS student's data visible

✅ PASS: Profile shows correct, isolated data
❌ FAIL: Wrong data or other students visible
```

#### Test 5: Student Calendar ⭐ CRITICAL
```
1. Navigate to /student-dashboard/calendar
2. Verify: Calendar displays current month
3. Verify: Student's classes appear on dates
4. Verify: Fixed schedule shown in sidebar
5. Verify: Only THIS student's classes visible

✅ PASS: Calendar shows correct, isolated data
❌ FAIL: Wrong classes or other students' classes visible
```

#### Test 6: Student Invoices ⭐ CRITICAL
```
1. Navigate to /student-dashboard/invoices
2. Verify: Stats cards show correct totals
3. Verify: Invoice table shows student's invoices
4. Verify: Only THIS student's invoices visible

✅ PASS: Invoices show correct, isolated data
❌ FAIL: Wrong invoices or other students' invoices visible
```

#### Test 7: Role-Based Routing ⭐ CRITICAL
```
1. While logged in as student
2. Try to navigate to http://localhost:3000/dashboard
3. Verify: Automatic redirect to /student-dashboard/profile
4. Check console: "Estudiante intentando acceder a ruta de profesor"

✅ PASS: Student redirected from teacher routes
❌ FAIL: Student can access teacher dashboard
```

---

### Phase 3: RLS Validation (Database Level)

**Test Data Isolation**:

```sql
-- ============================================================================
-- TEST: Student can only see their own data
-- ============================================================================

-- Get your test student's ID
SELECT id, student_code, first_name, last_name
FROM students
WHERE student_code = 'YOUR_TEST_CODE';
-- Note the ID: _______

-- Count all students (service role sees all)
SELECT COUNT(*) as total_students FROM students;
-- Total: _______

-- Count all invoices (service role sees all)
SELECT COUNT(*) as total_invoices FROM invoices;
-- Total: _______

-- With RLS, students should only see their own records
-- This would be tested through the API or by SET ROLE (advanced)
-- For now, verify the policies exist:

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('students', 'invoices', 'classes')
ORDER BY tablename, policyname;

-- Should show:
-- students_select_own (SELECT)
-- students_select_policy (SELECT)
-- invoices_select_own (SELECT)
-- invoices_select_policy (SELECT)
-- classes_select_own (SELECT)
```

**Verify Students Cannot Modify**:

The following operations should FAIL for student users:

```sql
-- These are conceptual tests (would fail with RLS)
-- Students attempting these would get permission errors:

-- ❌ INSERT invoice (should fail)
INSERT INTO invoices (invoice_number, student_id, date, status, total, amount)
VALUES ('TEST-FAIL', YOUR_STUDENT_ID, '2025-01-01', 'pending', 100, 100);
-- Expected: Permission denied

-- ❌ UPDATE student record (should fail)
UPDATE students SET phone = '999999999' WHERE id = YOUR_STUDENT_ID;
-- Expected: Permission denied

-- ❌ DELETE invoice (should fail)
DELETE FROM invoices WHERE student_id = YOUR_STUDENT_ID;
-- Expected: Permission denied
```

**Verify Teachers Have Full Access**:

```sql
-- Test with teacher login (or service role)
-- Teachers should be able to:

-- ✅ View all students
SELECT COUNT(*) FROM students;
-- Should return all students

-- ✅ View all invoices
SELECT COUNT(*) FROM invoices;
-- Should return all invoices

-- ✅ Create, update, delete any record
-- (Test through UI as teacher)
```

---

## 📊 Test Results Template

### Quick Checklist

| Test | Status | Notes |
|------|--------|-------|
| **Schema & Migrations** |
| RLS policies script passes | [ ] | |
| All tables exist | [ ] | |
| All functions exist | [ ] | |
| **Route Protection** |
| /dashboard protected | [ ] | |
| /student-dashboard protected | [ ] | |
| LoginForm appears | [ ] | |
| **Registration** |
| Invalid code rejected | [ ] | |
| Valid code accepted | [ ] | |
| Already-used code rejected | [ ] | |
| Password validation works | [ ] | |
| User created in DB | [ ] | |
| **Login** |
| Student can log in | [ ] | |
| Session token created | [ ] | |
| Cookie set correctly | [ ] | |
| **Student Dashboard** |
| Profile shows correct data | [ ] | |
| Calendar shows own classes | [ ] | |
| Invoices shows own records | [ ] | |
| No other students visible | [ ] | |
| **Role Routing** |
| Student redirected from teacher routes | [ ] | |
| Teacher redirected from student routes | [ ] | |
| **RLS Policies** |
| Students see only own data | [ ] | |
| Students cannot modify data | [ ] | |
| Teachers see all data | [ ] | |
| **Session Management** |
| Logout clears session | [ ] | |
| Expired session rejected | [ ] | |

**Total Passed**: _____ / 25

---

## 🐛 Troubleshooting Guide

### Issue: LoginForm Not Appearing

**Symptoms**: Protected routes show content without login

**Solution**:
1. Check `AuthContext.tsx` is wrapping app
2. Verify `MainLayout` is checking `user` state
3. Clear localStorage and cookies
4. Restart development server

**Verification**:
```javascript
// In browser console
console.log(localStorage.getItem('session_token'));
console.log(document.cookie);
// Both should be empty/null for unauthenticated
```

---

### Issue: Registration Fails

**Symptoms**: "Error al registrar usuario" message

**Solution**:
1. Verify `create_student_user` function exists:
```sql
SELECT proname FROM pg_proc WHERE proname = 'create_student_user';
```

2. Check student_code exists and not already used:
```sql
SELECT s.id, s.student_code, su.id as user_id
FROM students s
LEFT JOIN system_users su ON s.id = su.student_id
WHERE s.student_code = 'YOUR_CODE';
-- user_id should be NULL for unused codes
```

3. Review Supabase logs for specific error

---

### Issue: Student Sees Other Students' Data

**Symptoms**: Student can see classes/invoices from other students

**Solution**:
1. **CRITICAL**: Re-run RLS policies:
```sql
-- Run: database/supabase-auth-rls-policies.sql
```

2. Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('students', 'invoices', 'classes');
-- rowsecurity should be 't' (true) for all
```

3. Check policies exist:
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
-- Should show multiple policies per table
```

---

### Issue: Student Redirected in Loop

**Symptoms**: Student keeps redirecting, never loads dashboard

**Solution**:
1. Check cookie is set correctly:
```javascript
console.log(document.cookie.includes('user_type=student'));
// Should be true
```

2. Verify user object in AuthContext:
```javascript
// In React DevTools, check AuthContext
user: {
  userType: 'student', // Should be lowercase
  studentId: 123       // Should have value
}
```

3. Check middleware is not blocking:
```typescript
// middleware.ts should allow student routes for students
```

---

### Issue: RLS Test Script Fails

**Symptoms**: test-rls-policies.sql shows ❌ FAIL

**Solution**:
1. Run migrations in correct order:
   - First: `supabase-auth-schema.sql`
   - Second: `supabase-auth-rls-policies.sql`
   - Third: `test-rls-policies.sql`

2. Check Supabase logs for errors

3. Verify you're using SERVICE ROLE key for tests

---

## 📈 Success Criteria

### Minimum Requirements for Production

All of the following must be TRUE:

- ✅ All automated RLS tests pass (test-rls-policies.sql)
- ✅ Route protection prevents unauthorized access
- ✅ Student registration works end-to-end
- ✅ Student login and dashboard functional
- ✅ Data isolation verified (students see only own data)
- ✅ Role-based routing working (correct redirects)
- ✅ No console errors in browser
- ✅ No RLS policy violations in Supabase logs

### Recommended Additional Tests

- [ ] Test with multiple concurrent student logins
- [ ] Test session expiry after 24 hours
- [ ] Test logout clears all sessions
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test on mobile devices
- [ ] Test with browser back button
- [ ] Test with direct URL entry
- [ ] Security audit with OWASP ZAP or similar

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `TESTING_AND_VALIDATION_GUIDE.md` | Detailed test cases (24 tests) |
| `test-rls-policies.sql` | Automated RLS verification script |
| `ROLE_BASED_ROUTING.md` | Routing system documentation |
| `SCHEMA_VERIFICATION_SUMMARY.md` | Database schema reference |

---

## ✅ Sign-Off

### Testing Completed By

**Name**: _______________  
**Date**: _______________  
**Environment**: [ ] Development [ ] Staging [ ] Production

### Results

**Tests Passed**: _____ / 25  
**Critical Issues**: _____ (must be 0 for production)  
**Minor Issues**: _____  

### Approval

- [ ] All critical tests pass
- [ ] RLS policies verified
- [ ] Route protection confirmed
- [ ] Data isolation validated
- [ ] Ready for production deployment

**Approved By**: _______________  
**Date**: _______________  

---

## 🎉 Completion

Once all tests pass and sign-off is complete:

1. **Document any issues found** and resolutions
2. **Archive test results** for compliance
3. **Monitor Supabase logs** after deployment
4. **Set up alerts** for RLS policy violations
5. **Schedule periodic security audits**

**Status**: [ ] In Progress [ ] Complete [ ] Blocked

---

**Last Updated**: 2025-01-06  
**Version**: 1.0.0  
**Next Review**: _____________


