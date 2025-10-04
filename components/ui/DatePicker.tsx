'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Seleccionar fecha",
  className = "",
  disabled = false
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  )
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Actualizar fecha seleccionada cuando cambie el value
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value))
    } else {
      setSelectedDate(null)
    }
  }, [value])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Convertir día de la semana: 0=domingo, 1=lunes... a 1=lunes, 7=domingo
    let startingDayOfWeek = firstDay.getDay()
    if (startingDayOfWeek === 0) startingDayOfWeek = 7 // Domingo = 7
    startingDayOfWeek = startingDayOfWeek - 1 // Ajustar para que lunes = 0

    const days = []
    
    // Días del mes anterior (lunes a domingo)
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonth = new Date(year, month - 1, lastDay.getDate() - startingDayOfWeek + i + 1)
      days.push({
        date: prevMonth,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      })
    }

    // Días del mes actual
    const today = new Date()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false
      })
    }

    // Días del mes siguiente para completar la grilla (6 semanas x 7 días = 42)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = new Date(year, month + 1, day)
      days.push({
        date: nextMonth,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      })
    }

    return days
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Usar formato local para evitar problemas de zona horaria
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    onChange(dateString)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    handleDateSelect(today)
  }

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder
    return selectedDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const days = getDaysInMonth(currentMonth)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDisplayValue()}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 z-50 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg p-4"
          >
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-semibold text-foreground">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-foreground-muted py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateSelect(day.date)}
                  className={`h-8 w-8 p-0 text-sm ${
                    !day.isCurrentMonth 
                      ? 'text-foreground-muted hover:bg-background-secondary' 
                      : day.isToday
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : day.isSelected
                      ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                      : 'hover:bg-background-secondary'
                  }`}
                >
                  {day.date.getDate()}
                </Button>
              ))}
            </div>

            {/* Botón de hoy */}
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="w-full"
              >
                Hoy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
