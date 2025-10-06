'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import MainLayout from '@/components/layout/main-layout'
import { motion } from 'framer-motion'
import { 
  Users, 
  Calendar as CalendarIcon, 
  FileText, 
  BarChart3, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  TrendingUp,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TeacherDashboard() {
  const { user, loading, isTeacher } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isTeacher) {
      router.push('/login')
    }
  }, [loading, isTeacher, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground-muted">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isTeacher) {
    return null
  }

  return (
    <MainLayout>
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Panel Profesor
            </h1>
            <p className="text-foreground-muted">
              Bienvenido, {user?.email}
            </p>
          </div>
          <div className="flex space-x-4">
            <Button
              asChild
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Link href="/logout">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-effect rounded-lg p-4 text-center">
            <Users size={24} className="text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-sm text-foreground-muted">Total Alumnos</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <CalendarIcon size={24} className="text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-sm text-foreground-muted">Clases Hoy</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <FileText size={24} className="text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">€0.00</p>
            <p className="text-sm text-foreground-muted">Ingresos del Mes</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <BookOpen size={24} className="text-info mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-sm text-foreground-muted">Cursos Activos</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gestión de Estudiantes */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/students" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        Gestión de Estudiantes
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Administrar estudiantes y sus datos
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Calendario */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/calendar" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-success/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/20 transition-colors">
                        <CalendarIcon className="w-6 h-6 text-success" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-success transition-colors">
                        Calendario
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Ver y gestionar clases programadas
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Facturación */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/invoices" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-warning/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                        <FileText className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-warning transition-colors">
                        Facturación
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Gestionar facturas y pagos
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Seguimiento de Clases */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/class-tracking" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-purple-500/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <BarChart3 className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-500 transition-colors">
                        Seguimiento de Clases
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Monitorear asistencia y progreso
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Cursos */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/courses" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-info/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center group-hover:bg-info/20 transition-colors">
                        <BookOpen className="w-6 h-6 text-info" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-info transition-colors">
                        Cursos
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Gestionar cursos y materias
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Comunicaciones */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/communications" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-pink-500/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                        <MessageSquare className="w-6 h-6 text-pink-500" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-pink-500 transition-colors">
                        Comunicaciones
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Mensajes y notificaciones
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Configuración */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/settings" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-foreground-muted/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-foreground-muted/10 rounded-lg flex items-center justify-center group-hover:bg-foreground-muted/20 transition-colors">
                        <Settings className="w-6 h-6 text-foreground-muted" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground-muted transition-colors">
                        Configuración
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Ajustes del sistema y preferencias
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Estadísticas */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/stats" className="group block">
                <div className="glass-effect rounded-xl p-6 border border-border hover:border-accent/30 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <BarChart3 className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                        Estadísticas
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        Análisis y reportes detallados
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
