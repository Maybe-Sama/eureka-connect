'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, validateSession, logout } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => Promise<void>
  isTeacher: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false) // Cambiar a false inicialmente
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Marcar como montado en el cliente
    setMounted(true)
  }, [])

  useEffect(() => {
    // Solo verificar sesión después de que el componente esté montado en el cliente
    if (!mounted) return

    const checkSession = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('session_token')
        
        if (token) {
          const result = await validateSession(token)
          
          if (result.success && result.user) {
            setUser(result.user)
          } else {
            localStorage.removeItem('session_token')
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error)
        localStorage.removeItem('session_token')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [mounted])

  const login = (user: User, token: string) => {
    setUser(user)
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_token', token)
    }
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('session_token')
      if (token) {
        await logout(token)
      }
      localStorage.removeItem('session_token')
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
