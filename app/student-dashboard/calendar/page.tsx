'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ExamManagerModal from '@/components/calendar/ExamManagerModal'
import { Calendar as CalendarIcon, Clock, Book, ChevronLeft, ChevronRight, BookOpen, Star } from 'lucide-react'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'

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
  const [showColorConfig, setShowColorConfig] = useState(false)
  const [customColors, setCustomColors] = useState({
    exams: '#10b981',   // red-500
    schedule: '#6366f1' // green-500
  })

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

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
    // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return classes.filter(cls => cls.date === dateStr)
  }

  const getExamsForDate = (date: Date) => {
    // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return exams.filter(exam => exam.exam_date === dateStr)
  }

  const getFixedScheduleForDate = (date: Date) => {
    const dayOfWeek = date.getDay()
    // Convertir de formato domingo=0 a formato lunes=0
    const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    return fixedSchedule.filter(schedule => schedule.day_of_week === mondayBasedDay)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    
    // Ajustar para que lunes sea el primer día (0 = domingo, 1 = lunes, etc.)
    // Si es domingo (0), necesitamos 6 espacios vacíos
    // Si es lunes (1), necesitamos 0 espacios vacíos
    // Si es martes (2), necesitamos 1 espacio vacío, etc.
    const mondayStartOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const days = []
    
    // Días del mes anterior (para completar la primera semana empezando en lunes)
    for (let i = 0; i < mondayStartOffset; i++) {
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

  const days = getDaysInMonth()

  return (
    <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="glass-effect rounded-2xl shadow-lg p-4 sm:p-6 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
            <CalendarIcon className="mr-2 sm:mr-3 text-primary" size={32} />
            Mi Calendario
          </h1>
          <div className="flex items-center justify-between sm:justify-center space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-base sm:text-lg font-semibold text-foreground min-w-[150px] sm:min-w-[200px] text-center">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-effect rounded-2xl shadow-lg p-3 sm:p-6 border border-border">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-3 sm:mb-4">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-xs sm:text-sm font-semibold text-foreground-secondary py-2 sm:py-3"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
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
                  className={`aspect-square p-1 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all hover:shadow-md ${
                    isToday 
                      ? 'border-primary bg-primary/10' 
                      : hasAnyActivity
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-background-secondary'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    {/* Mostrar clases - solo en desktop */}
                    {classesForDay.slice(0, 2).map((cls) => (
                      <div
                        key={`class-${cls.id}`}
                        className={`hidden sm:flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${getStatusColor(cls.status)}`}
                        title={`Clase: ${cls.start_time} - ${getStatusText(cls.status)}`}
                      >
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current opacity-60"></div>
                        <span className="text-xs font-medium truncate">{cls.start_time}</span>
                      </div>
                    ))}
                    
                    {/* Mostrar exámenes - versión móvil y desktop */}
                    {examsForDay.slice(0, 1).map((exam) => (
                      <div key={`exam-container-${exam.id}`}>
                        {/* Versión móvil - solo punto */}
                        <div
                          className="flex sm:hidden items-center justify-center"
                          title={`Examen: ${exam.subject}${exam.exam_time ? ` - ${exam.exam_time}` : ''}`}
                        >
                          <div 
                            className="w-2 h-2 rounded-full shadow-sm"
                            style={{ backgroundColor: customColors.exams }}
                          ></div>
                        </div>
                        {/* Versión desktop - cartel completo */}
                        <div
                          className="hidden sm:block px-1 sm:px-2 py-1 rounded-lg shadow-sm transition-all duration-200 hover:scale-105 text-white border"
                          style={{ 
                            backgroundColor: customColors.exams,
                            borderColor: customColors.exams
                          }}
                          title={`Examen: ${exam.subject}${exam.exam_time ? ` - ${exam.exam_time}` : ''}${exam.notes ? ` - ${exam.notes}` : ''}`}
                        >
                          <div className="text-xs font-bold truncate mb-0.5">
                            {exam.subject}
                          </div>
                          {exam.notes && (
                            <div className="text-xs text-white/80 truncate">
                              {exam.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Mostrar horario fijo - versión móvil y desktop */}
                    {fixedScheduleForDay.slice(0, 1).map((schedule, index) => (
                      <div key={`schedule-container-${index}`}>
                        {/* Versión móvil - solo punto */}
                        <div
                          className="flex sm:hidden items-center justify-center"
                          title={`Horario fijo: ${schedule.subject} - ${schedule.start_time}`}
                        >
                          <div 
                            className="w-2 h-2 rounded-full shadow-sm"
                            style={{ backgroundColor: customColors.schedule }}
                          ></div>
                        </div>
                        {/* Versión desktop - cartel completo */}
                        <div
                          className="hidden sm:flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-sm transition-all duration-200 hover:scale-105 text-white border"
                          style={{ 
                            backgroundColor: customColors.schedule,
                            borderColor: customColors.schedule
                          }}
                          title={`Horario fijo: ${schedule.subject} - ${schedule.start_time}`}
                        >
                          <div 
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white opacity-80"
                          ></div>
                          <span className="text-xs font-medium truncate">{schedule.start_time}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Contador de actividades adicionales */}
                    {hasAnyActivity && (classesForDay.length + examsForDay.length + fixedScheduleForDay.length) > 3 && (
                      <div className="flex items-center justify-center px-1 sm:px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
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
        <div className="space-y-4 sm:space-y-6">
          {/* Leyenda de colores - Visible en todas las pantallas */}
          <div className="glass-effect rounded-2xl shadow-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Leyenda de colores</h3>
              <button
                onClick={() => setShowColorConfig(!showColorConfig)}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                Configurar
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: customColors.exams }}
                ></div>
                <span className="text-foreground-secondary">Exámenes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: customColors.schedule }}
                ></div>
                <span className="text-foreground-secondary">Horario fijo</span>
              </div>
            </div>

            {/* Panel de configuración de colores */}
            {showColorConfig && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs sm:text-sm text-foreground-secondary">Exámenes</span>
                    <input
                      type="color"
                      value={customColors.exams}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, exams: e.target.value }))}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-border cursor-pointer hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs sm:text-sm text-foreground-secondary">Horario fijo</span>
                    <input
                      type="color"
                      value={customColors.schedule}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, schedule: e.target.value }))}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-border cursor-pointer hover:scale-105 transition-transform"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Horario Fijo */}
          {fixedSchedule.length > 0 && (
            <div className="glass-effect rounded-2xl shadow-lg p-4 sm:p-6 border border-border">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg mr-2 sm:mr-3">
                  <Book className="text-primary" size={20} />
                </div>
                Horario Fijo
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {fixedSchedule.map((schedule, index) => (
                  <div
                    key={index}
                    className="group p-4 sm:p-5 bg-gradient-to-r from-student-primary/5 to-student-primary/10 rounded-2xl border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                      <span className="text-sm sm:text-base font-bold text-foreground">
                        {daysOfWeek[schedule.day_of_week]}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-primary bg-primary/20 px-3 py-1.5 rounded-full border border-student-primary/30">
                        {schedule.subject}
                      </span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base text-foreground-secondary">
                      <div className="p-1.5 bg-primary/20 rounded-lg mr-3">
                        <Clock size={14} className="text-primary" />
                      </div>
                      <span className="font-semibold">{schedule.start_time} - {schedule.end_time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximos Exámenes */}
          <div className="glass-effect rounded-2xl shadow-lg p-4 sm:p-6 border border-border">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg mr-2 sm:mr-3">
                  <BookOpen className="text-primary" size={20} />
                </div>
                Próximos Exámenes
              </h2>
              <button
                onClick={() => setShowExamManager(true)}
                className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                Gestionar
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {exams.slice(0, 5).map((exam) => (
                <div
                  key={exam.id}
                  className="group p-4 sm:p-5 rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-student-primary/5 to-student-primary/10 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <div className="text-sm sm:text-base font-bold text-foreground mb-1">
                        {exam.subject}
                      </div>
                      {exam.notes && (
                        <div className="text-xs sm:text-sm text-foreground-secondary mb-2">
                          <span className="font-medium">Tema:</span> {exam.notes}
                        </div>
                      )}
                    </div>
                    {exam.grade && (
                      <div className="flex items-center text-xs sm:text-sm bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full border border-yellow-200">
                        <Star size={14} className="mr-1 text-yellow-600" />
                        <span className="font-bold text-yellow-700">
                          {exam.grade}/10
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-sm sm:text-base text-foreground-secondary">
                    <div className="p-1.5 bg-primary/20 rounded-lg mr-3">
                      <CalendarIcon size={14} className="text-primary" />
                    </div>
                    <span className="font-semibold">
                      {new Date(exam.exam_date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                    {exam.exam_time && (
                      <>
                        <div className="p-1.5 bg-primary/20 rounded-lg mx-3">
                          <Clock size={14} className="text-primary" />
                        </div>
                        <span className="font-semibold">{exam.exam_time}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <div className="p-3 sm:p-4 bg-primary/5 rounded-2xl inline-block mb-4">
                    <BookOpen size={32} className="text-primary/50" />
                  </div>
                  <p className="text-foreground-muted text-xs sm:text-sm mb-4">
                    No tienes exámenes registrados
                  </p>
                  <button
                    onClick={() => setShowExamManager(true)}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    Crear primer examen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Gestor de Exámenes */}
      <ExamManagerModal
        isOpen={showExamManager}
        onClose={() => setShowExamManager(false)}
      />
    </div>
  )
}