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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: number; time: string; date?: string } | undefined>(undefined)
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
    } else {
      localStorage.removeItem('hiddenFixedSchedules')
    }
  }, [hiddenFixedSchedules])

  // Función para debuggear clases programadas
  const debugScheduledClasses = () => {
    // Debug function - logs removed for production
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
        
        
        
        // CAMBIO CRÍTICO: Ya no separamos en "fixedSchedules" y "scheduledClasses"
        // TODAS las clases se muestran directamente desde la BD con su fecha específica
        setScheduledClasses(classesData)
        setCourses(coursesData)
        setStudents(studentsData)
        
        // No generamos "plantillas" de horarios fijos
        // Las clases recurrentes ya están en la BD con fechas específicas
        setFixedSchedules([])
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
  }

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev)
      newWeek.setDate(prev.getDate() + 7)
      return newWeek
    })
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const restoreAllFixedSchedules = () => {
    const currentWeekKey = getCurrentWeekKey(currentWeek)
    const currentWeekExceptions = hiddenFixedSchedules[currentWeekKey] || new Set()
    
    if (currentWeekExceptions.size === 0) {
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
    // Obtener la fecha real correspondiente al día de la semana
    const weekDates = getWeekDates()
    const selectedDate = weekDates[day] || weekDates[0]
    setSelectedTimeSlot({ day, time, date: selectedDate.toISOString().split('T')[0] })
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
        setIsAddModalOpen(false)
        setSelectedTimeSlot(undefined)
        
        // Refresh classes - obtener todas las clases actualizadas de la BD
        const classesResponse = await fetch('/api/classes')
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setScheduledClasses(classesData)
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
      
      // SIMPLIFICADO: Todas las clases se actualizan directamente en la BD
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
        // Refresh classes - obtener todas las clases actualizadas de la BD
        const classesResponse = await fetch('/api/classes')
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setScheduledClasses(classesData)
        }
        
        toast.success('Clase actualizada correctamente')
      } else {
        const errorData = await response.json()
        
        if (errorData.code === '23505' || errorData.message?.includes('duplicate key')) {
          throw new Error('Ya existe una clase programada para este estudiante en la misma fecha y horario')
        }
        
        throw new Error(errorData.error || 'Error al actualizar la clase')
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
      
      // SIMPLIFICADO: Todas las clases tienen un ID y se eliminan directamente de la BD
      const response = await fetch(`/api/classes?ids=${selectedClass.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        
        // Refresh classes - obtener todas las clases actualizadas de la BD
        const classesResponse = await fetch('/api/classes')
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setScheduledClasses(classesData)
        }
        
        toast.success('Clase eliminada permanentemente de la base de datos')
      } else {
        const errorData = await response.json()
        console.error('Error al eliminar clase:', errorData)
        toast.error(`Error: ${errorData.error || 'Error al eliminar la clase'}`)
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
              Semana
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
