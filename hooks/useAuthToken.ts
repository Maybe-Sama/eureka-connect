import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export function useAuthToken() {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Obtener el token del localStorage o de donde se almacene
    const storedToken = localStorage.getItem('session_token')
    setToken(storedToken)
  }, [user])

  const getAuthHeaders = () => {
    if (!token) return {}
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  return {
    token,
    getAuthHeaders,
    isAuthenticated
  }
}
