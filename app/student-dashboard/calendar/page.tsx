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
  is_recurring: boolean
  course_name?: string
  course_color?: string
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
  const [scheduledClasses, setScheduledClasses] = useState<ClassData[]>([])
  const [scheduledClassesNext7Days, setScheduledClassesNext7Days] = useState<ClassData[]>([])
  const [fixedSchedule, setFixedSchedule] = useState<FixedSchedule[]>([])
  const [fixedScheduleNext7Days, setFixedScheduleNext7Days] = useState<FixedSchedule[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [examsNext7Days, setExamsNext7Days] = useState<Exam[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showExamManager, setShowExamManager] = useState(false)
  const [showColorConfig, setShowColorConfig] = useState(false)
  const [customColors, setCustomColors] = useState({
    exams: '#10b981',   // green-500
    schedule: '#6366f1', // indigo-500
    scheduled: '#f59e0b' // amber-500
  })

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  // Función para formatear tiempo sin segundos
  const formatTime = (timeString: string) => {
    if (!timeString) return timeString
    // Si ya está en formato HH:MM, devolverlo tal como está
    if (timeString.match(/^\d{1,2}:\d{2}$/)) return timeString
    // Si tiene segundos (HH:MM:SS), quitar los segundos
    if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      return timeString.substring(0, 5)
    }
    return timeString
  }

  useEffect(() => {
    if (!loading && !isStudent) {
      router.push('/login')
    }
  }, [loading, isStudent])

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
      // Solo cargar clases programadas (eventuales) del estudiante actual
      // Las clases fijas se manejan por separado desde el horario fijo del estudiante
      const classesResponse = await fetch('/api/classes')
      
      if (!classesResponse.ok) {
        throw new Error('Error fetching classes from API')
      }
      
      const classesData = await classesResponse.json()
      
      console.log('=== DEBUG API DATA (Student Calendar) ===')
      console.log('Total classes from API:', classesData.length)
      
      // Filtrar solo las clases programadas (no fijas) del estudiante actual
      const studentScheduledClasses = classesData.filter((cls: any) => 
        cls.student_id === user?.studentId && !cls.is_recurring
      )
      
      console.log('Scheduled classes for student ID', user?.studentId, ':', studentScheduledClasses.length, studentScheduledClasses)
      
      // Filtrar por mes actual
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const scheduledClassesThisMonth = studentScheduledClasses.filter((cls: any) => {
        const classDate = new Date(cls.date)
        return classDate >= startOfMonth && classDate <= endOfMonth
      })
      
      console.log('Scheduled classes this month:', scheduledClassesThisMonth.length, scheduledClassesThisMonth)
      
      // Solo establecer las clases programadas (las fijas se manejan desde fixed_schedule)
      setScheduledClasses(scheduledClassesThisMonth)

      // Filtrar clases programadas para los próximos 7 días (para el apartado "Mis Clases")
      const today = new Date()
      const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const scheduledClassesNext7Days = studentScheduledClasses.filter((cls: any) => {
        const classDate = new Date(cls.date)
        return classDate >= today && classDate <= next7Days
      })
      
      console.log('Scheduled classes next 7 days:', scheduledClassesNext7Days.length, scheduledClassesNext7Days)
      setScheduledClassesNext7Days(scheduledClassesNext7Days)

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
          
          // Filtrar horario fijo para los próximos 7 días
          const fixedScheduleNext7Days = schedule.filter((scheduleItem: FixedSchedule) => {
            const today = new Date()
            const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            
            // Para horario fijo, necesitamos verificar si hay algún día de la semana
            // en los próximos 7 días que coincida con el day_of_week del horario
            for (let i = 0; i < 7; i++) {
              const checkDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
              if (checkDate.getDay() === scheduleItem.day_of_week) {
                return true
              }
            }
            return false
          })
          
          console.log('Fixed schedule next 7 days:', fixedScheduleNext7Days.length, fixedScheduleNext7Days)
          setFixedScheduleNext7Days(fixedScheduleNext7Days)
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
        
        // Filtrar exámenes para los próximos 7 días
        const today = new Date()
        const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        const examsNext7Days = (studentExams || []).filter((exam: Exam) => {
          const examDate = new Date(exam.exam_date)
          return examDate >= today && examDate <= next7Days
        })
        
        console.log('Exams next 7 days:', examsNext7Days.length, examsNext7Days)
        setExamsNext7Days(examsNext7Days)
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getClassesForDate = (date: Date) => {
    // Esta función ya no se usa porque las clases fijas se manejan desde fixed_schedule
    // Mantenemos la función para compatibilidad pero devuelve array vacío
    return []
  }

  const getScheduledClassesForDate = (date: Date) => {
    // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const filteredClasses = scheduledClasses.filter(cls => cls.date === dateStr)
    
    // Debug para fechas específicas
    if (filteredClasses.length > 0) {
      console.log(`=== DEBUG SCHEDULED CLASSES FOR ${dateStr} ===`)
      console.log('Date string:', dateStr)
      console.log('All scheduled classes:', scheduledClasses)
      console.log('Filtered classes for date:', filteredClasses)
    }
    
    return filteredClasses
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
    // El horario fijo usa el mismo formato que JavaScript: domingo=0, lunes=1, ..., sábado=6
    // No necesitamos conversión, solo comparar directamente
    return fixedSchedule.filter(schedule => schedule.day_of_week === dayOfWeek)
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
    <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto space-y-3 sm:space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="glass-effect rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center">
            <CalendarIcon className="mr-2 sm:mr-3 text-primary" size={24} />
            <span className="hidden xs:inline">Mi Calendario</span>
            <span className="xs:hidden">Calendario</span>
          </h1>
          <div className="flex items-center justify-between sm:justify-center space-x-2 sm:space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm sm:text-base lg:text-lg font-semibold text-foreground min-w-[120px] sm:min-w-[150px] lg:min-w-[200px] text-center">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-effect rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 lg:p-6 border border-border">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 lg:gap-2 mb-2 sm:mb-3 lg:mb-4">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-xs sm:text-sm font-semibold text-foreground-secondary py-1.5 sm:py-2 lg:py-3"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 lg:gap-2">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }
              
              const scheduledClassesForDay = getScheduledClassesForDate(day)
              const examsForDay = getExamsForDate(day)
              const fixedScheduleForDay = getFixedScheduleForDate(day)
              const isToday = day.toDateString() === new Date().toDateString()
              const hasAnyActivity = scheduledClassesForDay.length > 0 || examsForDay.length > 0 || fixedScheduleForDay.length > 0
              
              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square p-0.5 sm:p-1 lg:p-2 rounded-md sm:rounded-lg lg:rounded-xl border-2 transition-all hover:shadow-md overflow-hidden ${
                    isToday 
                      ? 'border-primary bg-primary/10' 
                      : hasAnyActivity
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-background-secondary'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-semibold text-foreground mb-0.5 sm:mb-1">
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    {/* Mostrar clases programadas - versión móvil y desktop */}
                    {scheduledClassesForDay.slice(0, 1).map((cls) => (
                      <div key={`scheduled-container-${cls.id}`}>
                        {/* Versión móvil - punto más pequeño */}
                        <div
                          className="flex sm:hidden items-center justify-center"
                          title={`Clase: ${cls.course_name || 'Sin curso'} - ${formatTime(cls.start_time)}`}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full shadow-sm"
                            style={{ backgroundColor: customColors.scheduled }}
                          ></div>
                        </div>
                        {/* Versión desktop - cartel completo con estética de horario fijo */}
                        <div
                          className="hidden sm:flex items-center px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-2 rounded-md sm:rounded-lg lg:rounded-xl shadow-sm transition-all duration-200 hover:scale-105 text-white border w-full max-w-full"
                          style={{ 
                            backgroundColor: customColors.scheduled,
                            borderColor: customColors.scheduled
                          }}
                          title={`Clase eventual: ${cls.course_name || 'Sin curso'} - ${formatTime(cls.start_time)}${cls.subject ? ` - ${cls.subject}` : ''}`}
                        >
                          <span className="text-xs font-medium truncate w-full">{formatTime(cls.start_time)}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Mostrar exámenes - versión móvil y desktop */}
                    {examsForDay.slice(0, 1).map((exam) => (
                      <div key={`exam-container-${exam.id}`}>
                        {/* Versión móvil - punto más pequeño */}
                        <div
                          className="flex sm:hidden items-center justify-center"
                          title={`Examen: ${exam.subject}${exam.exam_time ? ` - ${formatTime(exam.exam_time)}` : ''}`}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full shadow-sm"
                            style={{ backgroundColor: customColors.exams }}
                          ></div>
                        </div>
                        {/* Versión desktop - cartel completo */}
                        <div
                          className="hidden sm:block px-1 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm transition-all duration-200 hover:scale-105 text-white border w-full max-w-full"
                          style={{ 
                            backgroundColor: customColors.exams,
                            borderColor: customColors.exams
                          }}
                          title={`Examen: ${exam.subject}${exam.exam_time ? ` - ${formatTime(exam.exam_time)}` : ''}${exam.notes ? ` - ${exam.notes}` : ''}`}
                        >
                          <div className="text-xs font-bold truncate mb-0.5 w-full">
                            {exam.subject}
                          </div>
                          {exam.notes && (
                            <div className="text-xs text-white/80 truncate w-full">
                              {exam.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Mostrar horario fijo - versión móvil y desktop */}
                    {fixedScheduleForDay.slice(0, 1).map((schedule, index) => (
                      <div key={`schedule-container-${index}`}>
                        {/* Versión móvil - punto más pequeño */}
                        <div
                          className="flex sm:hidden items-center justify-center"
                          title={`Horario: ${schedule.subject} - ${formatTime(schedule.start_time)}`}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full shadow-sm"
                            style={{ backgroundColor: customColors.schedule }}
                          ></div>
                        </div>
                        {/* Versión desktop - cartel completo */}
                        <div
                          className="hidden sm:flex items-center px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-2 rounded-md sm:rounded-lg lg:rounded-xl shadow-sm transition-all duration-200 hover:scale-105 text-white border w-full max-w-full"
                          style={{ 
                            backgroundColor: customColors.schedule,
                            borderColor: customColors.schedule
                          }}
                          title={`Horario fijo: ${schedule.subject} - ${formatTime(schedule.start_time)}`}
                        >
                          <span className="text-xs font-medium truncate w-full">{formatTime(schedule.start_time)}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Contador de actividades adicionales */}
                    {hasAnyActivity && (scheduledClassesForDay.length + examsForDay.length + fixedScheduleForDay.length) > 3 && (
                      <div className="flex items-center justify-center px-1 sm:px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        +{(scheduledClassesForDay.length + examsForDay.length + fixedScheduleForDay.length) - 3} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Horario Fijo y Próximos Exámenes */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Leyenda de colores - Visible en todas las pantallas */}
          <div className="glass-effect rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-border">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">Leyenda</h3>
              <button
                onClick={() => setShowColorConfig(!showColorConfig)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-primary text-white rounded-md sm:rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                Config
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: customColors.exams }}
                ></div>
                <span className="text-foreground-secondary">Exámenes</span>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: customColors.schedule }}
                ></div>
                <span className="text-foreground-secondary">Horario fijo</span>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: customColors.scheduled }}
                ></div>
                <span className="text-foreground-secondary">Clases programadas</span>
              </div>
            </div>

            {/* Panel de configuración de colores */}
            {showColorConfig && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-xs text-foreground-secondary text-center">Exámenes</span>
                    <input
                      type="color"
                      value={customColors.exams}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, exams: e.target.value }))}
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded border border-border cursor-pointer hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-xs text-foreground-secondary text-center">Horario fijo</span>
                    <input
                      type="color"
                      value={customColors.schedule}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, schedule: e.target.value }))}
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded border border-border cursor-pointer hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-xs text-foreground-secondary text-center">Clases programadas</span>
                    <input
                      type="color"
                      value={customColors.scheduled}
                      onChange={(e) => setCustomColors(prev => ({ ...prev, scheduled: e.target.value }))}
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded border border-border cursor-pointer hover:scale-105 transition-transform"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Próximos Eventos */}
          {(fixedScheduleNext7Days.length > 0 || scheduledClassesNext7Days.length > 0 || examsNext7Days.length > 0) && (
            <div className="glass-effect rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 border border-border">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6 flex items-center">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-md sm:rounded-lg mr-2 sm:mr-3">
                  <Book className="text-primary" size={16} />
                </div>
                <span className="hidden xs:inline">Próximos eventos</span>
                <span className="xs:hidden">Eventos</span>
              </h2>
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {/* Horario Fijo */}
                {fixedScheduleNext7Days.map((schedule, index) => (
                  <div
                    key={`fixed-${index}`}
                    className="group p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-student-primary/5 to-student-primary/10 rounded-xl sm:rounded-2xl border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm lg:text-base font-bold text-foreground">
                        {daysOfWeek[schedule.day_of_week - 1]}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-blue-200">
                        Fijo
                      </span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm lg:text-base text-foreground-secondary">
                      <div className="p-1 sm:p-1.5 bg-primary/20 rounded-md sm:rounded-lg mr-2 sm:mr-3">
                        <Clock size={12} className="text-primary" />
                      </div>
                      <span className="font-semibold">{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                    </div>
                  </div>
                ))}
                
                {/* Clases Programadas/Eventuales */}
                {scheduledClassesNext7Days.slice(0, 5).map((cls) => (
                  <div
                    key={`scheduled-${cls.id}`}
                    className="group p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-student-primary/5 to-student-primary/10 rounded-xl sm:rounded-2xl border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm lg:text-base font-bold text-foreground">
                        {new Date(cls.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-blue-200">
                        Programada
                      </span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm lg:text-base text-foreground-secondary">
                      <div className="p-1 sm:p-1.5 bg-primary/20 rounded-md sm:rounded-lg mr-2 sm:mr-3">
                        <Clock size={12} className="text-primary" />
                      </div>
                      <span className="font-semibold">{formatTime(cls.start_time)} - {formatTime(cls.end_time)}</span>
                    </div>
                    {cls.subject && (
                      <div className="mt-1.5 sm:mt-2 text-xs text-foreground-secondary">
                        <span className="font-medium">Materia:</span> {cls.subject}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Exámenes */}
                {examsNext7Days.slice(0, 5).map((exam) => (
                  <div
                    key={`exam-${exam.id}`}
                    className="group p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-student-primary/5 to-student-primary/10 rounded-xl sm:rounded-2xl border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{ 
                      borderColor: customColors.exams + '40' // 40 = 25% opacity
                    }}
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm lg:text-base font-bold text-foreground">
                        {new Date(exam.exam_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span 
                        className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border"
                        style={{
                          backgroundColor: customColors.exams + '20',
                          color: customColors.exams,
                          borderColor: customColors.exams + '40'
                        }}
                      >
                        Examen
                      </span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm lg:text-base text-foreground-secondary">
                      <div 
                        className="p-1 sm:p-1.5 rounded-md sm:rounded-lg mr-2 sm:mr-3"
                        style={{ backgroundColor: customColors.exams + '20' }}
                      >
                        <BookOpen size={12} style={{ color: customColors.exams }} />
                      </div>
                      <span className="font-semibold">{exam.subject}</span>
                    </div>
                    {exam.notes && (
                      <div className="flex items-center text-xs sm:text-sm text-foreground-secondary mt-1.5 sm:mt-2">
                        <div 
                          className="p-1 sm:p-1.5 rounded-md sm:rounded-lg mr-2 sm:mr-3"
                          style={{ backgroundColor: customColors.exams + '20' }}
                        >
                          <BookOpen size={12} style={{ color: customColors.exams }} />
                        </div>
                        <span className="font-semibold">{exam.notes}</span>
                      </div>
                    )}
                    {exam.exam_time && (
                      <div className="mt-1.5 sm:mt-2 text-xs text-foreground-secondary">
                        <span className="font-medium">Hora:</span> {formatTime(exam.exam_time)}
                      </div>
                    )}
                    {exam.grade && (
                      <div className="flex items-center mt-1.5 sm:mt-2 text-xs sm:text-sm bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-yellow-200 w-fit">
                        <Star size={12} className="mr-1 text-yellow-600" />
                        <span className="font-bold text-yellow-700">
                          {exam.grade}/10
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Mensaje si no hay eventos */}
                {fixedScheduleNext7Days.length === 0 && scheduledClassesNext7Days.length === 0 && examsNext7Days.length === 0 && (
                  <div className="text-center py-4 sm:py-6 lg:py-8">
                    <div className="p-2 sm:p-3 lg:p-4 bg-primary/5 rounded-xl sm:rounded-2xl inline-block mb-3 sm:mb-4">
                      <Book size={24} className="text-primary/50" />
                    </div>
                    <p className="text-foreground-muted text-xs sm:text-sm">
                      No tienes eventos en los próximos 7 días
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Próximos Exámenes */}
          <div className="glass-effect rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground flex items-center">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-md sm:rounded-lg mr-2 sm:mr-3">
                  <BookOpen className="text-primary" size={16} />
                </div>
                <span className="hidden xs:inline">Exámenes</span>
                <span className="xs:hidden">Exámenes</span>
              </h2>
              <button
                onClick={() => setShowExamManager(true)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs bg-primary text-white rounded-md sm:rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                Gestionar
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {exams.slice(0, 5).map((exam) => (
                <div
                  key={exam.id}
                  className="group p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-student-primary/5 to-student-primary/10 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 sm:mb-3 space-y-1.5 sm:space-y-0">
                    <div className="flex-1">
                      <div className="text-xs sm:text-sm lg:text-base font-bold text-foreground mb-1">
                        {exam.subject}
                      </div>
                      {exam.notes && (
                        <div className="text-xs sm:text-sm text-foreground-secondary mb-1.5 sm:mb-2">
                          <span className="font-medium">Tema:</span> {exam.notes}
                        </div>
                      )}
                    </div>
                    {exam.grade && (
                      <div className="flex items-center text-xs sm:text-sm bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-yellow-200">
                        <Star size={12} className="mr-1 text-yellow-600" />
                        <span className="font-bold text-yellow-700">
                          {exam.grade}/10
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-xs sm:text-sm lg:text-base text-foreground-secondary">
                    <div className="p-1 sm:p-1.5 bg-primary/20 rounded-md sm:rounded-lg mr-2 sm:mr-3">
                      <CalendarIcon size={12} className="text-primary" />
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
                        <div className="p-1 sm:p-1.5 bg-primary/20 rounded-md sm:rounded-lg mx-2 sm:mx-3">
                          <Clock size={12} className="text-primary" />
                        </div>
                        <span className="font-semibold">{formatTime(exam.exam_time)}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="text-center py-4 sm:py-6 lg:py-8">
                  <div className="p-2 sm:p-3 lg:p-4 bg-primary/5 rounded-xl sm:rounded-2xl inline-block mb-3 sm:mb-4">
                    <BookOpen size={24} className="text-primary/50" />
                  </div>
                  <p className="text-foreground-muted text-xs sm:text-sm mb-3 sm:mb-4">
                    No tienes exámenes registrados
                  </p>
                  <button
                    onClick={() => setShowExamManager(true)}
                    className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-md sm:rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
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