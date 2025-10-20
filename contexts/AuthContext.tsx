'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, validateSession, logout } from '@/lib/auth-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => Promise<void>
  isTeacher: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to set cookie with security flags
function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  // Detectar si estamos en producción (HTTPS)
  const isProduction = window.location.protocol === 'https:'
  const secureFlag = isProduction ? ';Secure' : ''
  
  // SameSite=Strict para mejor protección CSRF
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict${secureFlag}`
}

// Helper function to delete cookie
function deleteCookie(name: string) {
  if (typeof window === 'undefined') return
  const isProduction = window.location.protocol === 'https:'
  const secureFlag = isProduction ? ';Secure' : ''
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict${secureFlag}`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Iniciar en true para evitar redirects prematuros
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Marcar como montado en el cliente
    setMounted(true)
  }, [])

  useEffect(() => {
    // Solo verificar sesión después de que el componente esté montado en el cliente
    if (!mounted) return

    const checkSession = async () => {
      try {
        const token = localStorage.getItem('session_token')
        
        if (token) {
          console.log('Validando sesión existente...')
          const result = await validateSession(token)
          
          if (result.success && result.user) {
            setUser(result.user)
            // Establecer cookie con el tipo de usuario
            setCookie('user_type', result.user.userType)
          } else {
            console.log('Sesión inválida o expirada')
            localStorage.removeItem('session_token')
            deleteCookie('user_type')
          }
        } else {
          console.log('No hay token de sesión')
        }
      } catch (error) {
        console.error('Error verificando sesión:', error)
        localStorage.removeItem('session_token')
        deleteCookie('user_type')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [mounted])

  // Route protection: redirect based on userType
  useEffect(() => {
    if (!user || loading || !mounted) return

    const isTeacherRoute = [
      '/dashboard',
      '/students',
      '/courses',
      '/calendar',
      '/invoices',
      '/class-tracking',
      '/communications',
      '/stats',
      '/settings'
    ].some(route => pathname === route || pathname.startsWith(route + '/'))

    const isStudentRoute = pathname.startsWith('/student-dashboard')

    // Si es estudiante intentando acceder a rutas de profesor
    if (user.userType === 'student' && isTeacherRoute) {
      console.log('Estudiante intentando acceder a ruta de profesor, redirigiendo...')
      router.push('/student-dashboard/profile')
      return
    }

    // Si es profesor intentando acceder a rutas de estudiante
    if (user.userType === 'teacher' && isStudentRoute) {
      console.log('Profesor intentando acceder a ruta de estudiante, redirigiendo...')
      router.push('/dashboard')
      return
    }
  }, [user, pathname, loading, mounted])

  const login = (user: User, token: string) => {
    setUser(user)
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_token', token)
      // Establecer cookie con el tipo de usuario
      setCookie('user_type', user.userType)
    }
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('session_token')
      if (token) {
        await logout(token)
      }
      localStorage.removeItem('session_token')
      deleteCookie('user_type')
    }
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout: handleLogout,
    isTeacher: user?.userType === 'teacher',
    isStudent: user?.userType === 'student'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
