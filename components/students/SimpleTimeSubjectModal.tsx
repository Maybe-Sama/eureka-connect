'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Clock, BookOpen } from 'lucide-react'
import { SubjectSelectorModal } from './SubjectSelectorModal-fixed'

interface TimeSubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { startTime: string; endTime: string; subject: string; dayOfWeek?: number }) => void
  initialData?: { startTime: string; endTime: string; subject: string; dayOfWeek?: number }
  allowDaySelection?: boolean // Nueva propiedad para habilitar el selector de día
}

export function SimpleTimeSubjectModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  allowDaySelection = false
}: TimeSubjectModalProps) {
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00')
  const [duration, setDuration] = useState(60) // Duración en minutos
  const [subject, setSubject] = useState(initialData?.subject || '')
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.dayOfWeek || 1) // 1 = Lunes por defecto
  const [error, setError] = useState('')
  const [show15MinIntervals, setShow15MinIntervals] = useState(false)

  // Resetear datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setStartTime(initialData?.startTime || '09:00')
      // Calcular duración basada en las horas iniciales
      if (initialData?.startTime && initialData?.endTime) {
        const startMinutes = timeToMinutes(initialData.startTime)
        const endMinutes = timeToMinutes(initialData.endTime)
        setDuration(endMinutes - startMinutes)
      } else {
        setDuration(60) // 1 hora por defecto
      }
      setSubject(initialData?.subject || '')
      setDayOfWeek(initialData?.dayOfWeek || 1) // Lunes por defecto
      setError('')
    }
  }, [isOpen, initialData])

  const handleSave = () => {
    if (!startTime) {
      setError('Debes seleccionar hora de inicio')
      return
    }

    if (!subject) {
      setError('Debes seleccionar una asignatura')
      return
    }

    if (duration <= 0) {
      setError('La duración debe ser mayor a 0')
      return
    }

    // Calcular hora de fin
    const endTime = calculateEndTime(startTime, duration)
    
    // Incluir día de la semana si está permitido
    const saveData = allowDaySelection 
      ? { startTime, endTime, subject, dayOfWeek }
      : { startTime, endTime, subject }
    
    onSave(saveData)
    onClose()
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0')
    const m = (minutes % 60).toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + durationMinutes
    return minutesToTime(endMinutes)
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 8; hour <= 22; hour++) {
      const interval = show15MinIntervals ? 15 : 30
      for (let minute = 0; minute < 60; minute += interval) {
        const time = minutesToTime(hour * 60 + minute)
        options.push(time)
      }
    }
    return options
  }

  const generateDurationOptions = () => {
    const options = []
    const interval = show15MinIntervals ? 15 : 30
    for (let minutes = 30; minutes <= 360; minutes += interval) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      let label = ''
      if (hours > 0 && mins > 0) {
        label = `${hours}h ${mins}min`
      } else if (hours > 0) {
        label = `${hours}h`
      } else {
        label = `${mins}min`
      }
      options.push({ value: minutes, label })
    }
    return options
  }

  const timeOptions = generateTimeOptions()
  const durationOptions = generateDurationOptions()
  const endTime = calculateEndTime(startTime, duration)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-background-secondary rounded-2xl shadow-2xl w-full max-w-md border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {initialData ? 'Editar Clase' : 'Nueva Clase'}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Day Selection (if enabled) */}
            {allowDaySelection && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Día de la semana
                </label>
                <div className="relative">
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value={1}>Lunes</option>
                    <option value={2}>Martes</option>
                    <option value={3}>Miércoles</option>
                    <option value={4}>Jueves</option>
                    <option value={5}>Viernes</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                </div>
              </div>
            )}

            {/* Time Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hora de Inicio
                </label>
                <div className="relative">
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Duración
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground-muted">Fracciones de hora:</span>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShow15MinIntervals(!show15MinIntervals)
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors border border-primary/20 font-medium"
                    >
                      {show15MinIntervals ? '30min' : '15min'}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                </div>
              </div>

              {/* Hora de fin calculada */}
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Hora de fin:</span>
                  <span className="text-sm text-foreground-muted font-mono">{endTime}</span>
                </div>
              </div>
            </div>

            {/* Subject Selection */}
            <div>
              <SubjectSelectorModal
                selectedSubject={subject}
                onSubjectChange={setSubject}
                placeholder="Selecciona una asignatura"
              />
            </div>

            {/* Preview */}
            {(startTime || duration || subject) && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2">Vista previa:</h4>
                <div className="space-y-1 text-sm text-foreground-muted">
                  {allowDaySelection && (
                    <p><span className="font-medium">Día:</span> {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek]}</p>
                  )}
                  <p><span className="font-medium">Horario:</span> {startTime} - {endTime}</p>
                  <p><span className="font-medium">Duración:</span> {durationOptions.find(opt => opt.value === duration)?.label}</p>
                  {subject && <p><span className="font-medium">Asignatura:</span> {subject}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="px-6"
            >
              {initialData ? 'Actualizar' : 'Crear'} Clase
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
