'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo redirigir si hay usuario autenticado
    if (!loading && user) {
      if (user.userType === 'teacher') {
        router.push('/dashboard')
      } else {
        router.push('/student-dashboard')
      }
    }
  }, [user, loading, router])

  // Si no hay usuario, el MainLayout mostrará el login
  // Si hay usuario, redirigirá automáticamente
  return null
}
