'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
  disabled?: boolean
}

export function TimePicker({ value, onChange, className, disabled = false }: TimePickerProps) {
  const [hours, setHours] = useState('16')
  const [minutes, setMinutes] = useState('00')
  const [isOpen, setIsOpen] = useState(false)

  // Generar opciones de horas (6:00 - 23:00)
  const hourOptions = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6
    return hour.toString().padStart(2, '0')
  })

  // Generar opciones de minutos (00, 15, 30, 45)
  const minuteOptions = ['00', '15', '30', '45']

  // Actualizar valores cuando cambia el prop value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setHours(h || '16')
      setMinutes(m || '00')
    }
  }, [value])

  // Actualizar el valor cuando cambian las horas o minutos
  useEffect(() => {
    const timeString = `${hours}:${minutes}`
    onChange(timeString)
  }, [hours, minutes, onChange])

  const handleHourChange = (hour: string) => {
    setHours(hour)
  }

  const handleMinuteChange = (minute: string) => {
    setMinutes(minute)
  }

  const formatDisplayTime = (h: string, m: string) => {
    return `${h}:${m}`
  }

  return (
    <div className={cn("relative", className)}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          "flex items-center justify-between",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-primary"
        )}
      >
        <span className="text-sm font-medium">
          {formatDisplayTime(hours, minutes)}
        </span>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-foreground-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-background-secondary border border-border rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-center space-x-6">
              {/* Hours */}
              <div className="flex flex-col items-center space-y-2">
                <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                  Hora
                </label>
                <div className="relative">
                  <div className="h-32 overflow-y-auto scrollbar-hide">
                    <div className="space-y-1">
                      {hourOptions.map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => handleHourChange(hour)}
                          className={cn(
                            "w-12 h-8 flex items-center justify-center text-sm font-medium rounded",
                            "hover:bg-background-tertiary transition-colors",
                            hours === hour
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground"
                          )}
                        >
                          {hour}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-1 h-1 bg-foreground-muted rounded-full mb-1"></div>
                <div className="w-1 h-1 bg-foreground-muted rounded-full"></div>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center space-y-2">
                <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                  Min
                </label>
                <div className="relative">
                  <div className="h-32 overflow-y-auto scrollbar-hide">
                    <div className="space-y-1">
                      {minuteOptions.map((minute) => (
                        <button
                          key={minute}
                          type="button"
                          onClick={() => handleMinuteChange(minute)}
                          className={cn(
                            "w-12 h-8 flex items-center justify-center text-sm font-medium rounded",
                            "hover:bg-background-tertiary transition-colors",
                            minutes === minute
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground"
                          )}
                        >
                          {minute}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary-hover transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
