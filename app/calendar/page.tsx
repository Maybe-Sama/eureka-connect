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
import { ClimbingBoxLoader } from '@/components/ui/ClimbingBoxLoader'
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar'
import { AddClassModal } from '@/components/calendar/AddClassModal'
import { DeleteClassModal } from '@/components/calendar/DeleteClassModal'
import { Class, Student } from '@/types'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import { dbOperations } from '@/lib/database'

const CalendarPage = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: number; time: string } | undefined>(undefined)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fixedSchedules, setFixedSchedules] = useState<any[]>([])
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hiddenFixedSchedules, setHiddenFixedSchedules] = useState<Set<string>>(new Set())

  // Cargar excepciones guardadas al inicializar
  useEffect(() => {
    const savedExceptions = localStorage.getItem('hiddenFixedSchedules')
    if (savedExceptions) {
      try {
        const parsed = JSON.parse(savedExceptions)
        setHiddenFixedSchedules(new Set(parsed))
        console.log('Excepciones cargadas desde localStorage:', parsed.length)
      } catch (error) {
        console.error('Error cargando excepciones:', error)
        setHiddenFixedSchedules(new Set())
      }
    }
  }, [])

  // Guardar excepciones en localStorage cuando cambien
  useEffect(() => {
    if (hiddenFixedSchedules.size > 0) {
      const exceptionsArray = Array.from(hiddenFixedSchedules)
      localStorage.setItem('hiddenFixedSchedules', JSON.stringify(exceptionsArray))
      console.log('Excepciones guardadas en localStorage:', exceptionsArray.length)
    } else {
      localStorage.removeItem('hiddenFixedSchedules')
      console.log('Excepciones eliminadas de localStorage')
    }
  }, [hiddenFixedSchedules])

  // Monitorear cambios en isAddModalOpen
  useEffect(() => {
    console.log('=== CAMBIO EN isAddModalOpen ===')
    console.log('isAddModalOpen:', isAddModalOpen)
    console.log('selectedTimeSlot:', selectedTimeSlot)
  }, [isAddModalOpen, selectedTimeSlot])

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [classesData, coursesData, studentsData] = await Promise.all([
          dbOperations.getAllClasses(),
          dbOperations.getAllCourses(),
          dbOperations.getAllStudents()
        ])
        
        // Separar clases fijas (is_recurring: true) de clases programadas (is_recurring: false)
        const fixedClasses = classesData.filter(cls => cls.is_recurring)
        const scheduledClassesData = classesData.filter((cls: any) => !cls.is_recurring)
        
        console.log('=== DEBUG Calendar Data Loading ===')
        console.log('All classes:', classesData)
        console.log('Fixed classes (is_recurring: true):', fixedClasses)
        console.log('Scheduled classes (is_recurring: false):', scheduledClassesData)
        
        
        setScheduledClasses(scheduledClassesData)
        setCourses(coursesData)
        setStudents(studentsData)
        
        // Generate fixed schedules from recurring classes only
        const fixedSchedulesData = fixedClasses.map(cls => ({
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
    // Limpiar excepciones al cambiar de semana
    setHiddenFixedSchedules(new Set())
    localStorage.removeItem('hiddenFixedSchedules')
    console.log('Cambio de semana: excepciones limpiadas')
  }

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev)
      newWeek.setDate(prev.getDate() + 7)
      return newWeek
    })
    // Limpiar excepciones al cambiar de semana
    setHiddenFixedSchedules(new Set())
    localStorage.removeItem('hiddenFixedSchedules')
    console.log('Cambio de semana: excepciones limpiadas')
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
    // Limpiar excepciones al cambiar de semana
    setHiddenFixedSchedules(new Set())
    localStorage.removeItem('hiddenFixedSchedules')
    console.log('Ir a hoy: excepciones limpiadas')
  }

  const restoreAllFixedSchedules = () => {
    console.log('=== RESTAURAR HORARIOS FIJOS ===')
    console.log('Horarios fijos ocultos antes:', hiddenFixedSchedules.size)
    console.log('Lista de horarios ocultos:', Array.from(hiddenFixedSchedules))
    
    if (hiddenFixedSchedules.size === 0) {
      console.log('No hay horarios fijos ocultos para restaurar')
      toast.info('No hay horarios fijos ocultos para restaurar')
      return
    }
    
    const countToRestore = hiddenFixedSchedules.size
    
    // Limpiar todas las excepciones
    setHiddenFixedSchedules(new Set())
    
    // También limpiar localStorage manualmente
    localStorage.removeItem('hiddenFixedSchedules')
    
    console.log('Horarios fijos ocultos después: 0')
    console.log('localStorage limpiado')
    console.log('=== RESTAURACIÓN COMPLETADA ===')
    
    toast.success(`Restaurados ${countToRestore} horarios fijos`)
  }

  const getWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(currentWeek)
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1)
    
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
    console.log('=== CLICK EN SLOT DE TIEMPO ===')
    console.log('Day:', day, 'Time:', time)
    setSelectedTimeSlot({ day, time })
    console.log('Abriendo modal de nueva clase...')
    setIsAddModalOpen(true)
    console.log('isAddModalOpen debería ser true')
  }

  const handleClassClick = (classItem: any) => {
    setSelectedClass(classItem)
    setIsDeleteModalOpen(true)
  }

  const handleFixedScheduleClick = (fixedSchedule: any) => {
    // Convertir fixedSchedule a formato de clase para usar el modal de borrado
    const classItem = {
      id: fixedSchedule.class_id || 0,
      student_id: fixedSchedule.student_id,
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
    setIsDeleteModalOpen(true)
  }

  const handleAddClass = async (newClass: any) => {
    console.log('Enviando clase a la API:', newClass)
    
    const response = await fetch('/api/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newClass),
    })

    console.log('Respuesta de la API:', response.status, response.ok)

    if (response.ok) {
      const result = await response.json()
      console.log('Resultado de creación:', result)
      
      // Refresh only scheduled classes (is_recurring: false)
      const classesResponse = await fetch('/api/classes')
      if (classesResponse.ok) {
        const classesData = await classesResponse.json()
        console.log('=== DEBUG After Class Creation ===')
        console.log('Todas las clases después de crear:', classesData)
        const scheduledClassesData = classesData.filter((cls: any) => !cls.is_recurring)
        console.log('Clases programadas filtradas:', scheduledClassesData)
        console.log('Clases con is_recurring false:', classesData.filter((cls: any) => cls.is_recurring === false))
        setScheduledClasses(scheduledClassesData)
      }
      toast.success('Clase programada agregada correctamente')
    } else {
      const errorData = await response.json()
      console.error('Error en la respuesta:', errorData)
      throw new Error(errorData.error || 'Error al agregar la clase')
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
        
        // Agregar a la lista de horarios fijos ocultos para esta semana
        setHiddenFixedSchedules(prev => new Set(Array.from(prev).concat(exceptionKey)))
        
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
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <ClimbingBoxLoader size="lg" className="mb-4" />
          <p className="text-foreground-muted text-lg font-medium">Cargando calendario...</p>
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
              onClick={restoreAllFixedSchedules}
              variant="outline"
              size="sm"
              className="text-warning border-warning hover:bg-warning/10 hover:text-warning"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar Horarios Fijos
              {hiddenFixedSchedules.size > 0 && (
                <span className="ml-2 px-2 py-1 bg-warning/20 text-warning text-xs rounded-full">
                  {hiddenFixedSchedules.size}
                </span>
              )}
            </Button>
            
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('=== CLICK EN BOTÓN NUEVA CLASE ===')
                console.log('isAddModalOpen antes:', isAddModalOpen)
                console.log('Evento:', e)
                setSelectedTimeSlot(undefined)
                console.log('Llamando setIsAddModalOpen(true)...')
                setIsAddModalOpen(true)
                console.log('isAddModalOpen después: true')
                console.log('=== FIN CLICK BOTÓN ===')
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
          hiddenFixedSchedules={hiddenFixedSchedules}
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
          console.log('Cerrando modal de nueva clase')
          setIsAddModalOpen(false)
        }}
        onSave={async (classData) => {
          await handleAddClass(classData)
          setIsAddModalOpen(false)
        }}
        students={students}
        selectedTimeSlot={selectedTimeSlot}
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
