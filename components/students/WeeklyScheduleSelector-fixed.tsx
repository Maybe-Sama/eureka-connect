'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { SimpleTimeSubjectModal } from '@/components/students/SimpleTimeSubjectModal'

interface TimeSlot {
  day_of_week: number
  start_time: string
  end_time: string
  course_id: string
  course_name: string
  subject?: string
  price?: number
}

interface Course {
  id: number
  name: string
  price: number
  color: string
  is_active: boolean
}

interface WeeklyScheduleSelectorProps {
  allClasses: TimeSlot[]
  allCourses: Course[]
  selectedSchedule: TimeSlot[]
  onScheduleChange: (schedule: TimeSlot[]) => void
  onEditSlot?: (slot: TimeSlot, index: number) => void
  selectedCourseId?: string
}

const timeToMinutes = (time: string): number => {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

const PIXELS_PER_MINUTE = 0.8
const START_HOUR = 8
const TOTAL_HOURS = 14

const WeeklyScheduleSelector: React.FC<WeeklyScheduleSelectorProps> = ({
  allClasses,
  allCourses,
  selectedSchedule,
  onScheduleChange,
  onEditSlot,
  selectedCourseId
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [editPopoverOpen, setEditPopoverOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [newSlotInfo, setNewSlotInfo] = useState<{ day: number; time: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [formState, setFormState] = useState({
    startTime: '09:00',
    endTime: '10:00',
    subject: ''
  })

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = START_HOUR; hour < START_HOUR + TOTAL_HOURS; hour++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const minutes = quarter * 15
        const time = minutesToTime(hour * 60 + minutes)
        slots.push(time)
      }
    }
    return slots
  }, [])

  const getSlotPosition = (time: string) => {
    const minutes = timeToMinutes(time) - (START_HOUR * 60)
    return minutes * PIXELS_PER_MINUTE
  }

  const getSlotHeight = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime) - (START_HOUR * 60)
    const endMinutes = timeToMinutes(endTime) - (START_HOUR * 60)
    return (endMinutes - startMinutes) * PIXELS_PER_MINUTE
  }

  const handleTimeSlotClick = (day: number, time: string) => {
    setNewSlotInfo({ day, time })
    setFormState({
      startTime: time,
      endTime: minutesToTime(timeToMinutes(time) + 60),
      subject: ''
    })
    setError(null)
    setPopoverOpen(true)
  }

  const handleAddSchedule = () => {
    if (!newSlotInfo) return

    const { day, time } = newSlotInfo
    const { startTime, endTime, subject } = formState

    // Validation
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('La hora de fin debe ser posterior a la hora de inicio')
      return
    }

    // Check for conflicts
    const hasConflict = selectedSchedule.some(slot => 
      slot.day_of_week === day &&
      ((timeToMinutes(startTime) < timeToMinutes(slot.end_time) && 
        timeToMinutes(endTime) > timeToMinutes(slot.start_time)))
    )

    if (hasConflict) {
      setError('Ya existe una clase en este horario')
      return
    }

    // Find course
    const course = allCourses.find(course => course.id.toString() === selectedCourseId)
    if (!course) {
      setError('Selecciona un curso primero')
      return
    }

    const newSlot: TimeSlot = {
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      course_id: selectedCourseId || '',
      course_name: course.name,
      subject: subject || undefined,
      price: course.price
    }

    onScheduleChange([...selectedSchedule, newSlot])
    setPopoverOpen(false)
    setNewSlotInfo(null)
    setError(null)
  }

  const handleUpdateSchedule = () => {
    if (!editingSlot || editingIndex === -1) return

    const { startTime, endTime, subject } = formState

    // Validation
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('La hora de fin debe ser posterior a la hora de inicio')
      return
    }

    // Check for conflicts (excluding current slot)
    const hasConflict = selectedSchedule.some((slot, index) => 
      index !== editingIndex &&
      slot.day_of_week === editingSlot.day_of_week &&
      ((timeToMinutes(startTime) < timeToMinutes(slot.end_time) && 
        timeToMinutes(endTime) > timeToMinutes(slot.start_time)))
    )

    if (hasConflict) {
      setError('Ya existe una clase en este horario')
      return
    }

    const updatedSlot: TimeSlot = {
      ...editingSlot,
      start_time: startTime,
      end_time: endTime,
      subject: subject || undefined
    }

    const updatedSchedule = [...selectedSchedule]
    updatedSchedule[editingIndex] = updatedSlot
    onScheduleChange(updatedSchedule)

    setEditPopoverOpen(false)
    setEditingSlot(null)
    setEditingIndex(-1)
    setError(null)
  }

  const handleEditSlot = (slot: TimeSlot, index: number) => {
    setEditingSlot(slot)
    setEditingIndex(index)
    setFormState({
      startTime: slot.start_time,
      endTime: slot.end_time,
      subject: slot.subject || ''
    })
    setError(null)
    setEditPopoverOpen(true)
  }

  const handleDeleteSlot = (index: number) => {
    const updatedSchedule = selectedSchedule.filter((_, i) => i !== index)
    onScheduleChange(updatedSchedule)
  }

  const getClassesForDay = (day: number) => {
    return selectedSchedule.filter(slot => slot.day_of_week === day)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-2">
        <div className="text-sm font-medium text-gray-500">Hora</div>
        {days.map((day, index) => (
          <div key={index} className="text-sm font-medium text-center text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="grid grid-cols-8 gap-2">
          <div className="space-y-1">
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className="text-xs text-gray-400 h-3 flex items-center"
                style={{ height: `${15 * PIXELS_PER_MINUTE}px` }}
              >
                {index % 4 === 0 && time}
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="relative border border-gray-200 rounded min-h-[400px]"
              style={{ height: `${TOTAL_HOURS * 60 * PIXELS_PER_MINUTE}px` }}
            >
              {getClassesForDay(dayIndex).map((slot, slotIndex) => {
                const course = allCourses.find(course => course.id.toString() === slot.course_id)
                return (
                  <div
                    key={slotIndex}
                    className="absolute rounded p-1 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      top: `${getSlotPosition(slot.start_time)}px`,
                      height: `${getSlotHeight(slot.start_time, slot.end_time)}px`,
                      backgroundColor: course?.color || '#3B82F6',
                      left: '2px',
                      right: '2px'
                    }}
                    onClick={() => onEditSlot?.(slot, selectedSchedule.indexOf(slot))}
                  >
                    <div className="font-medium text-white truncate">
                      {slot.course_name}
                    </div>
                    <div className="text-white/80 text-xs">
                      {slot.start_time} - {slot.end_time}
                    </div>
                    {slot.subject && (
                      <div className="text-white/70 text-xs truncate">
                        {slot.subject}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-4 w-4 p-0 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSlot(selectedSchedule.indexOf(slot))
                      }}
                    >
                      <Trash2 className="h-2 w-2" />
                    </Button>
                  </div>
                )
              })}

              {/* Clickable time slots */}
              {timeSlots.map((time, timeIndex) => (
                <div
                  key={timeIndex}
                  className="absolute cursor-pointer hover:bg-blue-50 transition-colors"
                  style={{
                    top: `${getSlotPosition(time)}px`,
                    height: `${15 * PIXELS_PER_MINUTE}px`,
                    left: '0',
                    right: '0'
                  }}
                  onClick={() => handleTimeSlotClick(dayIndex, time)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {popoverOpen && newSlotInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Agregar Horario</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Hora de inicio</label>
                <input
                  type="time"
                  value={formState.startTime}
                  onChange={(e) => setFormState({...formState, startTime: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Hora de fin</label>
                <input
                  type="time"
                  value={formState.endTime}
                  onChange={(e) => setFormState({...formState, endTime: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Materia (opcional)</label>
                <input
                  type="text"
                  value={formState.subject}
                  onChange={(e) => setFormState({...formState, subject: e.target.value})}
                  placeholder="Ej: Matemáticas"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2"/> {error}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPopoverOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddSchedule}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editPopoverOpen && editingSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Editar Horario</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Hora de inicio</label>
                <input
                  type="time"
                  value={formState.startTime}
                  onChange={(e) => setFormState({...formState, startTime: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Hora de fin</label>
                <input
                  type="time"
                  value={formState.endTime}
                  onChange={(e) => setFormState({...formState, endTime: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Materia (opcional)</label>
                <input
                  type="text"
                  value={formState.subject}
                  onChange={(e) => setFormState({...formState, subject: e.target.value})}
                  placeholder="Ej: Matemáticas"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2"/> {error}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setEditPopoverOpen(false)
                  setEditingSlot(null)
                  setEditingIndex(-1)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateSchedule}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyScheduleSelector
