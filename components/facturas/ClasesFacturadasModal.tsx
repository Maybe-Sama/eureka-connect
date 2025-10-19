'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  BookOpen, 
  Euro,
  User,
  FileText,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClaseFacturada {
  id: number
  date: string
  start_time: string
  end_time: string
  subject: string
  price: number
  students: {
    first_name: string
    last_name: string
  }
}

interface ClasesFacturadasModalProps {
  isOpen: boolean
  onClose: () => void
  clasesFacturadas: ClaseFacturada[]
  onEliminarFactura?: (claseId: number) => void
}

const ClasesFacturadasModal = ({ 
  isOpen, 
  onClose, 
  clasesFacturadas,
  onEliminarFactura 
}: ClasesFacturadasModalProps) => {
  if (!isOpen) return null

  const formatearFecha = (fecha: string) => {
    // Parsear fecha como local para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatearHora = (hora: string) => {
    return hora.substring(0, 5) // HH:MM
  }

  const formatearPrecio = (precio: number) => {
    return precio.toFixed(2)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-warning/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Clases Ya Facturadas
                </h2>
                <p className="text-sm text-foreground-muted">
                  Estas clases ya han sido utilizadas en otras facturas
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="absolute top-4 right-4"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {clasesFacturadas.map((clase, index) => (
                <motion.div
                  key={clase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border border-warning/20 bg-warning/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText size={16} className="text-warning" />
                        <span className="font-medium text-foreground">
                          Clase ID {clase.id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <User size={14} className="text-foreground-muted" />
                          <span className="text-foreground-muted">Estudiante:</span>
                          <span className="font-medium text-foreground">
                            {clase.students.first_name} {clase.students.last_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-foreground-muted" />
                          <span className="text-foreground-muted">Fecha:</span>
                          <span className="font-medium text-foreground">
                            {formatearFecha(clase.date)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-foreground-muted" />
                          <span className="text-foreground-muted">Horario:</span>
                          <span className="font-medium text-foreground">
                            {formatearHora(clase.start_time)} - {formatearHora(clase.end_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <BookOpen size={14} className="text-foreground-muted" />
                          <span className="text-foreground-muted">Asignatura:</span>
                          <span className="font-medium text-foreground">
                            {clase.subject || 'Clase particular'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Euro size={14} className="text-foreground-muted" />
                          <span className="text-foreground-muted">Precio:</span>
                          <span className="font-medium text-foreground">
                            €{formatearPrecio(clase.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {onEliminarFactura && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEliminarFactura(clase.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Ver Factura
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground-muted">
                💡 <strong>Solución:</strong> Elimina la factura provisional que contiene estas clases o selecciona otras clases diferentes.
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Entendido
                </Button>
                <Button 
                  onClick={() => {
                    // Aquí podrías implementar navegación a la gestión de facturas
                    onClose()
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Ver Facturas
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ClasesFacturadasModal
