/**
 * Unified Authentication Module
 * 
 * This module re-exports all authentication functions from auth-complex.ts
 * to ensure consistent use of Supabase-based authentication across the application.
 * 
 * All authentication operations (login, logout, session validation, registration)
 * are now handled through the Supabase database with proper session management.
 */

// Re-export types and functions from auth-complex.ts (Supabase-based implementation)
export type { User, AuthResult, CodeVerificationResult } from './auth-complex'

export {
  generateSessionToken,
  hashPassword,
  authenticateTeacher,
  authenticateStudent,
  validateSession,
  logout,
  verifyStudentCode,
  registerStudent
} from './auth-complex'
