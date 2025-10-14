'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Usuario autenticado - redirigir según tipo
        if (user.userType === 'teacher') {
          router.push('/dashboard')
        } else {
          router.push('/student-dashboard')
        }
      } else {
        // Usuario no autenticado - ir a selección de login
        router.push('/login')
      }
    }
  }, [user, loading])

  // Mostrar loading mientras se decide la redirección
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">Cargando...</p>
      </div>
    </div>
  )
}
