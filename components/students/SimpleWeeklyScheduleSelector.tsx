'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { SimpleTimeSubjectModal } from './SimpleTimeSubjectModal'

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
  subject?: string
  price: number
  duration: number
  color: string
  is_active: boolean
}

interface SimpleWeeklyScheduleSelectorProps {
  allClasses: TimeSlot[]
  allCourses: Course[]
  selectedSchedule: TimeSlot[]
  onScheduleChange: (schedule: TimeSlot[]) => void
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

export function SimpleWeeklyScheduleSelector({ 
  allClasses, 
  allCourses, 
  selectedSchedule, 
  onScheduleChange,
  selectedCourseId
}: SimpleWeeklyScheduleSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<{ slot: TimeSlot; index: number } | null>(null)
  const [newSlotInfo, setNewSlotInfo] = useState<{ day_of_week: number; start_time: string } | null>(null)

  const dailySchedules = useMemo(() => {
    // Marcar todas las clases del selectedSchedule como editables y removibles
    const existingClasses = allClasses.map(cls => ({ ...cls, isEditable: true }))
    const selectedClasses = selectedSchedule.map(s => ({ ...s, isNew: true, isEditable: true, isRemovable: true }))
    const combined = [...existingClasses, ...selectedClasses]
    
    const byDay: Record<number, TimeSlot[]> = {}
    for (let i = 1; i <= 7; i++) {
      byDay[i] = combined.filter(c => c.day_of_week === (i % 7))
    }
    return byDay
  }, [allClasses, selectedSchedule])

  const handleSlotClick = (dayIndex: number, time: string) => {
    setNewSlotInfo({ day_of_week: dayIndex % 7, start_time: time })
    setEditingSlot(null)
    setModalOpen(true)
  }

  const handleSaveSchedule = (data: { startTime: string; endTime: string; subject: string; dayOfWeek?: number }) => {
    const { startTime, endTime, subject, dayOfWeek: newDayOfWeek } = data
    
    console.log('🔍 SimpleWeeklyScheduleSelector - handleSaveSchedule called')
    console.log('   - data:', data)
    console.log('   - selectedCourseId:', selectedCourseId)
    console.log('   - allCourses:', allCourses)
    console.log('   - editingSlot:', editingSlot)
    console.log('   - newSlotInfo:', newSlotInfo)
    
    // Determinar el día de la semana para verificar solapamiento
    // Prioritizar el día seleccionado en el modal, luego el existente o el nuevo
    const dayOfWeek = newDayOfWeek !== undefined ? newDayOfWeek : 
                     (editingSlot ? editingSlot.slot.day_of_week : (newSlotInfo?.day_of_week || 0))
    
    if (!dayOfWeek && dayOfWeek !== 0) {
      console.error('❌ No se pudo determinar el día de la semana')
      alert("Error: No se pudo determinar el día de la semana.")
      return
    }
    
    // Verificar solapamiento
    const daySchedule = dailySchedules[dayOfWeek === 0 ? 7 : dayOfWeek] || []
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const isOverlapping = daySchedule.some(c => {
      const classStart = timeToMinutes(c.start_time)
      const classEnd = timeToMinutes(c.end_time)
      return startMinutes < classEnd && endMinutes > classStart
    })

    if (isOverlapping) {
      console.log('❌ Horario solapado')
      alert("El horario seleccionado se solapa con otra clase.")
      return
    }

    // Obtener información del curso seleccionado
    const selectedCourse = allCourses.find(course => course.id.toString() === selectedCourseId)
    const durationHours = (endMinutes - startMinutes) / 60
    const price = selectedCourse ? (durationHours * selectedCourse.price) : 0
    
    console.log('📊 Cálculos:')
    console.log('   - selectedCourse:', selectedCourse)
    console.log('   - durationHours:', durationHours)
    console.log('   - price:', price)

    if (editingSlot) {
      // Editar slot existente
      const updatedSchedule = [...selectedSchedule]
      updatedSchedule[editingSlot.index] = {
        ...editingSlot.slot,
        day_of_week: dayOfWeek, // Usar el día potencialmente actualizado
        start_time: startTime,
        end_time: endTime,
        subject: subject,
        course_id: selectedCourseId || editingSlot.slot.course_id,
        course_name: selectedCourse?.name || editingSlot.slot.course_name,
        price: price
      }
      onScheduleChange(updatedSchedule)
    } else {
      // Crear nuevo slot
      if (!newSlotInfo && newDayOfWeek === undefined) {
        console.error('❌ newSlotInfo es null y no se proporcionó dayOfWeek al crear nuevo slot')
        alert("Error: No se pudo crear el nuevo horario.")
        return
      }
      
      const newSlot = {
        day_of_week: dayOfWeek, // Usar el día determinado arriba
        start_time: startTime,
        end_time: endTime,
        course_id: selectedCourseId || '',
        course_name: selectedCourse?.name || '',
        subject: subject,
        price: price
      }
      
      console.log('📝 Creando nuevo slot:')
      console.log('   - newSlot:', newSlot)
      console.log('   - selectedSchedule actual:', selectedSchedule)
      
      onScheduleChange([
        ...selectedSchedule,
        newSlot
      ])
      
      console.log('✅ Slot añadido al horario')
    }
    
    setModalOpen(false)
    setEditingSlot(null)
    setNewSlotInfo(null)
  }

  const handleRemoveSchedule = (index: number) => {
    onScheduleChange(selectedSchedule.filter((_, i) => i !== index))
  }

  const handleEditSlot = (slot: TimeSlot, index: number) => {
    setEditingSlot({ slot, index })
    setNewSlotInfo(null)
    setModalOpen(true)
  }

  const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  return (
    <div className="relative">
      <div className="relative bg-background-secondary p-4 rounded-lg border border-border grid grid-cols-[auto,1fr]">
        {/* Time Gutter */}
        <div className="pr-2">
          {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
            <div 
              key={i} 
              style={{ height: `${60 * PIXELS_PER_MINUTE}px` }} 
              className="relative -top-2 text-right text-xs text-foreground-muted"
            >
              {START_HOUR + i}:00
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-px bg-border border-l border-border">
          {weekDays.map((day, dayIndex) => {
            const dayOfWeekJs = (dayIndex + 1) % 7
            return(
              <div key={day} className="bg-background-secondary relative">
                <div className="text-center text-sm font-semibold p-2 text-foreground bg-background-tertiary sticky top-0 z-10 border-b border-border">
                  {day}
                </div>
                
                {/* Background grid lines & Click handlers */}
                {Array.from({ length: TOTAL_HOURS * 4 }).map((_, i) => {
                  const time = minutesToTime((START_HOUR * 60) + (i * 15))
                  return (
                    <div
                      key={i}
                      onClick={() => handleSlotClick(dayIndex + 1, time)}
                      style={{ height: `${15 * PIXELS_PER_MINUTE}px` }}
                      className="border-t border-border/50 hover:bg-primary/10 cursor-pointer transition-colors"
                    />
                  )
                })}

                {/* Scheduled Blocks */}
                {dailySchedules[dayIndex+1]?.map((c, i) => {
                  const top = (timeToMinutes(c.start_time) - (START_HOUR * 60)) * PIXELS_PER_MINUTE
                  const height = (timeToMinutes(c.end_time) - timeToMinutes(c.start_time)) * PIXELS_PER_MINUTE
                  const course = allCourses.find(course => course.id.toString() === c.course_id)
                  const isNewSlot = (c as any).isNew
                  const isEditable = (c as any).isEditable
                  const isRemovable = (c as any).isRemovable || isNewSlot // Permitir remover si está marcado o es nuevo
                  const slotIndex = isNewSlot ? selectedSchedule.findIndex(s => s.start_time === c.start_time && s.day_of_week === c.day_of_week) : -1
                  
                  return (
                    <div
                      key={`${c.day_of_week}-${c.start_time}-${i}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      className={`absolute left-0.5 right-0.5 rounded-md p-1.5 text-xs flex flex-col justify-start overflow-hidden cursor-pointer ${
                        isNewSlot ? 'bg-success/80 group' : 'bg-primary/80 group'
                      }`}
                      onDoubleClick={() => {
                        if (isEditable) {
                          if (isNewSlot && slotIndex !== -1) {
                            // Editar clase nueva
                            handleEditSlot(c, slotIndex)
                          } else {
                            // Editar clase existente - crear una nueva entrada en selectedSchedule
                            const newSlot = {
                              day_of_week: c.day_of_week,
                              start_time: c.start_time,
                              end_time: c.end_time,
                              course_id: c.course_id.toString(),
                              course_name: c.course_name || course?.name || '',
                              subject: c.subject || '',
                              price: c.price || 0
                            }
                            const newIndex = selectedSchedule.length
                            onScheduleChange([...selectedSchedule, newSlot])
                            handleEditSlot(newSlot, newIndex)
                          }
                        }
                      }}
                      title={isEditable ? "Doble click para editar" : "Clase existente"}
                    >
                      <p className="font-bold text-white truncate">{course?.name || c.course_name}</p>
                      {c.subject && (
                        <p className="text-white/90 text-xs truncate">{c.subject}</p>
                      )}
                      <p className="text-white/80">{c.start_time} - {c.end_time}</p>
                      {isRemovable && slotIndex !== -1 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveSchedule(slotIndex)
                          }} 
                          className="absolute top-1 right-1 p-0.5 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100"
                          title="Eliminar horario"
                        >
                          <Trash2 className="w-3 h-3 text-white"/>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Simple Modal */}
      <SimpleTimeSubjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingSlot(null)
          setNewSlotInfo(null)
        }}
        onSave={handleSaveSchedule}
        allowDaySelection={true} // Habilitar selector de día para permitir cambiar el día
        initialData={editingSlot ? {
          startTime: editingSlot.slot.start_time,
          endTime: editingSlot.slot.end_time,
          subject: editingSlot.slot.subject || '',
          dayOfWeek: editingSlot.slot.day_of_week
        } : newSlotInfo ? {
          startTime: newSlotInfo.start_time || '09:00',
          endTime: '10:00',
          subject: '',
          dayOfWeek: newSlotInfo.day_of_week
        } : undefined}
      />
    </div>
  )
}
