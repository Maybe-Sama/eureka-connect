'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ClimbingBoxLoader } from 'react-spinners'

export default function StudentDashboard() {
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isStudent) {
        router.push('/login')
      } else {
        // Redirigir al perfil del estudiante por defecto
        router.push('/student-dashboard/profile')
      }
    }
  }, [loading, isStudent, router])

  // Mostrar loading mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <ClimbingBoxLoader color="hsl(var(--primary))" />
        <p className="mt-4 text-foreground-muted">Cargando...</p>
      </div>
    </div>
  )
}
