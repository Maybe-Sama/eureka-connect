'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { PastDateWarningModal } from './PastDateWarningModal'
import { getTimeSlots, getDayName } from '@/lib/utils'
import { toast } from 'sonner'

interface AddClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (classData: any) => Promise<void>
  students: any[]
  selectedTimeSlot?: { day: number; time: string; date?: string }
}

export const AddClassModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  students,
  selectedTimeSlot 
}: AddClassModalProps) => {
  const [formData, setFormData] = useState({
    student_id: '',
    start_time: selectedTimeSlot?.time || '16:00',
    end_time: '17:00',
    duration: 60,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPastDateWarning, setShowPastDateWarning] = useState(false)
  const [pendingClassData, setPendingClassData] = useState<any>(null)

  // Función para calcular la hora de fin basada en la hora de inicio y duración
  const calculateEndTime = (startTime: string, duration: number) => {
    console.log('=== DEBUG calculateEndTime ===')
    console.log('startTime:', startTime)
    console.log('duration:', duration)
    
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = startTotalMinutes + duration
    
    console.log('startHours:', startHours)
    console.log('startMinutes:', startMinutes)
    console.log('startTotalMinutes:', startTotalMinutes)
    console.log('endTotalMinutes:', endTotalMinutes)
    console.log('24 * 60 =', 24 * 60)
    
    // Validar que la duración no exceda las 24 horas (1440 minutos)
    if (endTotalMinutes >= 24 * 60) {
      console.warn('Duración excesiva: la clase no puede terminar después de las 23:59')
      console.warn('endTotalMinutes:', endTotalMinutes, '>=', 24 * 60)
      // En lugar de limitar a 23:59, lanzar un error
      throw new Error('La duración de la clase excede las 24 horas')
    }
    
    const endHours = Math.floor(endTotalMinutes / 60)
    const endMinutes = endTotalMinutes % 60
    
    const result = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    console.log('Calculated end time:', result)
    
    return result
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const startTime = selectedTimeSlot?.time || '16:00'
      const duration = 60
      const endTime = calculateEndTime(startTime, duration)
      
      setFormData({
        student_id: '',
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        date: selectedTimeSlot?.date || new Date().toISOString().split('T')[0],
        notes: ''
      })
      setIsSubmitting(false)
    } else {
      // Limpiar formulario cuando se cierra el modal
      const startTime = '16:00'
      const duration = 60
      const endTime = calculateEndTime(startTime, duration)
      
      setFormData({
        student_id: '',
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setIsSubmitting(false)
    }
  }, [isOpen, selectedTimeSlot])

  // Función para preparar los datos de la clase
  const prepareClassData = (selectedStudent: any) => {
    console.log('=== DEBUG prepareClassData ===')
    console.log('formData:', formData)
    console.log('formData.duration type:', typeof formData.duration)
    console.log('formData.duration value:', formData.duration)
    
    const startTime = formData.start_time
    const duration = Number(formData.duration) // Asegurar que sea número
    const endTime = calculateEndTime(startTime, duration)
    const targetDate = new Date(formData.date + 'T00:00:00')
    
    return {
      student_id: Number(formData.student_id),
      course_id: selectedStudent.course_id,
      start_time: startTime,
      end_time: endTime,
      duration: duration,
      day_of_week: targetDate.getDay() === 0 ? 7 : targetDate.getDay(),
      date: formData.date,
      subject: null,
      is_recurring: false,
      price: 0,
      notes: formData.notes || `Clase programada - ${selectedStudent.first_name} ${selectedStudent.last_name}`
    }
  }

  // Función para crear la clase
  const createClass = async () => {
    const selectedStudent = students.find(s => s.id === Number(formData.student_id))
    
    if (!selectedStudent) {
      toast.error('Debes seleccionar un alumno')
      setIsSubmitting(false)
      return
    }
    
    const classData = prepareClassData(selectedStudent)
    
    
    if (typeof onSave !== 'function') {
      toast.error('Error: función de guardado no disponible')
      setIsSubmitting(false)
      return
    }
    
    await onSave(classData)
  }

  // Manejar confirmación del modal de advertencia
  const handlePastDateConfirm = async () => {
    setShowPastDateWarning(false)
    setIsSubmitting(true)
    
    try {
      await createClass()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la clase. Inténtalo de nuevo.'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar cancelación del modal de advertencia
  const handlePastDateCancel = () => {
    setShowPastDateWarning(false)
    setPendingClassData(null)
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) {
      return // Prevenir múltiples envíos
    }
    
    // Validate required fields
    if (!formData.student_id) {
      toast.error('Debes seleccionar un alumno')
      return
    }
    
    if (!formData.start_time) {
      toast.error('Debes seleccionar una hora de inicio')
      return
    }
    
    if (!formData.date) {
      toast.error('Debes seleccionar una fecha')
      return
    }
    
    // Validar que la duración sea válida
    if (formData.duration <= 0) {
      toast.error('La duración debe ser mayor a 0')
      return
    }
    
    // Verificar si la fecha es anterior a hoy
    const selectedDate = new Date(formData.date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Resetear horas para comparar solo fechas
    
    if (selectedDate < today) {
      // Mostrar modal de advertencia para fechas pasadas
      const selectedStudent = students.find(s => s.id === Number(formData.student_id))
      if (!selectedStudent) {
        toast.error('Debes seleccionar un alumno')
        return
      }
      
      // Preparar datos de la clase para el modal de advertencia
      const classData = prepareClassData(selectedStudent)
      setPendingClassData(classData)
      setShowPastDateWarning(true)
      return
    }
    
    // Si la fecha es futura o hoy, proceder normalmente
    setIsSubmitting(true)
    
    try {
      await createClass()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la clase. Inténtalo de nuevo.'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }
      
      // Si cambia la duración, recalcular la hora de fin
      if (name === 'duration') {
        try {
          const startTime = newData.start_time
          const endTime = calculateEndTime(startTime, Number(value))
          newData.end_time = endTime
        } catch (error) {
          // Si hay error en el cálculo, mantener la hora de fin actual
          console.warn('Error calculando hora de fin:', error)
        }
      }
      
      return newData
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            key="add-class-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background p-8 rounded-lg shadow-xl w-full max-w-md border border-border"
          >
        <h2 className="text-2xl font-bold text-foreground mb-6">Nueva Clase</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Alumno
            </label>
            <select
              value={formData.student_id}
              onChange={handleChange}
              name="student_id"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={isSubmitting}
            >
              <option value="">Seleccionar alumno</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hora de Inicio
              </label>
              <select
                value={formData.start_time}
                onChange={handleChange}
                name="start_time"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isSubmitting}
              >
                {getTimeSlots().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Duración (min)
              </label>
              <select
                value={formData.duration}
                onChange={handleChange}
                name="duration"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isSubmitting}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
                <option value={75}>1h 15min</option>
                <option value={90}>1h 30min</option>
                <option value={105}>1h 45min</option>
                <option value={120}>2 horas</option>
                <option value={135}>2h 15min</option>
                <option value={150}>2h 30min</option>
                <option value={165}>2h 45min</option>
                <option value={180}>3 horas</option>
                <option value={240}>4 horas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fecha
            </label>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData(prev => ({ ...prev, date }))}
              placeholder="Seleccionar fecha"
              className="w-full"
              disabled={isSubmitting}
            />
            {selectedTimeSlot && (
              <p className="text-xs text-foreground-muted mt-1">
                Día seleccionado: {getDayName(selectedTimeSlot.day)} a las {selectedTimeSlot.time}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notas (opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setFormData({
                  student_id: '',
                  start_time: selectedTimeSlot?.time || '16:00',
                  end_time: '17:00',
                  duration: 60,
                  date: selectedTimeSlot?.date || new Date().toISOString().split('T')[0],
                  notes: ''
                })
                setIsSubmitting(false)
              }}
              className="flex-1"
              disabled={isSubmitting}
            >
              Limpiar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando...' : 'Crear Clase'}
            </Button>
          </div>
        </form>
        </motion.div>
        </div>
        )}
      </AnimatePresence>
      
      {/* Modal de advertencia para fechas pasadas */}
      <PastDateWarningModal
        isOpen={showPastDateWarning}
        onClose={handlePastDateCancel}
        onConfirm={handlePastDateConfirm}
        selectedDate={formData.date}
        selectedTime={formData.start_time}
        studentName={pendingClassData ? `${students.find(s => s.id === Number(formData.student_id))?.first_name} ${students.find(s => s.id === Number(formData.student_id))?.last_name}` : ''}
      />
    </>
  )
}
