/**
 * Client-side Authentication Utilities
 * 
 * This module provides client-safe authentication functions that call
 * API routes instead of directly accessing server-side code.
 * 
 * NEVER import server-side modules (like supabase-server) in client code!
 */

export interface User {
  id: string
  email: string
  userType: 'teacher' | 'student'
  studentId?: number
  studentName?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export interface CodeVerificationResult {
  success: boolean
  error?: string
  studentName?: string
}

/**
 * Validate session token
 */
export async function validateSession(token: string): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/validate-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error validating session:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

/**
 * Logout user
 */
export async function logout(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('Error logging out:', error)
    return false
  }
}

/**
 * Authenticate teacher
 */
export async function authenticateTeacher(email: string, password: string): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/login/teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error authenticating teacher:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

/**
 * Authenticate student
 */
export async function authenticateStudent(studentCode: string, password: string): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/login/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, password })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error authenticating student:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

/**
 * Verify student code before registration
 */
export async function verifyStudentCode(studentCode: string): Promise<CodeVerificationResult> {
  try {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error verifying student code:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

/**
 * Register student
 */
export async function registerStudent(
  studentCode: string, 
  password: string, 
  confirmPassword: string
): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, password, confirmPassword })
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error registering student:', error)
    return { success: false, error: 'Error de conexión' }
  }
}


