'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Construction, Clock } from 'lucide-react'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'

export default function DocumentosPage() {
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isStudent) {
      router.push('/login')
    }
  }, [loading, isStudent, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
      </div>
    )
  }

  if (!isStudent) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 sm:space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            📁 Documentos
          </h2>
          <p className="text-foreground-muted text-sm sm:text-base">
            Gestión de documentos académicos y certificados
          </p>
        </div>

        {/* Mensaje de construcción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6 sm:p-8 border border-border text-center"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Construction className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Sección en Construcción
            </h3>
            
            <p className="text-foreground-muted max-w-md text-sm sm:text-base">
              Esta sección está siendo desarrollada para permitir la gestión 
              del material académico.
            </p>

            <div className="flex items-center space-x-2 text-xs sm:text-sm text-foreground-muted">
              <Clock className="w-4 h-4" />
              <span>Próximamente disponible</span>
            </div>
          </div>
        </motion.div>

       
      </motion.div>
    </div>
  )
}
