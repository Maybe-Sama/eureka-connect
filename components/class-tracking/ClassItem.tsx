'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Euro, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  Save,
  X,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CourseFilteredSubjectSelector } from './CourseFilteredSubjectSelector'

interface ClassData {
  id: number
  student_id: number
  course_id: number
  start_time: string
  end_time: string
  duration: number
  day_of_week: number
  date: string
  subject: string | null
  is_recurring: boolean
  status: string
  payment_status: string
  price: number
  notes: string | null
  payment_date: string | null
  payment_notes: string | null
  students: {
    first_name: string
    last_name: string
    email: string
  }
  courses: {
    name: string
    price: number
    color: string
  }
}

interface ClassItemProps {
  classData: ClassData
  onUpdate: (updatedClass: ClassData) => void
  isBatchMode?: boolean
  isSelected?: boolean
  onToggleSelection?: (classId: number) => void
}

export const ClassItem = ({ classData, onUpdate, isBatchMode = false, isSelected = false, onToggleSelection }: ClassItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    status: classData.status,
    payment_status: classData.payment_status,
    payment_notes: classData.payment_notes || classData.notes || '',
    subject: classData.subject || ''
  })

  // Update editData when classData changes
  useEffect(() => {
    setEditData({
      status: classData.status,
      payment_status: classData.payment_status,
      payment_notes: classData.payment_notes || classData.notes || '',
      subject: classData.subject || ''
    })
  }, [classData.status, classData.payment_status, classData.payment_notes, classData.notes, classData.subject])

  const handleSave = async () => {
    try {
      // Check if trying to cancel a paid class
      if (editData.status === 'cancelled' && classData.payment_status === 'paid') {
        const confirmed = confirm(
          '⚠️ ADVERTENCIA: Esta clase ya ha sido pagada (€' + classData.price + ').\n\n' +
          '¿Estás seguro de que quieres cancelarla? Esto puede afectar los cálculos de ingresos.\n\n' +
          '¿Continuar con la cancelación?'
        )
        
        if (!confirmed) {
          return // Don't save if user cancels
        }
      }

      // Check if trying to change payment from paid to unpaid on a completed class
      if (editData.payment_status === 'unpaid' && classData.payment_status === 'paid' && 
          (classData.status === 'completed' || editData.status === 'completed')) {
        const confirmed = confirm(
          '⚠️ ADVERTENCIA: Esta clase completada ya ha sido pagada (€' + classData.price + ').\n\n' +
          '¿Estás seguro de que quieres marcarla como sin pagar? Esto afectará los cálculos de ingresos.\n\n' +
          '¿Continuar con el cambio?'
        )
        
        if (!confirmed) {
          return // Don't save if user cancels
        }
      }
      
      const response = await fetch(`/api/class-tracking/classes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: classData.id,
          ...editData
        }),
      })

      if (response.ok) {
        const updatedClass = await response.json()
        
        // Update the parent component first
        onUpdate(updatedClass)
        
        // Force update the local state immediately
        setEditData({
          status: updatedClass.status,
          payment_status: updatedClass.payment_status,
          payment_notes: updatedClass.payment_notes || '',
          subject: updatedClass.subject || ''
        })
        
        setIsEditing(false)
        toast.success('Clase actualizada exitosamente')
      } else {
        const errorData = await response.json()
        console.error('Error del servidor:', errorData)
        toast.error('Error al actualizar la clase')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      toast.error('Error al actualizar la clase')
    }
  }

  const handleCancel = () => {
    setEditData({
      status: classData.status,
      payment_status: classData.payment_status,
      payment_notes: classData.payment_notes || '',
      subject: classData.subject || ''
    })
    setIsEditing(false)
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />
      case 'cancelled':
        return <XCircle size={16} className="text-red-500" />
      case 'scheduled':
        return <Clock size={16} className="text-blue-500" />
      default:
        return <AlertCircle size={16} className="text-amber-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'cancelled':
        return 'text-red-500'
      case 'scheduled':
        return 'text-blue-500'
      default:
        return 'text-amber-500'
    }
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return 'text-green-500'
      case 'unpaid':
        return 'text-amber-500'
      default:
        return 'text-foreground-muted'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove seconds if present
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
    >
      <div className="p-4">
        {/* Header with Date and Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Selection Checkbox */}
            {isBatchMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection?.(classData.id)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
              />
            )}
            
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-foreground-muted" />
              <span className="font-medium text-foreground">
                {formatDate(classData.date)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-foreground-muted" />
              <span className="text-sm text-foreground-muted">
                {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {classData.is_recurring ? (
                <RefreshCw size={14} className="text-blue-500" />
              ) : (
                <Calendar size={14} className="text-purple-500" />
              )}
              <span className="text-xs text-foreground-muted">
                {classData.is_recurring ? 'Recurrente' : 'Eventual'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Euro size={16} className="text-foreground-muted" />
            <span className="font-medium text-foreground">
              €{classData.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Subject */}
        {classData.subject && (
          <div className="mb-3">
            <p className="text-sm text-foreground-muted mb-1">
              <strong>Asignatura:</strong> {classData.subject}
            </p>
          </div>
        )}

        {/* Status and Payment Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          {/* Status Control */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-foreground w-16">Estado:</span>
            {isEditing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="scheduled">Programada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            ) : (
              <div className="flex items-center space-x-2 flex-1">
                {getStatusIcon(classData.status)}
                <span className={`text-sm font-medium ${getStatusColor(classData.status)}`}>
                  {classData.status === 'scheduled' ? 'Programada' :
                   classData.status === 'completed' ? 'Completada' : 'Cancelada'}
                </span>
              </div>
            )}
          </div>

          {/* Payment Control */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-foreground w-16">Pago:</span>
            {isEditing ? (
              <select
                value={editData.payment_status}
                onChange={(e) => setEditData({ ...editData, payment_status: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="unpaid">Sin pagar</option>
                <option value="paid">Pagada</option>
              </select>
            ) : (
              <div className="flex items-center space-x-2 flex-1">
                <div className={`w-3 h-3 rounded-full ${classData.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className={`text-sm font-medium ${getPaymentStatusColor(classData.payment_status)}`}>
                  {classData.payment_status === 'paid' ? 'Pagada' : 'Sin pagar'}
                </span>
              </div>
            )}
          </div>
        </div>


        {/* Payment Date */}
        {classData.payment_date && (
          <div className="mb-3">
            <p className="text-xs text-foreground-muted">
              <strong>Fecha de pago:</strong> {new Date(classData.payment_date).toLocaleDateString('es-ES')}
            </p>
          </div>
        )}

        {/* Edit Subject */}
        {isEditing && (
          <div className="mb-3">
            <CourseFilteredSubjectSelector
              selectedSubject={editData.subject}
              onSubjectChange={(subject) => setEditData({ ...editData, subject })}
              courseName={classData.courses.name}
              placeholder="Selecciona una asignatura"
            />
          </div>
        )}

        {/* Edit Payment Notes */}
        {isEditing && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-foreground mb-2">
              Notas:
            </label>
            <input
              type="text"
              value={editData.payment_notes}
              onChange={(e) => setEditData({ ...editData, payment_notes: e.target.value })}
              placeholder="Notas adicionales sobre el pago..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-border">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleCancel}
                variant="outline"
              >
                <X size={14} className="mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save size={14} className="mr-1" />
                Guardar
              </Button>
            </>
          ) : !isBatchMode ? (
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary-hover"
            >
              <Edit size={14} className="mr-1" />
              Editar
            </Button>
          ) : (
            <div className="text-sm text-foreground-muted">
              {isSelected ? 'Seleccionada' : 'No seleccionada'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
