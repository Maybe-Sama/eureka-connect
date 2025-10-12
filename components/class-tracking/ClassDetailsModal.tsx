'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Calendar, 
  Clock, 
  Euro, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Edit,
  Save,
  Filter,
  Search,
  Plus,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { ClassItem } from './ClassItem'
import { toast } from 'sonner'

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

interface ClassTrackingData {
  id: number
  student_id: number
  course_id: number
  month_year: string
  students: {
    first_name: string
    last_name: string
    email: string
    start_date?: string
    has_shared_pricing?: boolean
  }
  courses: {
    name: string
    price: number
    shared_class_price?: number
    color: string
  }
  total_classes_scheduled: number
  total_classes_completed: number
  total_classes_cancelled: number
  recurring_classes_scheduled: number
  recurring_classes_completed: number
  recurring_classes_cancelled: number
  eventual_classes_scheduled: number
  eventual_classes_completed: number
  eventual_classes_cancelled: number
  classes_paid: number
  classes_unpaid: number
  recurring_classes_paid: number
  recurring_classes_unpaid: number
  eventual_classes_paid: number
  eventual_classes_unpaid: number
  total_earned: number
  total_paid: number
  total_unpaid: number
  recurring_earned: number
  recurring_paid: number
  recurring_unpaid: number
  eventual_earned: number
  eventual_paid: number
  eventual_unpaid: number
}

interface ClassDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  student: ClassTrackingData
  month: string
  onClassUpdate: () => void
}

export const ClassDetailsModal = ({ 
  isOpen, 
  onClose, 
  student, 
  month, 
  onClassUpdate 
}: ClassDetailsModalProps) => {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [classesLoaded, setClassesLoaded] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'eventual'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch classes for the student
  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/class-tracking/classes?studentId=${student.student_id}&month=${month}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      } else {
        toast.error('Error al cargar las clases')
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Error al cargar las clases')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && !classesLoaded) {
      fetchClasses()
      setClassesLoaded(true)
    }
  }, [isOpen, student.student_id, month])

  // Reset classesLoaded when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClassesLoaded(false)
      setClasses([])
    }
  }, [isOpen])

  const handleClassUpdate = (updatedClass: ClassData) => {
    setClasses(prev => {
      const newClasses = prev.map(c => c.id === updatedClass.id ? updatedClass : c)
      return newClasses
    })
    
    // Update the main dashboard immediately
    onClassUpdate()
  }

  const handleClose = () => {
    onClose()
  }

  const handleClassDelete = async (classId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase?')) return

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setClasses(prev => prev.filter(c => c.id !== classId))
        onClassUpdate()
        toast.success('Clase eliminada exitosamente')
      } else {
        toast.error('Error al eliminar la clase')
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Error al eliminar la clase')
    }
  }

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const matchesType = filterType === 'all' || 
      (filterType === 'recurring' && cls.is_recurring) ||
      (filterType === 'eventual' && !cls.is_recurring)
    
    const matchesStatus = filterStatus === 'all' || cls.status === filterStatus
    const matchesPayment = filterPayment === 'all' || cls.payment_status === filterPayment
    
    const matchesSearch = searchTerm === '' || 
      cls.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.date.includes(searchTerm)

    return matchesType && matchesStatus && matchesPayment && matchesSearch
  })


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-border"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {student.students.first_name} {student.students.last_name}
              </h2>
              <p className="text-foreground-muted">{student.courses.name}</p>
              <p className="text-sm text-foreground-muted mt-1">
                📅 {student.students.start_date 
                  ? `Clases desde ${new Date(student.students.start_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} hasta hoy`
                  : 'Todas las clases hasta hoy'
                }
              </p>
            </div>
            <Button variant="ghost" onClick={handleClose} size="sm">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{student.total_classes_scheduled}</p>
              <p className="text-sm text-foreground-muted">Total Clases</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{student.total_classes_completed}</p>
              <p className="text-sm text-foreground-muted">Completadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{student.total_classes_cancelled || 0}</p>
              <p className="text-sm text-foreground-muted">Canceladas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">€{student.total_earned.toFixed(2)}</p>
              <p className="text-sm text-foreground-muted">Ingresos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">€{student.total_paid.toFixed(2)}</p>
              <p className="text-sm text-foreground-muted">Pagado</p>
            </div>
          </div>
          
          {/* Progress Bars */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm text-foreground-muted mb-2">
                <span>Progreso de Clases</span>
                <span>{student.total_classes_scheduled > 0 ? Math.round((student.total_classes_completed / student.total_classes_scheduled) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${student.total_classes_scheduled > 0 ? Math.round((student.total_classes_completed / student.total_classes_scheduled) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-foreground-muted mb-2">
                <span>Progreso de Pagos</span>
                <span>{student.total_earned > 0 ? Math.round((student.total_paid / student.total_earned) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${student.total_earned > 0 ? Math.round((student.total_paid / student.total_earned) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={20} />
              <input
                type="text"
                placeholder="Buscar por asignatura, notas o fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'scheduled' | 'completed' | 'cancelled')}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los estados</option>
                <option value="scheduled">Programadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value as 'all' | 'paid' | 'unpaid')}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los pagos</option>
                <option value="paid">Pagadas</option>
                <option value="unpaid">Sin pagar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <DiagonalBoxLoader size="md" color="hsl(var(--primary))" />
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="space-y-3">
              {filteredClasses.map((classData) => (
                <ClassItem
                  key={`${classData.id}-${classData.status}-${classData.payment_status}`}
                  classData={classData}
                  onUpdate={handleClassUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
              <p className="text-foreground-muted">No se encontraron clases con los filtros aplicados</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex justify-between items-center">
            <div className="text-sm text-foreground-muted">
              Mostrando {filteredClasses.length} de {classes.length} clases
            </div>
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
