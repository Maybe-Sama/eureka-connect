'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, Calendar } from 'lucide-react'

interface PastDateWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedDate: string
  selectedTime: string
  studentName: string
}

export const PastDateWarningModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  selectedDate,
  selectedTime,
  studentName
}: PastDateWarningModalProps) => {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-background p-8 rounded-xl shadow-xl w-full max-w-md border border-border"
        >
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              ⚠️ Clase en Fecha Pasada
            </h2>
            
            <p className="text-foreground-muted mb-4">
              Estás a punto de crear una clase para una fecha que ya ha pasado.
            </p>
          </div>

          <div className="bg-background-secondary rounded-lg p-4 mb-6">
            <div className="text-center mb-3">
              <span className="text-lg font-semibold text-foreground">
                {studentName}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted mb-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(selectedDate)}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted">
              <Clock className="w-4 h-4" />
              <span>{selectedTime}</span>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-orange-800 dark:text-orange-200 font-medium mb-1">
                  Consideraciones importantes:
                </p>
                <ul className="text-orange-700 dark:text-orange-300 space-y-1 text-left">
                  <li>• Esta clase aparecerá en el historial como ya realizada</li>
                  <li>• Se generará automáticamente una factura si corresponde</li>
                  <li>• Asegúrate de que la información sea correcta</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={onConfirm}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Crear Clase en el Pasado
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
