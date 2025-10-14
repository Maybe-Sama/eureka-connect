'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'

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
  }, [loading, isStudent])

  // Mostrar loading mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <DiagonalBoxLoader size="lg" color="hsl(var(--student-primary))" />
      </div>
    </div>
  )
}
