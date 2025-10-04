'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, Calendar, RotateCcw } from 'lucide-react'

interface DeleteClassModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  classItem: any
  isDeleting?: boolean
}

export const DeleteClassModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  classItem,
  isDeleting = false
}: DeleteClassModalProps) => {
  if (!isOpen || !classItem) return null

  const isRecurring = classItem.is_recurring
  const classType = isRecurring ? 'horario fijo' : 'clase programada'

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
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">
            ¿Eliminar {classType}?
          </h2>
          
          <div className="bg-background rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {classItem.student_name}
              </span>
            </div>
            <div className="text-sm text-foreground-muted">
              {classItem.subject || 'Sin asignatura'}
            </div>
            <div className="text-sm text-foreground-muted">
              {classItem.start_time} - {classItem.end_time}
            </div>
            {!isRecurring && (
              <div className="text-sm text-foreground-muted">
                {new Date(classItem.date).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>

          {isRecurring ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Horario fijo recurrente
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Solo se eliminará de esta semana específica. El horario fijo seguirá apareciendo en las demás semanas.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Clase programada específica
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Se eliminará completamente del calendario. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {isRecurring ? 'Eliminar de esta semana' : 'Eliminar clase'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
