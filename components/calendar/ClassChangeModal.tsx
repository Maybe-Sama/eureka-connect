'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Class } from '@/types'

interface ClassChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (changeType: 'oneTime' | 'permanent') => void
  classItem: Class | null
}

export const ClassChangeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  classItem 
}: ClassChangeModalProps) => {
  if (!isOpen || !classItem) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background-secondary rounded-xl p-6 w-full max-w-md border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <AlertCircle size={48} className="text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            ¿Qué tipo de cambio quieres hacer?
          </h2>
          <p className="text-foreground-muted mb-2">
            {classItem.isRecurring ? 'Horario fijo recurrente' : 'Clase programada específica'}
          </p>
          <p className="text-sm text-foreground-muted">
            {classItem.isRecurring 
              ? `Horario semanal - ${classItem.student_name}` 
              : `Clase para el ${new Date(classItem.date).toLocaleDateString()} - ${classItem.student_name}`
            }
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => onConfirm('oneTime')}
            variant="outline"
            className="w-full h-16 text-left p-4"
          >
            <div>
              <p className="font-semibold text-foreground">
                {classItem.isRecurring ? 'Modificar solo esta semana' : 'Modificar esta clase'}
              </p>
              <p className="text-sm text-foreground-muted">
                {classItem.isRecurring 
                  ? 'Cambia solo esta ocurrencia del horario fijo'
                  : 'Modifica los detalles de esta clase específica'
                }
              </p>
            </div>
          </Button>

          {classItem.isRecurring && (
            <Button
              onClick={() => onConfirm('permanent')}
              variant="outline"
              className="w-full h-16 text-left p-4"
            >
              <div>
                <p className="font-semibold text-foreground">Modificar horario fijo</p>
                <p className="text-sm text-foreground-muted">
                  Cambia el horario recurrente para todas las semanas futuras
                </p>
              </div>
            </Button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

