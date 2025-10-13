'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { getTimeSlots, getDayName } from '@/lib/utils'
import { toast } from 'sonner'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'

interface EditClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (classData: any) => Promise<void>
  classItem: any
}

export const EditClassModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  classItem 
}: EditClassModalProps) => {
  const [formData, setFormData] = useState({
    start_time: '16:00',
    end_time: '17:00',
    duration: 60,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when modal opens or classItem changes
  useEffect(() => {
    if (isOpen && classItem) {
      // Calculate duration from start and end time
      const startTime = classItem.start_time || '16:00'
      const endTime = classItem.end_time || '17:00'
      
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      
      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = endHours * 60 + endMinutes
      const duration = endTotalMinutes - startTotalMinutes

      setFormData({
        start_time: startTime,
        end_time: endTime,
        duration: Math.max(duration, 15), // Minimum 15 minutes
        date: classItem.date || new Date().toISOString().split('T')[0],
        notes: classItem.notes || ''
      })
      setIsSubmitting(false)
    }
  }, [isOpen, classItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) {
      return
    }
    
    // Validate required fields
    if (!formData.start_time) {
      toast.error('Debes seleccionar una hora de inicio')
      return
    }
    
    if (!formData.date) {
      toast.error('Debes seleccionar una fecha')
      return
    }
    
    // Validate duration
    if (formData.duration <= 0) {
      toast.error('La duración debe ser mayor a 0')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Calculate end time based on duration
      const startTime = formData.start_time
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = startTotalMinutes + formData.duration
      
      // Validate that duration doesn't exceed 24 hours
      if (endTotalMinutes >= 24 * 60) {
        toast.error('La clase no puede terminar después de las 23:59')
        setIsSubmitting(false)
        return
      }
      
      const endHours = Math.floor(endTotalMinutes / 60)
      const endMinutes = endTotalMinutes % 60
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
      
      // Calculate new day of week based on selected date
      const targetDate = new Date(formData.date + 'T00:00:00')
      const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay()
      
      const updatedClassData = {
        id: classItem.id,
        start_time: startTime,
        end_time: endTime,
        duration: formData.duration,
        day_of_week: dayOfWeek,
        date: formData.date,
        notes: formData.notes,
        // Keep original values for fields not being edited
        student_id: classItem.student_id,
        course_id: classItem.course_id,
        is_recurring: classItem.is_recurring,
        price: classItem.price
      }
      
      await onSave(updatedClassData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la clase. Inténtalo de nuevo.'
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
      
      // If duration changes, recalculate end time
      if (name === 'duration') {
        const startTime = newData.start_time
        const [startHours, startMinutes] = startTime.split(':').map(Number)
        const startTotalMinutes = startHours * 60 + startMinutes
        const endTotalMinutes = startTotalMinutes + Number(value)
        
        // Ensure it doesn't exceed 24 hours
        const maxMinutes = 24 * 60
        const finalEndMinutes = Math.min(endTotalMinutes, maxMinutes - 1)
        
        const endHours = Math.floor(finalEndMinutes / 60)
        const endMinutes = finalEndMinutes % 60
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
        
        newData.end_time = endTime
      }
      
      return newData
    })
  }

  if (!isOpen || !classItem) {
    return null
  }

  const isRecurring = classItem.is_recurring
  const classType = isRecurring ? 'horario fijo' : 'clase programada'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-background p-8 rounded-lg shadow-xl w-full max-w-md border border-border"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Editar {classType}
          </h2>
          
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-foreground-muted">
              <strong>Estudiante:</strong> {classItem.student_name || `ID: ${classItem.student_id}`}
            </p>
            {isRecurring && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                  📝 Edición de Horario Fijo
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Se creará una nueva clase individual con los cambios y se ocultará el horario fijo original para esta semana. El horario fijo seguirá apareciendo en las demás semanas.
                </p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                type="submit" 
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <DiagonalBoxLoader size="sm" color="white" className="mr-2" />
                    Actualizando...
                  </>
                ) : (
                  `Actualizar ${classType}`
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
