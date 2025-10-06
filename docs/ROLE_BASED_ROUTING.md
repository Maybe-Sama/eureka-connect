# Role-Based Routing Implementation

This document explains the role-based routing system implemented in the application to separate teacher and student access.

## Overview

The system uses a multi-layer approach to ensure users can only access routes appropriate for their role:
1. **Middleware** - Server-side route protection using cookies
2. **AuthContext** - Client-side route protection with automatic redirects
3. **Route Protection Hooks** - Page-level protection for additional security

## Components

### 1. Middleware (`middleware.ts`)

**Purpose**: Server-side route protection that runs before pages load.

**How it works**:
- Reads the `user_type` cookie to determine user role
- Defines separate route arrays for teachers and students
- Redirects users attempting to access unauthorized routes

**Teacher Routes**:
- `/dashboard`
- `/students`
- `/courses`
- `/calendar`
- `/invoices`
- `/class-tracking`
- `/communications`
- `/stats`
- `/settings`

**Student Routes**:
- `/student-dashboard` (and all sub-routes)

**Redirect Logic**:
- Student accessing teacher route → `/student-dashboard/profile`
- Teacher accessing student route → `/dashboard`

### 2. AuthContext (`contexts/AuthContext.tsx`)

**Purpose**: Client-side authentication state management with route protection.

**New Features**:
- Sets `user_type` cookie on login for middleware access
- Monitors route changes with `usePathname`
- Automatically redirects users to appropriate dashboards
- Clears cookies on logout

**Cookie Management**:
```typescript
setCookie('user_type', user.userType, 7) // 7 days expiry
```

**Route Protection Effect**:
```typescript
useEffect(() => {
  if (!user || loading || !mounted) return
  
  // Check if user is on wrong route type
  if (user.userType === 'student' && isTeacherRoute) {
    router.push('/student-dashboard/profile')
  }
  
  if (user.userType === 'teacher' && isStudentRoute) {
    router.push('/dashboard')
  }
}, [user, pathname, loading, mounted, router])
```

### 3. Route Protection Hooks (`hooks/useRouteProtection.ts`)

**Purpose**: Reusable hooks for page-level route protection.

**Available Hooks**:

#### `useRouteProtection(requiredUserType, redirectPath?)`
Generic hook that accepts:
- `requiredUserType`: 'teacher' | 'student'
- `redirectPath`: Optional custom redirect (defaults to appropriate dashboard)

#### `useTeacherRoute()`
Shorthand for teacher-only routes.

#### `useStudentRoute()`
Shorthand for student-only routes.

**Usage Example**:
```typescript
// In a teacher-only page
export default function TeacherPage() {
  const { user, loading, hasAccess } = useTeacherRoute()
  
  if (loading) return <LoadingSpinner />
  if (!hasAccess) return null // Will redirect automatically
  
  return <div>Teacher Content</div>
}

// In a student-only page
export default function StudentPage() {
  const { user, loading, hasAccess } = useStudentRoute()
  
  if (loading) return <LoadingSpinner />
  if (!hasAccess) return null // Will redirect automatically
  
  return <div>Student Content</div>
}
```

## Security Flow

### Login Process

1. User logs in via `LoginForm.tsx`
2. `authenticateTeacher` or `authenticateStudent` returns user with `userType`
3. `login()` function in AuthContext:
   - Stores user in state
   - Saves session token in localStorage
   - **Sets `user_type` cookie** for middleware
4. User is redirected to appropriate dashboard

### Page Access Attempt

#### Server-Side (Middleware)
1. User navigates to a route
2. Middleware checks `user_type` cookie
3. If user type doesn't match route requirement:
   - Redirect happens server-side (fast)
   - User never sees unauthorized content

#### Client-Side (AuthContext)
1. User navigates to a route (if middleware didn't catch it)
2. `useEffect` in AuthContext monitors pathname
3. Checks if `user.userType` matches route requirement
4. If mismatch: `router.push()` to appropriate dashboard
5. User sees brief flash before redirect

#### Page-Level (Optional Hook)
1. Page component calls `useTeacherRoute()` or `useStudentRoute()`
2. Hook checks user type on mount and when user changes
3. Redirects if access denied
4. Returns `hasAccess` boolean for conditional rendering

## Redirect Matrix

| User Type | Attempts to Access | Redirected To |
|-----------|-------------------|---------------|
| Student | `/dashboard` | `/student-dashboard/profile` |
| Student | `/students` | `/student-dashboard/profile` |
| Student | `/calendar` | `/student-dashboard/profile` |
| Student | Any teacher route | `/student-dashboard/profile` |
| Teacher | `/student-dashboard` | `/dashboard` |
| Teacher | `/student-dashboard/profile` | `/dashboard` |
| Teacher | Any student route | `/dashboard` |

## Cookie Details

**Name**: `user_type`  
**Values**: `'teacher'` | `'student'`  
**Expiry**: 7 days  
**Path**: `/` (site-wide)  
**SameSite**: `Lax` (CSRF protection)

**Set on**:
- Login
- Session validation (refresh)

**Cleared on**:
- Logout
- Session validation failure

## Testing Route Protection

### As a Teacher
1. Login as teacher
2. Navigate to `/dashboard` - ✅ Should work
3. Try to access `/student-dashboard/profile` - ❌ Should redirect to `/dashboard`

### As a Student
1. Login as student
2. Navigate to `/student-dashboard/profile` - ✅ Should work
3. Try to access `/dashboard` - ❌ Should redirect to `/student-dashboard/profile`

### Direct URL Access
1. Login as teacher
2. Type `/student-dashboard/calendar` in URL bar
3. Should be redirected to `/dashboard` before page loads

## Best Practices

1. **Always use the hooks in pages**: Even though middleware and AuthContext protect routes, use hooks for better UX
2. **Show loading states**: Users should see loading indicators during redirects
3. **Avoid flash of unauthorized content**: Return `null` while checking access
4. **Test both server and client redirects**: Ensure middleware works for direct URLs
5. **Clear cookies on logout**: Always clean up authentication state

## Troubleshooting

### User not being redirected
- Check if cookie is being set (DevTools → Application → Cookies)
- Verify middleware is running (check Next.js config)
- Check browser console for AuthContext redirect logs

### Redirect loop
- Ensure default routes (`/dashboard`, `/student-dashboard/profile`) are not protected
- Check that user type is correctly stored in cookie
- Verify middleware isn't redirecting to itself

### Cookie not persisting
- Check cookie expiry date
- Verify SameSite and Secure settings for your domain
- Ensure cookies aren't blocked by browser settings

## Future Enhancements

- [ ] Add role-based permissions within user types (admin teacher, regular teacher)
- [ ] Implement route-level permission checks for specific actions
- [ ] Add audit logging for unauthorized access attempts
- [ ] Implement rate limiting for route access
- [ ] Add email notifications for suspicious access patterns


