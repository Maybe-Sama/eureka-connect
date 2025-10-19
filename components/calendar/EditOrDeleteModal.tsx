'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Edit3, Trash2, Clock, Calendar, User } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

interface EditOrDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  classItem: any
}

export const EditOrDeleteModal = ({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  classItem 
}: EditOrDeleteModalProps) => {
  if (!isOpen || !classItem) return null

  const isRecurring = classItem.is_recurring
  const classType = isRecurring ? 'horario fijo' : 'clase programada'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-xl p-6 w-full max-w-md border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Edit3 className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">
            ¿Qué deseas hacer con esta {classType}?
          </h2>
          
          <div className="bg-background rounded-lg p-4 mb-4">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="w-4 h-4 text-foreground-muted" />
                <span className="text-lg font-semibold text-foreground">
                  {classItem.student_name || `Estudiante ID: ${classItem.student_id}`}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted mb-2">
              <Clock className="w-4 h-4" />
              <span>{classItem.start_time} - {classItem.end_time}</span>
            </div>
            {!isRecurring && (
              <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted">
                <Calendar className="w-4 h-4" />
                <span>{formatDateShort(classItem.date)}</span>
              </div>
            )}
          </div>

          {isRecurring && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Horario fijo recurrente
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Editar:</strong> Se creará una nueva clase individual con los cambios y se ocultará este horario fijo para esta semana.<br/>
                  <strong>Eliminar:</strong> Solo se ocultará de esta semana. El horario fijo seguirá apareciendo en las demás semanas.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onEdit}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Editar {classType}
          </Button>
          
          <Button 
            onClick={onDelete}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar {classType}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
