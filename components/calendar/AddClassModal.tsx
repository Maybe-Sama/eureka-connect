'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { getTimeSlots, getDayName } from '@/lib/utils'
import { toast } from 'sonner'

interface AddClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (classData: any) => Promise<void>
  students: any[]
  selectedTimeSlot?: { day: number; time: string }
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        student_id: '',
        start_time: selectedTimeSlot?.time || '16:00',
        end_time: '17:00',
        duration: 60,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setIsSubmitting(false)
    }
  }, [isOpen, selectedTimeSlot])

  // Debug: Log form data changes
  console.log('=== FORM DATA DEBUG ===')
  console.log('formData:', formData)
  console.log('isSubmitting:', isSubmitting)
  console.log('students count:', students.length)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('=== FORM SUBMIT TRIGGERED ===')
    
    if (isSubmitting) {
      console.log('Already submitting, ignoring...')
      return // Prevenir múltiples envíos
    }
    
    console.log('Setting isSubmitting to true...')
    setIsSubmitting(true)
    
    try {
      console.log('=== DEBUG Form Submit ===')
      console.log('Form data:', formData)
      console.log('Selected student ID:', formData.student_id)
      
      const selectedStudent = students.find(s => s.id === Number(formData.student_id))
      console.log('Selected student:', selectedStudent)
      
      if (!selectedStudent) {
        console.log('No student selected, showing error')
        toast.error('Debes seleccionar un alumno')
        setIsSubmitting(false)
        return
      }
      
      // Usar directamente la fecha seleccionada en el formulario
      const targetDate = new Date(formData.date + 'T00:00:00') // Evitar problemas de zona horaria
      
      console.log('=== DEBUG Date Calculation ===')
      console.log('Selected time slot day:', selectedTimeSlot?.day)
      console.log('Form date:', formData.date)
      console.log('Target date:', targetDate.toISOString().split('T')[0])
      console.log('Target date day of week:', targetDate.getDay() === 0 ? 7 : targetDate.getDay())
      
      // Calcular hora de fin basada en la duración
      const startTime = formData.start_time
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = startTotalMinutes + formData.duration
      
      // Validar que la duración no sea excesiva
      if (endTotalMinutes >= 24 * 60) {
        toast.error('La clase no puede terminar después de las 23:59')
        setIsSubmitting(false)
        return
      }
      
      // Asegurar que no exceda las 24 horas (1440 minutos)
      const maxMinutes = 24 * 60
      const finalEndMinutes = Math.min(endTotalMinutes, maxMinutes - 1) // Máximo 23:59
      
      const endHours = Math.floor(finalEndMinutes / 60)
      const endMinutes = finalEndMinutes % 60
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
      
      console.log('=== DEBUG Time Calculation ===')
      console.log('Start time:', startTime)
      console.log('Duration:', formData.duration, 'minutes')
      console.log('Start total minutes:', startTotalMinutes)
      console.log('End total minutes:', endTotalMinutes)
      console.log('Final end minutes:', finalEndMinutes)
      console.log('End time:', endTime)
      
      const classData = {
        student_id: Number(formData.student_id),
        course_id: selectedStudent.course_id, // Obtener del alumno
        start_time: startTime,
        end_time: endTime,
        duration: formData.duration,
        day_of_week: targetDate.getDay() === 0 ? 7 : targetDate.getDay(), // Usar el día de la semana de la fecha seleccionada
        date: formData.date, // Usar directamente la fecha del formulario para evitar desfases
        subject: null,
        is_recurring: false, // Clase programada específica
        price: 0, // Se calculará en el backend
        notes: formData.notes || `Clase programada - ${selectedStudent.first_name} ${selectedStudent.last_name}`
      }
      
      console.log('Datos de la clase a crear:', classData)
      console.log('SelectedTimeSlot:', selectedTimeSlot)
      console.log('Fecha calculada:', targetDate.toISOString().split('T')[0])
      
      console.log('Calling onSave with classData...')
      await onSave(classData)
      console.log('Class saved successfully, closing modal...')
      onClose()
    } catch (error) {
      console.error('Error saving class:', error)
      toast.error('Error al crear la clase. Inténtalo de nuevo.')
      // No cerrar el modal si hay error, para que el usuario pueda intentar de nuevo
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
        const startTime = newData.start_time
        const [startHours, startMinutes] = startTime.split(':').map(Number)
        const startTotalMinutes = startHours * 60 + startMinutes
        const endTotalMinutes = startTotalMinutes + Number(value)
        
        // Asegurar que no exceda las 24 horas (1440 minutos)
        const maxMinutes = 24 * 60
        const finalEndMinutes = Math.min(endTotalMinutes, maxMinutes - 1) // Máximo 23:59
        
        const endHours = Math.floor(finalEndMinutes / 60)
        const endMinutes = finalEndMinutes % 60
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
        
        newData.end_time = endTime
      }
      
      return newData
    })
  }

  console.log('=== DEBUG Modal Render ===')
  console.log('Modal is open:', isOpen)
  console.log('Form data:', formData)
  console.log('Students:', students)

  if (!isOpen) {
    console.log('Modal no está abierto, no renderizando')
    return null
  }

  console.log('Modal está abierto, renderizando...')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background-secondary p-8 rounded-lg shadow-xl w-full max-w-md border border-border"
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
              className="flex-1"
              disabled={isSubmitting}
              onClick={async (e) => {
                console.log('=== BUTTON CLICKED ===')
                e.preventDefault()
                await handleSubmit(e as any)
              }}
            >
              {isSubmitting ? 'Creando...' : 'Crear Clase'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
