'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/main-layout'
import { supabase } from '@/lib/supabase'
import { RotateCcw, AlertTriangle, Clock, CheckCircle, XCircle, Users, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Student {
  id: number
  first_name: string
  last_name: string
  student_code: string
}

interface PunishmentType {
  id: number
  name: string
  description: string
  color: string
  severity: number
  is_active: boolean
}

interface RouletteSession {
  id: number
  student_id: number
  teacher_id: number
  session_status: 'waiting' | 'spinning' | 'completed'
  selected_punishment_id: number
  spin_started_at: string
  spin_completed_at: string
  result_id: number
  students: Student
  punishment_type: PunishmentType
}

export default function TeacherRoulettePage() {
  const { user, loading, isTeacher } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [studentPunishments, setStudentPunishments] = useState<PunishmentType[]>([])
  const [currentSession, setCurrentSession] = useState<RouletteSession | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !isTeacher) {
      router.push('/login')
    }
  }, [loading, isTeacher, router])

  useEffect(() => {
    if (isTeacher) {
      loadStudents()
    }
  }, [isTeacher])

  useEffect(() => {
    if (selectedStudent) {
      loadStudentPunishments()
      loadCurrentSession()
    }
  }, [selectedStudent])

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_code')
        .order('first_name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Error cargando estudiantes')
    } finally {
      setLoadingData(false)
    }
  }

  const loadStudentPunishments = async () => {
    if (!selectedStudent) return

    try {
      const { data, error } = await supabase
        .from('student_custom_punishments')
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .eq('student_id', selectedStudent)
        .eq('is_selected', true)
        .eq('is_unlocked', true)
        .order('order_position', { ascending: true })

      if (error) throw error

      const punishments = data?.map(item => item.punishment_type) || []
      setStudentPunishments(punishments)
    } catch (error) {
      console.error('Error loading student punishments:', error)
      toast.error('Error cargando castigos del estudiante')
    }
  }

  const loadCurrentSession = async () => {
    if (!selectedStudent) return

    try {
      const { data, error } = await supabase
        .from('roulette_sessions')
        .select(`
          *,
          students(first_name, last_name, student_code),
          punishment_type:punishment_types(*)
        `)
        .eq('student_id', selectedStudent)
        .eq('session_status', 'spinning')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      setCurrentSession(data)
    } catch (error) {
      console.error('Error loading current session:', error)
    }
  }

  const startRoulette = async () => {
    if (!selectedStudent || studentPunishments.length === 0) {
      toast.error('Selecciona un estudiante con castigos configurados')
      return
    }

    try {
      setIsSpinning(true)

      // Crear nueva sesión de ruleta
      const { data: session, error: sessionError } = await supabase
        .from('roulette_sessions')
        .insert({
          student_id: selectedStudent,
          teacher_id: user?.id,
          session_status: 'spinning',
          spin_started_at: new Date().toISOString()
        })
        .select(`
          *,
          students(first_name, last_name, student_code),
          punishment_type:punishment_types(*)
        `)
        .single()

      if (sessionError) throw sessionError

      setCurrentSession(session)

      // Simular giro de la ruleta (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Seleccionar castigo aleatorio
      const randomIndex = Math.floor(Math.random() * studentPunishments.length)
      const selectedPunishment = studentPunishments[randomIndex]

      // Crear resultado del castigo
      const { data: result, error: resultError } = await supabase
        .from('punishment_results')
        .insert({
          student_id: selectedStudent,
          punishment_type_id: selectedPunishment.id,
          teacher_id: user?.id,
          result_date: new Date().toISOString()
        })
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .single()

      if (resultError) throw resultError

      // Actualizar sesión como completada
      const { error: updateError } = await supabase
        .from('roulette_sessions')
        .update({
          session_status: 'completed',
          selected_punishment_id: selectedPunishment.id,
          spin_completed_at: new Date().toISOString(),
          result_id: result.id
        })
        .eq('id', session.id)

      if (updateError) throw updateError

      // Actualizar sesión local
      setCurrentSession({
        ...session,
        session_status: 'completed',
        selected_punishment_id: selectedPunishment.id,
        spin_completed_at: new Date().toISOString(),
        result_id: result.id,
        punishment_type: selectedPunishment
      })

      toast.success(`¡Ruleta completada! Resultado: ${selectedPunishment.name}`)
    } catch (error) {
      console.error('Error starting roulette:', error)
      toast.error('Error lanzando la ruleta')
    } finally {
      setIsSpinning(false)
    }
  }

  const markAsCompleted = async (resultId: number) => {
    try {
      const { error } = await supabase
        .from('punishment_results')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', resultId)

      if (error) throw error

      toast.success('Castigo marcado como completado')
      loadCurrentSession()
    } catch (error) {
      console.error('Error marking as completed:', error)
      toast.error('Error marcando como completado')
    }
  }

  const getSeverityIcon = (severity: number) => {
    switch (severity) {
      case 1: return <Clock className="w-4 h-4 text-green-500" />
      case 2: return <Clock className="w-4 h-4 text-yellow-500" />
      case 3: return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 4: return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 5: return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityText = (severity: number) => {
    switch (severity) {
      case 1: return 'Muy Leve'
      case 2: return 'Leve'
      case 3: return 'Moderado'
      case 4: return 'Severo'
      case 5: return 'Muy Severo'
      default: return 'Desconocido'
    }
  }

  if (loading || loadingData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground-muted">Cargando panel de ruleta...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!isTeacher) {
    return null
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🎯 Panel de Ruleta del Profesor
          </h1>
          <p className="text-foreground-muted">
            Lanza la ruleta para tus estudiantes y gestiona los resultados
          </p>

          {/* Selección de Estudiante */}
          <div className="glass-effect rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Users className="mr-2 text-primary" size={24} />
              Seleccionar Estudiante
            </h2>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedStudent?.toString() || ''} onValueChange={(value) => setSelectedStudent(parseInt(value))}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecciona un estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.first_name} {student.last_name} ({student.student_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Castigos del Estudiante */}
          {selectedStudent && (
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-primary" size={24} />
                Castigos Configurados ({studentPunishments.length}/5)
              </h2>
              
              {studentPunishments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">
                    Este estudiante no tiene castigos configurados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentPunishments.map((punishment, index) => (
                    <div
                      key={punishment.id}
                      className="flex items-center space-x-3 p-4 bg-background-tertiary rounded-lg border border-border/50"
                    >
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: punishment.color }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {punishment.name}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-foreground-muted">
                          {getSeverityIcon(punishment.severity)}
                          <span>{getSeverityText(punishment.severity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Controles de Ruleta */}
          {selectedStudent && studentPunishments.length > 0 && (
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <RotateCcw className="mr-2 text-primary" size={24} />
                Controles de Ruleta
              </h2>
              
              <div className="text-center">
                <Button
                  onClick={startRoulette}
                  disabled={isSpinning || currentSession?.session_status === 'spinning'}
                  size="lg"
                  className="px-8 py-4 text-lg"
                >
                  {isSpinning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Girando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Play className="w-5 h-5" />
                      <span>Lanzar Ruleta</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Resultado Actual */}
          {currentSession && (
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <CheckCircle className="mr-2 text-primary" size={24} />
                Resultado Actual
              </h2>
              
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-primary flex items-center justify-center">
                  <RotateCcw className="w-16 h-16 text-primary" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {currentSession.punishment_type?.name || 'Sin resultado'}
                </h3>
                
                {currentSession.punishment_type && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-foreground-muted mb-4">
                    {getSeverityIcon(currentSession.punishment_type.severity)}
                    <span>{getSeverityText(currentSession.punishment_type.severity)}</span>
                  </div>
                )}
                
                <p className="text-foreground-muted mb-6">
                  Estudiante: {currentSession.students?.first_name} {currentSession.students?.last_name}
                </p>
                
                {currentSession.session_status === 'completed' && currentSession.result_id && (
                  <Button
                    onClick={() => markAsCompleted(currentSession.result_id)}
                    className="px-6 py-2"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Completado
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  )
}


