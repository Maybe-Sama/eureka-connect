'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getDayName, getTimeSlots } from '@/lib/utils'
import { ColorConfigPanel } from './ColorConfigPanel'
import { Palette } from 'lucide-react'

interface FixedScheduleItem {
  student_id: number
  student_name: string
  course_name: string
  course_color: string
  day_of_week: number
  start_time: string
  end_time: string
  subject: string | null
  is_scheduled: boolean
  class_id?: number
  class_date?: string
  students?: {
    first_name: string
    last_name: string
    email: string
  }
  courses?: {
    name: string
    color: string
  }
}

interface ScheduledClassItem {
  id: number
  student_id: number
  student_name: string
  course_name: string
  course_color: string
  day_of_week: number
  start_time: string
  end_time: string
  duration: number
  subject: string | null
  date: string
  price: number
  is_recurring: boolean
  students?: {
    first_name: string
    last_name: string
    email: string
  }
  courses?: {
    name: string
    color: string
  }
}

interface WeeklyCalendarProps {
  weekDates: Date[]
  fixedSchedules: FixedScheduleItem[]
  scheduledClasses: ScheduledClassItem[]
  students: any[]
  hiddenFixedSchedules?: Set<string>
  onTimeSlotClick: (day: number, time: string) => void
  onClassClick: (classItem: ScheduledClassItem) => void
  onFixedScheduleClick: (fixedSchedule: FixedScheduleItem) => void
}

export const WeeklyCalendar = ({ 
  weekDates, 
  fixedSchedules,
  scheduledClasses,
  students,
  hiddenFixedSchedules = new Set(),
  onTimeSlotClick, 
  onClassClick,
  onFixedScheduleClick
}: WeeklyCalendarProps) => {
  const timeSlots = getTimeSlots()
  const [isColorPanelOpen, setIsColorPanelOpen] = useState(false)
  const [studentColors, setStudentColors] = useState<Record<number, string>>({})

  // Cargar colores guardados del localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem('studentColors')
    if (savedColors) {
      setStudentColors(JSON.parse(savedColors))
    }
  }, [])

  // Función para calcular el número de franjas que ocupa una clase (ahora 15 minutos por franja)
  const calculateTimeSlots = (startTime: string, endTime: string) => {
    const timeToMinutes = (timeStr: string) => {
      const cleanTime = timeStr.split(':').slice(0, 2).join(':')
      const [hours, minutes] = cleanTime.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const durationMinutes = endMinutes - startMinutes
    
    // Cada franja es de 15 minutos
    return Math.ceil(durationMinutes / 15)
  }

  // Función para obtener el índice de la franja de tiempo
  const getTimeSlotIndex = (time: string) => {
    return timeSlots.indexOf(time)
  }

  // Función para verificar si una franja es la primera de un bloque
  const isFirstTimeSlot = (day: number, time: string, item: any) => {
    if (!item) return false
    
    const timeSlotIndex = getTimeSlotIndex(time)
    if (timeSlotIndex === 0) return true
    
    // Verificar si la franja anterior tiene el mismo item
    const previousTime = timeSlots[timeSlotIndex - 1]
    const previousItem = getItemAtTime(day, previousTime, weekDates)
    
    if (!previousItem) return true
    
    // Comparar por student_id y tipo
    return !(
      previousItem.data.student_id === item.data.student_id &&
      previousItem.type === item.type
    )
  }

  // Función para verificar si una franja es la última de un bloque
  const isLastTimeSlot = (day: number, time: string, item: any) => {
    if (!item) return false
    
    const timeSlotIndex = getTimeSlotIndex(time)
    const nextTime = timeSlots[timeSlotIndex + 1]
    
    if (!nextTime) return true
    
    const nextItem = getItemAtTime(day, nextTime, weekDates)
    if (!nextItem) return true
    
    // Comparar por student_id y tipo
    return !(
      nextItem.data.student_id === item.data.student_id &&
      nextItem.type === item.type
    )
  }

  // Función para verificar si una franja es parte del medio de un bloque
  const isMiddleTimeSlot = (day: number, time: string, item: any) => {
    if (!item) return false
    return !isFirstTimeSlot(day, time, item) && !isLastTimeSlot(day, time, item)
  }

  // Función para generar un color único para cada alumno
  const getStudentColor = (studentId: number) => {
    // Si hay un color personalizado guardado, usarlo
    if (studentColors[studentId]) {
      return studentColors[studentId]
    }

    // Si no, usar colores por defecto
    const colors = [
      'bg-sky-100 border-sky-300 dark:bg-sky-900/20 dark:border-sky-700',
      'bg-lime-100 border-lime-300 dark:bg-lime-900/20 dark:border-lime-700',
      'bg-violet-100 border-violet-300 dark:bg-violet-900/20 dark:border-violet-700',
      'bg-fuchsia-100 border-fuchsia-300 dark:bg-fuchsia-900/20 dark:border-fuchsia-700',
      'bg-amber-100 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700',
      'bg-slate-100 border-slate-300 dark:bg-slate-900/20 dark:border-slate-700',
      'bg-rose-100 border-rose-300 dark:bg-rose-900/20 dark:border-rose-700',
      'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700',
      'bg-cyan-100 border-cyan-300 dark:bg-cyan-900/20 dark:border-cyan-700',
      'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700',
      'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700',
      'bg-pink-100 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700',
      'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700',
      'bg-teal-100 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700',
      'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700',
      'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700',
      'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700',
      'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700'
    ]
    
    // Usar el ID del alumno para seleccionar un color de manera consistente
    return colors[studentId % colors.length]
  }

  // Función para manejar cambios de color
  const handleColorChange = (studentId: number, color: string) => {
    setStudentColors(prev => ({
      ...prev,
      [studentId]: color
    }))
  }

  const getItemAtTime = (day: number, time: string, weekDates: Date[]) => {
    // Normalizar la hora para comparar (remover segundos si existen)
    const normalizedTime = time.split(':').slice(0, 2).join(':')
    
    // Convertir tiempo a minutos para comparación
    const timeToMinutes = (timeStr: string) => {
      // Remover segundos si existen y normalizar formato
      const cleanTime = timeStr.split(':').slice(0, 2).join(':')
      const [hours, minutes] = cleanTime.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const currentTimeMinutes = timeToMinutes(normalizedTime)
    
    // Obtener la fecha correspondiente al día de la semana
    const targetDate = weekDates[day - 1] // day es 1-7, array es 0-6
    const targetDateString = targetDate.toISOString().split('T')[0]
    
    
    
    // Buscar clase programada específica (is_recurring: false) que coincida con la fecha
    const scheduledClass = scheduledClasses.find(cls => {
      if (cls.day_of_week !== day) return false
      
      // Verificar que la fecha coincida
      const classDate = new Date(cls.date).toISOString().split('T')[0]
      if (classDate !== targetDateString) return false
      
      // Debug para verificar fechas
      if (scheduledClasses.length > 0 && day === 7) {
        console.log('Date comparison:')
        console.log('  Class date:', cls.date, '-> normalized:', classDate)
        console.log('  Target date:', targetDateString)
        console.log('  Dates match:', classDate === targetDateString)
      }
      
      const startMinutes = timeToMinutes(cls.start_time)
      const endMinutes = timeToMinutes(cls.end_time)
      
      // La clase programada debe estar activa en este slot de tiempo
      // Incluir el slot de tiempo donde termina la clase (<= en lugar de <)
      const isInTimeRange = currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes
      
      // Debug temporal para clases programadas
      if (scheduledClasses.length > 0 && day === 7) { // Solo para domingo (día 7)
        console.log('=== DEBUG SCHEDULED CLASS SEARCH ===')
        console.log('Searching for day:', day, 'time:', time, 'target date:', targetDateString)
        console.log('Class being checked:', {
          id: cls.id,
          student_name: cls.student_name,
          day_of_week: cls.day_of_week,
          date: cls.date,
          classDate: classDate,
          start_time: cls.start_time,
          end_time: cls.end_time,
          isInTimeRange: isInTimeRange
        })
        console.log('Time comparison:')
        console.log('  Current time:', time, '-> minutes:', currentTimeMinutes)
        console.log('  Class start:', cls.start_time, '-> minutes:', startMinutes)
        console.log('  Class end:', cls.end_time, '-> minutes:', endMinutes)
        console.log('  Is in range:', currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes)
      }
      
      return isInTimeRange
    })
    
    if (scheduledClass) {
      return { type: 'scheduled', data: scheduledClass }
    }
    
    // Buscar horario fijo (is_recurring: true) - estos no dependen de fecha específica
    const fixedSchedule = fixedSchedules.find(schedule => {
      if (schedule.day_of_week !== day) return false
      
      const startMinutes = timeToMinutes(schedule.start_time)
      const endMinutes = timeToMinutes(schedule.end_time)
      
      // El horario fijo debe estar activo en este slot de tiempo
      const isInTimeRange = currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes
      
      if (!isInTimeRange) return false
      
      // Verificar si la fecha actual es posterior o igual a la fecha de inicio del estudiante
      const student = students.find(s => s.id === schedule.student_id)
      if (student && student.start_date) {
        const studentStartDate = new Date(student.start_date)
        const currentDate = new Date(targetDateString)
        if (currentDate < studentStartDate) {
          return false // El estudiante aún no ha comenzado las clases
        }
      }
      
      // Verificar si este horario fijo está oculto para esta semana
      const weekStart = weekDates[0]
      const weekEnd = weekDates[6]
      const exceptionKey = `${schedule.student_id}-${schedule.day_of_week}-${schedule.start_time}-${weekStart.toISOString().split('T')[0]}-${weekEnd.toISOString().split('T')[0]}`
      
      if (hiddenFixedSchedules.has(exceptionKey)) {
        return false // Este horario fijo está oculto para esta semana
      }
      
      return true
    })
    
    if (fixedSchedule) {
      return { type: 'fixed', data: fixedSchedule }
    }
    
    return null
  }

  // Función para determinar si mostrar la etiqueta de hora (todas las marcas de cuarto de hora)
  const shouldShowHourLabel = (time: string) => {
    return time.endsWith(':00') || time.endsWith(':15') || time.endsWith(':30') || time.endsWith(':45')
  }

  // Función para obtener la hora a mostrar entre filas
  const getHourLabel = (time: string) => {
    return time
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header con botón de configuración */}
        <div className="mb-4">
          <div className="grid grid-cols-8 gap-1">
            {/* Botón de configuración de colores en la primera columna */}
            <div className="h-12 flex items-center justify-center">
              <button
                onClick={() => setIsColorPanelOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                title="Configurar colores de alumnos"
              >
                <Palette className="w-4 h-4" />
                <span className="text-sm font-medium">Colores</span>
              </button>
            </div>
            {weekDates.map((date, index) => (
              <div key={index} className="h-12 flex items-center justify-center text-sm font-medium text-foreground bg-background/40 rounded-lg border border-gray-200/40">
                <div className="text-center">
                  <div className="font-semibold">{getDayName(date.getDay()).slice(0, 3)}</div>
                  <div className="text-xs text-foreground-muted">{date.getDate()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time slots con horas en las celdas */}
        <div className="relative">
          {timeSlots.map((time, index) => {
            const isHourMark = shouldShowHourLabel(time)
            const nextTime = timeSlots[index + 1]
            
            return (
              <div key={time}>
                {/* Fila de franjas de tiempo */}
                <div className="grid grid-cols-8 gap-1 mb-0">
                  <div className="h-8 flex items-center justify-center bg-background/50 rounded-lg border border-gray-200/50">
                    {/* Hora centrada en la celda */}
                    {isHourMark && (
                      <span className="text-xs font-semibold text-primary">
                        {getHourLabel(time)}
                      </span>
                    )}
                  </div>
                  {weekDates.map((date, dayIndex) => {
                    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
                    const item = getItemAtTime(dayOfWeek, time, weekDates)
                    const isFirstSlot = isFirstTimeSlot(dayOfWeek, time, item)
                    const isLastSlot = isLastTimeSlot(dayOfWeek, time, item)
                    const isMiddleSlot = isMiddleTimeSlot(dayOfWeek, time, item)
                    
                    return (
                      <div
                        key={`${dayIndex}-${time}`}
                        className={`h-8 cursor-pointer transition-all duration-200 relative ${
                          item 
                            ? item.type === 'scheduled'
                              ? getStudentColor(item.data.student_id)
                              : getStudentColor(item.data.student_id)
                            : 'bg-background/30 hover:bg-background/50 border border-gray-200/50'
                        } ${
                          isFirstSlot ? 'rounded-t-lg border-t-2 border-l-2 border-r-2 border-gray-300/60' : ''
                        } ${
                          isLastSlot ? 'rounded-b-lg border-b-2 border-l-2 border-r-2 border-gray-300/60' : ''
                        } ${
                          isMiddleSlot ? 'rounded-none border-l-2 border-r-2 border-gray-300/60' : ''
                        } ${
                          !isFirstSlot && !isLastSlot && !isMiddleSlot ? 'rounded-lg border-2 border-gray-300/60' : ''
                        } ${
                          !item ? 'border-t border-gray-200/40' : ''
                        }`}
                        onClick={() => {
                          if (item) {
                            // Si hay una clase en esta franja, abrir el modal correspondiente
                            if (item.type === 'scheduled') {
                              onClassClick(item.data as ScheduledClassItem)
                            } else {
                              onFixedScheduleClick(item.data as FixedScheduleItem)
                            }
                          } else {
                            // Si no hay clase, abrir modal para agregar nueva clase
                            onTimeSlotClick(dayOfWeek, time)
                          }
                        }}
                      >
                        {/* Línea separadora sutil para cada cuarto de hora */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gray-200/30"></div>
                        
                        {item && isFirstSlot && (
                          <div 
                            className="absolute inset-0 p-2 flex flex-col justify-center overflow-hidden rounded-lg border-2 border-gray-300/60"
                            style={{
                              height: `${calculateTimeSlots(item.data.start_time, item.data.end_time) * 32}px`, // 32px por tramo de 15 min
                              zIndex: 10
                            }}
                          >
                            <div className="text-[11px] font-semibold text-black leading-tight flex items-center gap-1 mb-1">
                              <span>{item.type === 'scheduled' ? '📅' : '🔄'}</span>
                              <span className="truncate">
                                {item.data.student_name || (item.data.students ? `${item.data.students.first_name || ''} ${item.data.students.last_name || ''}`.trim() : 'Sin nombre')}
                              </span>
                            </div>
                            <div className="text-[10px] font-medium text-black truncate mb-1">
                              {item.data.course_name || (item.data.courses ? item.data.courses.name : 'Sin curso')}
                            </div>
                            <div className="text-[9px] text-black truncate mb-1">
                              {item.data.subject || 'Sin asignatura'}
                            </div>
                            <div className="text-[8px] text-black font-medium">
                              {item.data.start_time} - {item.data.end_time}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Panel de configuración de colores */}
      <ColorConfigPanel
        isOpen={isColorPanelOpen}
        onClose={() => setIsColorPanelOpen(false)}
        students={students}
        onColorChange={handleColorChange}
      />
    </div>
  )
}


