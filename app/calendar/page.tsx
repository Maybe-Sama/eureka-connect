'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar'
import { AddClassModal } from '@/components/calendar/AddClassModal'
import { DeleteClassModal } from '@/components/calendar/DeleteClassModal'
import { EditOrDeleteModal } from '@/components/calendar/EditOrDeleteModal'
import { EditClassModal } from '@/components/calendar/EditClassModal'
import { Class, Student } from '@/types'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'
// Removed direct database import - using API routes instead

const CalendarPage = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: number; time: string } | undefined>(undefined)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditOrDeleteModalOpen, setIsEditOrDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [fixedSchedules, setFixedSchedules] = useState<any[]>([])
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hiddenFixedSchedules, setHiddenFixedSchedules] = useState<Record<string, Set<string>>>({})

  // Función para obtener la clave de la semana actual
  const getCurrentWeekKey = (weekDate: Date) => {
    const startOfWeek = new Date(weekDate)
    // Use the same logic as getWeekDates to ensure consistency
    const dayOfWeek = weekDate.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startOfWeek.setDate(weekDate.getDate() - daysToSubtract)
    return startOfWeek.toISOString().split('T')[0]
  }

  // Cargar excepciones guardadas al inicializar
  useEffect(() => {
    const savedExceptions = localStorage.getItem('hiddenFixedSchedules')
    if (savedExceptions) {
      try {
        const parsed = JSON.parse(savedExceptions)
        // Convertir array de arrays a Record<string, Set<string>>
        const exceptionsByWeek: Record<string, Set<string>> = {}
        Object.entries(parsed).forEach(([week, exceptions]) => {
          exceptionsByWeek[week] = new Set(exceptions as string[])
        })
        setHiddenFixedSchedules(exceptionsByWeek)
        console.log('Excepciones cargadas desde localStorage:', Object.keys(exceptionsByWeek).length, 'semanas')
      } catch (error) {
        console.error('Error cargando excepciones:', error)
        setHiddenFixedSchedules({})
      }
    }
  }, [])

  // Guardar excepciones en localStorage cuando cambien
  useEffect(() => {
    if (Object.keys(hiddenFixedSchedules).length > 0) {
      // Convertir Sets a arrays para JSON
      const exceptionsToSave: Record<string, string[]> = {}
      Object.entries(hiddenFixedSchedules).forEach(([week, exceptions]) => {
        exceptionsToSave[week] = Array.from(exceptions)
      })
      localStorage.setItem('hiddenFixedSchedules', JSON.stringify(exceptionsToSave))
      console.log('Excepciones guardadas en localStorage:', Object.keys(exceptionsToSave).length, 'semanas')
    } else {
      localStorage.removeItem('hiddenFixedSchedules')
      console.log('Excepciones eliminadas de localStorage')
    }
  }, [hiddenFixedSchedules])

  // Función para debuggear clases programadas
  const debugScheduledClasses = () => {
    console.log('=== DEBUG SCHEDULED CLASSES ===')
    console.log('Scheduled classes state:', scheduledClasses)
    console.log('Week dates:', getWeekDates())
    
    console.log('--- CLASES EN ESTADO DEL COMPONENTE ---')
    scheduledClasses.forEach((cls: any, index: number) => {
      console.log(`Class ${index + 1}:`, {
        id: cls.id,
        student_name: cls.student_name,
        date: cls.date,
        day_of_week: cls.day_of_week,
        start_time: cls.start_time,
        end_time: cls.end_time,
        is_recurring: cls.is_recurring
      })
    })
    
    console.log('--- CLASES EN LOCALSTORAGE (DEBUG) ---')
    const debugClasses = JSON.parse(localStorage.getItem('debugClasses') || '[]')
    debugClasses.forEach((cls: any, index: number) => {
      console.log(`Debug Class ${index + 1}:`, {
        id: cls.id,
        student_id: cls.student_id,
        date: cls.date,
        day_of_week: cls.day_of_week,
        start_time: cls.start_time,
        end_time: cls.end_time,
        is_recurring: cls.is_recurring,
        created_at: cls.created_at
      })
    })
  }

  // Fetch data from API routes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [classesResponse, coursesResponse, studentsResponse] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/courses'),
          fetch('/api/students')
        ])
        
        if (!classesResponse.ok || !coursesResponse.ok || !studentsResponse.ok) {
          throw new Error('Error fetching data from API')
        }
        
        const [classesData, coursesData, studentsData] = await Promise.all([
          classesResponse.json(),
          coursesResponse.json(),
          studentsResponse.json()
        ])
        
        // Separar clases fijas (is_recurring: true) de clases programadas (is_recurring: false)
        const fixedClasses = classesData.filter((cls: any) => cls.is_recurring)
        const scheduledClassesData = classesData.filter((cls: any) => !cls.is_recurring)
        
        // Debug temporal para ver qué datos llegan
        console.log('=== DEBUG API DATA ===')
        console.log('Total classes from API:', classesData.length)
        console.log('Fixed classes (recurring):', fixedClasses.length)
        console.log('Scheduled classes (non-recurring):', scheduledClassesData.length)
        
        if (scheduledClassesData.length > 0) {
          console.log('First scheduled class:', scheduledClassesData[0])
        }
        
        setScheduledClasses(scheduledClassesData)
        setCourses(coursesData)
        setStudents(studentsData)
        
        // Generate fixed schedules from recurring classes only
        const fixedSchedulesData = fixedClasses.map((cls: any) => ({
          student_id: cls.student_id,
          student_name: cls.student_name,
          course_name: cls.course_name,
          course_color: cls.course_color,
          day_of_week: cls.day_of_week,
          start_time: cls.start_time,
          end_time: cls.end_time,
          subject: cls.subject,
          is_scheduled: true
        }))
        
        setFixedSchedules(fixedSchedulesData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev)
      newWeek.setDate(prev.getDate() - 7)
      return newWeek
    })
    console.log('Cambio a semana anterior')
  }

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev)
      newWeek.setDate(prev.getDate() + 7)
      return newWeek
    })
    console.log('Cambio a semana siguiente')
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
    console.log('Ir a hoy')
  }

  const restoreAllFixedSchedules = () => {
    console.log('=== RESTAURAR HORARIOS FIJOS ===')
    const currentWeekKey = getCurrentWeekKey(currentWeek)
    const currentWeekExceptions = hiddenFixedSchedules[currentWeekKey] || new Set()
    
    console.log('Horarios fijos ocultos en esta semana:', currentWeekExceptions.size)
    console.log('Lista de horarios ocultos en esta semana:', Array.from(currentWeekExceptions))
    
    if (currentWeekExceptions.size === 0) {
      console.log('No hay horarios fijos ocultos en esta semana para restaurar')
      toast.info('No hay horarios fijos ocultos en esta semana para restaurar')
      return
    }
    
    const countToRestore = currentWeekExceptions.size
    
    // Limpiar solo las excepciones de la semana actual
    setHiddenFixedSchedules(prev => {
      const newExceptions = { ...prev }
      delete newExceptions[currentWeekKey]
      return newExceptions
    })
    
    console.log('Horarios fijos ocultos en esta semana después: 0')
    console.log('=== RESTAURACIÓN COMPLETADA ===')
    
    toast.success(`Restaurados ${countToRestore} horarios fijos de esta semana`)
  }

  const getWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(currentWeek)
    // Calculate the start of the week that contains the current date
    // If currentWeek is Sunday (0), we want the week that starts on Monday of the previous week
    // If currentWeek is Monday (1), we want the week that starts on Monday of the current week
    const dayOfWeek = currentWeek.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 0, so subtract 6 to get to Monday of previous week
    startOfWeek.setDate(currentWeek.getDate() - daysToSubtract)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const getClassesForDate = (date: Date) => {
    return scheduledClasses.filter(cls => {
      const classDate = new Date(cls.date)
      return classDate.toDateString() === date.toDateString()
    })
  }

  const handleTimeSlotClick = (day: number, time: string) => {
    setSelectedTimeSlot({ day, time })
    setIsAddModalOpen(true)
  }

  const handleClassClick = (classItem: any) => {
    setSelectedClass(classItem)
    setIsEditOrDeleteModalOpen(true)
  }

  const handleFixedScheduleClick = (fixedSchedule: any) => {
    // Find course_id from the course_name
    const course = courses.find(c => c.name === fixedSchedule.course_name)
    const courseId = course?.id
    
    // Convertir fixedSchedule a formato de clase para usar el modal de borrado
    const classItem = {
      id: fixedSchedule.class_id || 0,
      student_id: fixedSchedule.student_id,
      course_id: courseId, // Add course_id
      student_name: fixedSchedule.student_name,
      course_name: fixedSchedule.course_name,
      course_color: fixedSchedule.course_color,
      day_of_week: fixedSchedule.day_of_week,
      start_time: fixedSchedule.start_time,
      end_time: fixedSchedule.end_time,
      subject: fixedSchedule.subject,
      date: new Date().toISOString().split('T')[0], // Fecha actual como placeholder
      price: 0, // Se calculará si es necesario
      is_recurring: true
    }
    setSelectedClass(classItem)
    setIsEditOrDeleteModalOpen(true)
  }

  const handleEditClass = () => {
    setIsEditOrDeleteModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleDeleteClassAction = () => {
    setIsEditOrDeleteModalOpen(false)
    setIsDeleteModalOpen(true)
  }

  const handleAddClass = async (newClass: any) => {
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClass),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Guardar en localStorage para debugging
        const debugClasses = JSON.parse(localStorage.getItem('debugClasses') || '[]')
        debugClasses.push({
          ...newClass,
          id: result.id,
          created_at: new Date().toISOString()
        })
        localStorage.setItem('debugClasses', JSON.stringify(debugClasses))
        
        // Refresh only scheduled classes (is_recurring: false)
        const classesResponse = await fetch('/api/classes')
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          const scheduledClassesData = classesData.filter((cls: any) => !cls.is_recurring)
          setScheduledClasses(scheduledClassesData)
        }
        toast.success('Clase programada agregada correctamente')
      } else {
        const errorData = await response.json()
        
        // Manejar error de duplicado específicamente
        if (errorData.code === '23505' || errorData.message?.includes('duplicate key')) {
          throw new Error('Ya existe una clase programada para este estudiante en la misma fecha y horario')
        }
        
        throw new Error(errorData.error || 'Error al agregar la clase')
      }
    } catch (error) {
      console.error('Error en handleAddClass:', error)
      toast.error('Error al crear la clase: ' + (error as Error).message)
      throw error
    }
  }

  const handleUpdateClass = async (updatedClass: any) => {
    try {
      setIsUpdating(true)
      
      if (selectedClass.is_recurring) {
        // Para horarios fijos, crear una nueva clase individual con los datos actualizados
        // y ocultar el horario fijo original para esta semana
        // Validate required fields
        if (!selectedClass.course_id) {
          throw new Error('No se pudo encontrar el curso del estudiante')
        }
        
        const newClassData = {
          student_id: selectedClass.student_id,
          course_id: selectedClass.course_id,
          start_time: updatedClass.start_time,
          end_time: updatedClass.end_time,
          duration: updatedClass.duration,
          day_of_week: updatedClass.day_of_week,
          date: updatedClass.date,
          subject: selectedClass.subject,
          is_recurring: false, // Nueva clase individual
          price: selectedClass.price || 0,
          notes: updatedClass.notes || `Clase modificada desde horario fijo - ${selectedClass.student_name}`
        }
        
        // Crear la nueva clase individual
        const response = await fetch('/api/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newClassData),
        })
        
        if (response.ok) {
          // Ocultar el horario fijo original para esta semana
          const weekStart = getWeekDates()[0]
          const weekEnd = getWeekDates()[6]
          const exceptionKey = `${selectedClass.student_id}-${selectedClass.day_of_week}-${selectedClass.start_time}-${weekStart.toISOString().split('T')[0]}-${weekEnd.toISOString().split('T')[0]}`
          const currentWeekKey = getCurrentWeekKey(currentWeek)
          
          setHiddenFixedSchedules(prev => ({
            ...prev,
            [currentWeekKey]: new Set([...Array.from(prev[currentWeekKey] || new Set()), exceptionKey])
          }))
          
          // Refresh classes data
          const classesResponse = await fetch('/api/classes')
          if (classesResponse.ok) {
            const classesData = await classesResponse.json()
            const scheduledClassesData = classesData.filter((cls: any) => !cls.is_recurring)
            setScheduledClasses(scheduledClassesData)
          }
          
          toast.success('Clase individual creada y horario fijo ocultado para esta semana')
        } else {
          const errorData = await response.json()
          
          if (errorData.code === '23505' || errorData.message?.includes('duplicate key')) {
            throw new Error('Ya existe una clase programada para este estudiante en la misma fecha y horario')
          }
          
          throw new Error(errorData.error || 'Error al crear la clase individual')
        }
      } else {
        // Para clases programadas, actualizar normalmente
        // Validate required fields for scheduled classes
        if (!selectedClass.course_id) {
          throw new Error('No se pudo encontrar el curso del estudiante')
        }
        
        const response = await fetch('/api/classes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedClass),
        })

        if (response.ok) {
          // Refresh classes data
          const classesResponse = await fetch('/api/classes')
          if (classesResponse.ok) {
            const classesData = await classesResponse.json()
            const scheduledClassesData = classesData.filter((cls: any) => !cls.is_recurring)
            setScheduledClasses(scheduledClassesData)
          }
          
          toast.success('Clase actualizada correctamente')
        } else {
          const errorData = await response.json()
          
          if (errorData.code === '23505' || errorData.message?.includes('duplicate key')) {
            throw new Error('Ya existe una clase programada para este estudiante en la misma fecha y horario')
          }
          
          throw new Error(errorData.error || 'Error al actualizar la clase')
        }
      }
      
      setIsEditModalOpen(false)
      setSelectedClass(null)
    } catch (error) {
      console.error('Error en handleUpdateClass:', error)
      toast.error('Error al actualizar la clase: ' + (error as Error).message)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return

    setIsDeleting(true)
    try {
      if (selectedClass.is_recurring) {
        // Para horarios fijos, crear una excepción para esta semana específica
        const weekStart = getWeekDates()[0]
        const weekEnd = getWeekDates()[6]
        const exceptionKey = `${selectedClass.student_id}-${selectedClass.day_of_week}-${selectedClass.start_time}-${weekStart.toISOString().split('T')[0]}-${weekEnd.toISOString().split('T')[0]}`
        const currentWeekKey = getCurrentWeekKey(currentWeek)
        
        // Agregar a la lista de horarios fijos ocultos para esta semana
        setHiddenFixedSchedules(prev => ({
          ...prev,
          [currentWeekKey]: new Set([...Array.from(prev[currentWeekKey] || new Set()), exceptionKey])
        }))
        
        toast.success('Horario fijo eliminado de esta semana')
      } else {
        // Para clases programadas, eliminar completamente
        const response = await fetch(`/api/classes?ids=${selectedClass.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Refresh classes
          const classesResponse = await fetch('/api/classes')
          if (classesResponse.ok) {
            const classesData = await classesResponse.json()
            const scheduledClassesData = classesData.filter((cls: any) => !cls.is_recurring)
            setScheduledClasses(scheduledClassesData)
          }
          toast.success('Clase programada eliminada correctamente')
        } else {
          const errorData = await response.json()
          toast.error(`Error: ${errorData.error || 'Error al eliminar la clase'}`)
        }
      }
      
      setIsDeleteModalOpen(false)
      setSelectedClass(null)
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Error al eliminar la clase')
    } finally {
      setIsDeleting(false)
    }
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-primary" />
              Calendario
            </h1>
            <p className="text-foreground-muted">
              Gestiona tus clases y horarios semanales
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={debugScheduledClasses}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-600/10 hover:text-blue-600"
            >
              Debug Clases
            </Button>
            <Button
              onClick={restoreAllFixedSchedules}
              variant="outline"
              size="sm"
              className="text-warning border-warning hover:bg-warning/10 hover:text-warning"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar Horarios Fijos
              {(hiddenFixedSchedules[getCurrentWeekKey(currentWeek)]?.size || 0) > 0 && (
                <span className="ml-2 px-2 py-1 bg-warning/20 text-warning text-xs rounded-full">
                  {hiddenFixedSchedules[getCurrentWeekKey(currentWeek)]?.size || 0}
                </span>
              )}
            </Button>
            
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSelectedTimeSlot(undefined)
                setIsAddModalOpen(true)
              }}
              className="bg-gradient-to-r from-primary to-accent"
              type="button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Clase
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={goToPreviousWeek}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
            >
              Hoy
            </Button>
            
            <Button
              onClick={goToNextWeek}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {currentWeek.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
            <p className="text-sm text-foreground-muted">
              Semana del {getWeekDates()[0].toLocaleDateString('es-ES')} al {getWeekDates()[6].toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Calendar */}
      <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-effect rounded-xl p-6"
      >
        <WeeklyCalendar
          weekDates={getWeekDates()}
          fixedSchedules={fixedSchedules}
          scheduledClasses={scheduledClasses}
          students={students}
          hiddenFixedSchedules={hiddenFixedSchedules[getCurrentWeekKey(currentWeek)] || new Set()}
          onTimeSlotClick={handleTimeSlotClick}
          onClassClick={handleClassClick}
          onFixedScheduleClick={handleFixedScheduleClick}
        />
      </motion.div>

      {/* Modals */}
      <div>
      <AddClassModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
        }}
        onSave={async (classData) => {
          try {
            await handleAddClass(classData)
            setIsAddModalOpen(false)
          } catch (error) {
            // El error ya se maneja en handleAddClass
          }
        }}
        students={students}
        selectedTimeSlot={selectedTimeSlot}
      />
      
      <EditOrDeleteModal
        isOpen={isEditOrDeleteModalOpen}
        onClose={() => {
          setIsEditOrDeleteModalOpen(false)
          setSelectedClass(null)
        }}
        onEdit={handleEditClass}
        onDelete={handleDeleteClassAction}
        classItem={selectedClass}
      />
      
      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedClass(null)
        }}
        onSave={async (classData) => {
          try {
            await handleUpdateClass(classData)
          } catch (error) {
            // El error ya se maneja en handleUpdateClass
          }
        }}
        classItem={selectedClass}
      />
      
      <DeleteClassModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedClass(null)
        }}
        onConfirm={handleDeleteClass}
        classItem={selectedClass}
        isDeleting={isDeleting}
      />
      </div>
      </div>
    </div>
  )
}

export default CalendarPage
