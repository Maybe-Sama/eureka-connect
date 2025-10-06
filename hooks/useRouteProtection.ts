import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook to protect routes based on user type
 * Redirects users to appropriate dashboards if they don't have access
 * 
 * @param requiredUserType - 'teacher' or 'student' - the required user type for this route
 * @param redirectPath - Optional custom redirect path if access is denied
 */
export function useRouteProtection(
  requiredUserType: 'teacher' | 'student',
  redirectPath?: string
) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't check while loading or if no user
    if (loading) return

    // If no user, redirect to login
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has the required user type
    if (user.userType !== requiredUserType) {
      // Redirect to appropriate dashboard based on actual user type
      const defaultRedirect = user.userType === 'teacher' 
        ? '/dashboard' 
        : '/student-dashboard/profile'
      
      router.push(redirectPath || defaultRedirect)
    }
  }, [user, loading, requiredUserType, redirectPath, router])

  return { user, loading, hasAccess: user?.userType === requiredUserType }
}

/**
 * Hook specifically for teacher-only routes
 */
export function useTeacherRoute() {
  return useRouteProtection('teacher')
}

/**
 * Hook specifically for student-only routes
 */
export function useStudentRoute() {
  return useRouteProtection('student')
}


