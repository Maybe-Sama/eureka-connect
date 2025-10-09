'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentLayout from '@/components/layout/student-layout'
import ExamManagerModal from '@/components/calendar/ExamManagerModal'
import { Calendar as CalendarIcon, Clock, Book, ChevronLeft, ChevronRight, BookOpen, Star } from 'lucide-react'

interface ClassData {
  id: number
  date: string
  start_time: string
  end_time: string
  duration: number
  status: string
  subject?: string
  day_of_week: number
}

interface FixedSchedule {
  day_of_week: number
  start_time: string
  end_time: string
  subject: string
}

interface Exam {
  id: number
  subject: string
  exam_date: string
  exam_time?: string
  notes?: string
  grade?: number
}

export default function StudentCalendarPage() {
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [fixedSchedule, setFixedSchedule] = useState<FixedSchedule[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showExamManager, setShowExamManager] = useState(false)

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  useEffect(() => {
    if (!loading && !isStudent) {
      router.push('/login')
    }
  }, [loading, isStudent, router])

  useEffect(() => {
    if (isStudent && user?.studentId) {
      loadCalendarData()
    }
  }, [isStudent, user?.studentId, currentDate])

  // Escuchar actualizaciones de exámenes desde el modal
  useEffect(() => {
    const handleExamsUpdated = () => {
      loadCalendarData()
    }

    window.addEventListener('examsUpdated', handleExamsUpdated)
    return () => window.removeEventListener('examsUpdated', handleExamsUpdated)
  }, [])

  const loadCalendarData = async () => {
    try {
      // Cargar clases del mes actual
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data: studentClasses, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('student_id', user?.studentId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (classesError) {
        console.error('Error loading classes:', classesError)
      } else {
        setClasses(studentClasses || [])
      }

      // Cargar horario fijo
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('fixed_schedule')
        .eq('id', user?.studentId)
        .single()

      if (!studentError && student?.fixed_schedule) {
        try {
          const schedule = JSON.parse(student.fixed_schedule)
          setFixedSchedule(schedule)
        } catch (e) {
          console.error('Error parsing fixed_schedule:', e)
        }
      }

      // Cargar exámenes del estudiante
      const { data: studentExams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('student_id', user?.studentId)
        .order('exam_date', { ascending: true })

      if (examsError) {
        console.error('Error loading exams:', examsError)
      } else {
        setExams(studentExams || [])
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getClassesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return classes.filter(cls => cls.date === dateStr)
  }

  const getExamsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return exams.filter(exam => exam.exam_date === dateStr)
  }

  const getFixedScheduleForDate = (date: Date) => {
    const dayOfWeek = date.getDay()
    return fixedSchedule.filter(schedule => schedule.day_of_week === dayOfWeek)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    
    // Días del mes anterior (para completar la primera semana)
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      case 'scheduled':
        return 'Programada'
      default:
        return status
    }
  }

  if (loading || loadingData) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground-muted">Cargando calendario...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (!isStudent) {
    return null
  }

  const days = getDaysInMonth()

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <CalendarIcon className="mr-3 text-primary" size={32} />
              Mi Calendario
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="text-lg font-semibold text-foreground min-w-[200px] text-center">
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 glass-effect rounded-2xl shadow-lg p-6 border border-border">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-foreground-secondary py-2"
                >
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }
                
                const classesForDay = getClassesForDate(day)
                const examsForDay = getExamsForDate(day)
                const fixedScheduleForDay = getFixedScheduleForDate(day)
                const isToday = day.toDateString() === new Date().toDateString()
                const hasAnyActivity = classesForDay.length > 0 || examsForDay.length > 0 || fixedScheduleForDay.length > 0
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all hover:shadow-md ${
                      isToday 
                        ? 'border-primary bg-primary/10' 
                        : hasAnyActivity
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-background-secondary'
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {day.getDate()}
                    </div>
                    <div className="space-y-1.5">
                      {/* Mostrar clases */}
                      {classesForDay.slice(0, 2).map((cls) => (
                        <div
                          key={`class-${cls.id}`}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${getStatusColor(cls.status)}`}
                          title={`Clase: ${cls.start_time} - ${getStatusText(cls.status)}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                          <span className="text-xs font-medium truncate">{cls.start_time}</span>
                        </div>
                      ))}
                      
                      {/* Mostrar exámenes */}
                      {examsForDay.slice(0, 1).map((exam) => (
                        <div
                          key={`exam-${exam.id}`}
                          className="px-2 py-1 rounded-lg shadow-sm transition-all duration-200 hover:scale-105 bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200"
                          title={`Examen: ${exam.subject}${exam.exam_time ? ` - ${exam.exam_time}` : ''}${exam.notes ? ` - ${exam.notes}` : ''}`}
                        >
                          <div className="text-xs font-bold truncate mb-0.5">
                            {exam.subject}
                          </div>
                          {exam.notes && (
                            <div className="text-xs text-red-600 truncate">
                              {exam.notes}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Mostrar horario fijo */}
                      {fixedScheduleForDay.slice(0, 1).map((schedule, index) => (
                        <div
                          key={`schedule-${index}`}
                          className="flex items-center space-x-2 px-3 py-2 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                          title={`Horario fijo: ${schedule.subject} - ${schedule.start_time}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-xs font-medium truncate">{schedule.start_time}</span>
                        </div>
                      ))}
                      
                      {/* Contador de actividades adicionales */}
                      {hasAnyActivity && (classesForDay.length + examsForDay.length + fixedScheduleForDay.length) > 3 && (
                        <div className="flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                          +{(classesForDay.length + examsForDay.length + fixedScheduleForDay.length) - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Horario Fijo y Próximos Exámenes */}
          <div className="space-y-6">
            {/* Horario Fijo */}
            {fixedSchedule.length > 0 && (
              <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3">
                    <Book className="text-primary" size={20} />
                  </div>
                  Horario Fijo
                </h2>
                <div className="space-y-3">
                  {fixedSchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className="group p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground">
                          {daysOfWeek[schedule.day_of_week]}
                        </span>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {schedule.subject}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-foreground-secondary">
                        <div className="p-1 bg-primary/20 rounded mr-2">
                          <Clock size={12} className="text-primary" />
                        </div>
                        <span className="font-medium">{schedule.start_time} - {schedule.end_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximos Exámenes */}
            <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3">
                    <BookOpen className="text-primary" size={20} />
                  </div>
                  Próximos Exámenes
                </h2>
                <button
                  onClick={() => setShowExamManager(true)}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Gestionar
                </button>
              </div>
              <div className="space-y-4">
                {exams.slice(0, 5).map((exam) => (
                  <div
                    key={exam.id}
                    className="group p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-foreground mb-1">
                          {exam.subject}
                        </div>
                        {exam.notes && (
                          <div className="text-xs text-foreground-secondary mb-2">
                            <span className="font-medium">Tema:</span> {exam.notes}
                          </div>
                        )}
                      </div>
                      {exam.grade && (
                        <div className="flex items-center text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2">
                          <Star size={14} className="mr-1 text-yellow-600" />
                          <span className="font-bold text-yellow-700">
                            {exam.grade}/10
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-foreground-secondary">
                      <div className="p-1 bg-primary/20 rounded mr-2">
                        <CalendarIcon size={12} className="text-primary" />
                      </div>
                      <span className="font-medium">
                        {new Date(exam.exam_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      {exam.exam_time && (
                        <>
                          <div className="p-1 bg-primary/20 rounded mx-2">
                            <Clock size={12} className="text-primary" />
                          </div>
                          <span className="font-medium">{exam.exam_time}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {exams.length === 0 && (
                  <div className="text-center py-8">
                    <div className="p-4 bg-primary/5 rounded-2xl inline-block mb-4">
                      <BookOpen size={32} className="text-primary/50" />
                    </div>
                    <p className="text-foreground-muted text-sm mb-4">
                      No tienes exámenes registrados
                    </p>
                    <button
                      onClick={() => setShowExamManager(true)}
                      className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      Crear primer examen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Gestor de Exámenes */}
      <ExamManagerModal
        isOpen={showExamManager}
        onClose={() => setShowExamManager(false)}
      />
    </StudentLayout>
  )
}


