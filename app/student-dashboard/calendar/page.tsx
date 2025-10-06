'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentLayout from '@/components/layout/student-layout'
import { Calendar as CalendarIcon, Clock, Book, ChevronLeft, ChevronRight } from 'lucide-react'

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

export default function StudentCalendarPage() {
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [fixedSchedule, setFixedSchedule] = useState<FixedSchedule[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

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
                const isToday = day.toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all hover:shadow-md ${
                      isToday 
                        ? 'border-primary bg-primary/10' 
                        : classesForDay.length > 0
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-background-secondary'
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {classesForDay.slice(0, 2).map((cls) => (
                        <div
                          key={cls.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(cls.status)}`}
                          title={`${cls.start_time} - ${getStatusText(cls.status)}`}
                        >
                          {cls.start_time}
                        </div>
                      ))}
                      {classesForDay.length > 2 && (
                        <div className="text-xs text-foreground-muted">
                          +{classesForDay.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Horario Fijo y Próximas Clases */}
          <div className="space-y-6">
            {/* Horario Fijo */}
            {fixedSchedule.length > 0 && (
              <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <Book className="mr-2 text-primary" size={20} />
                  Horario Fijo
                </h2>
                <div className="space-y-3">
                  {fixedSchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className="p-3 bg-primary/10 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {daysOfWeek[schedule.day_of_week]}
                        </span>
                        <span className="text-xs text-foreground-secondary">
                          {schedule.subject}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-foreground-secondary">
                        <Clock size={14} className="mr-1" />
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximas Clases */}
            <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <CalendarIcon className="mr-2 text-primary" size={20} />
                Próximas Clases
              </h2>
              <div className="space-y-3">
                {classes.slice(0, 5).map((cls) => (
                  <div
                    key={cls.id}
                    className={`p-3 rounded-lg border-2 ${getStatusColor(cls.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {new Date(cls.date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="text-xs font-medium">
                        {getStatusText(cls.status)}
                      </span>
                    </div>
                      <div className="flex items-center text-sm">
                      <Clock size={14} className="mr-1" />
                      {cls.start_time} - {cls.end_time}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">
                      Duración: {cls.duration} min
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <p className="text-foreground-muted text-sm text-center py-4">
                    No hay clases programadas para este mes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}


