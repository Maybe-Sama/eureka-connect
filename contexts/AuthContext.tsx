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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sesión existente al cargar
    const checkSession = async () => {
      const token = localStorage.getItem('session_token')
      if (token) {
        const result = await validateSession(token)
        if (result.success && result.user) {
          setUser(result.user)
        } else {
          localStorage.removeItem('session_token')
        }
      }
      setLoading(false)
    }

    checkSession()
  }, [])

  const login = (user: User, token: string) => {
    setUser(user)
    localStorage.setItem('session_token', token)
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('session_token')
    if (token) {
      await logout(token)
    }
    setUser(null)
    localStorage.removeItem('session_token')
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
