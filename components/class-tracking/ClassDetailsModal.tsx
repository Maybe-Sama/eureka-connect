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
import { CourseFilteredSubjectSelector } from './CourseFilteredSubjectSelector'
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
  
  // Batch editing states
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set())
  const [batchEditData, setBatchEditData] = useState({
    status: '',
    payment_status: '',
    subject: '',
    payment_notes: ''
  })
  const [isSavingBatch, setIsSavingBatch] = useState(false)

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

  // Batch editing functions
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode)
    setSelectedClasses(new Set())
    setBatchEditData({
      status: '',
      payment_status: '',
      subject: '',
      payment_notes: ''
    })
  }

  const toggleClassSelection = (classId: number) => {
    const newSelected = new Set(selectedClasses)
    if (newSelected.has(classId)) {
      newSelected.delete(classId)
    } else {
      newSelected.add(classId)
    }
    setSelectedClasses(newSelected)
  }

  const selectAllVisible = () => {
    const visibleClassIds = filteredClasses.map(c => c.id)
    setSelectedClasses(new Set(visibleClassIds))
  }

  const clearSelection = () => {
    setSelectedClasses(new Set())
  }

  const handleBatchSave = async () => {
    if (selectedClasses.size === 0) {
      toast.error('No hay clases seleccionadas')
      return
    }

    // Validate that at least one field is being changed
    const hasChanges = Object.values(batchEditData).some(value => value !== '')
    if (!hasChanges) {
      toast.error('No hay cambios para guardar')
      return
    }

    try {
      setIsSavingBatch(true)
      
      // Prepare updates for each selected class
      const updates = Array.from(selectedClasses).map(classId => {
        const classData = classes.find(c => c.id === classId)
        if (!classData) return null

        const updateData: any = { classId }
        
        // Only include fields that have been changed
        if (batchEditData.status) updateData.status = batchEditData.status
        if (batchEditData.payment_status) updateData.payment_status = batchEditData.payment_status
        if (batchEditData.subject) updateData.subject = batchEditData.subject
        if (batchEditData.payment_notes) updateData.payment_notes = batchEditData.payment_notes

        return updateData
      }).filter(Boolean)

      console.log('Sending batch update:', { updates, batchEditData, selectedClasses: Array.from(selectedClasses) })

      // Send batch update
      const response = await fetch('/api/class-tracking/classes/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      })

      if (response.ok) {
        const result = await response.json()
        const updatedClasses = result.updatedClasses || result
        
        // Update local state
        setClasses(prev => {
          const newClasses = [...prev]
          updatedClasses.forEach((updatedClass: ClassData) => {
            const index = newClasses.findIndex(c => c.id === updatedClass.id)
            if (index !== -1) {
              newClasses[index] = updatedClass
            }
          })
          return newClasses
        })

        // Update parent component
        onClassUpdate()
        
        // Reset batch editing
        setSelectedClasses(new Set())
        setBatchEditData({
          status: '',
          payment_status: '',
          subject: '',
          payment_notes: ''
        })
        setIsBatchMode(false)
        
        if (result.errors && result.errors.length > 0) {
          toast.success(`✅ ${updatedClasses.length} clases actualizadas, pero hubo ${result.errors.length} errores`)
          console.warn('Batch update errors:', result.errors)
        } else {
          toast.success(`✅ ${updatedClasses.length} clases actualizadas exitosamente`)
        }
      } else {
        const errorData = await response.json()
        console.error('Batch update error:', errorData)
        toast.error(`Error al actualizar las clases: ${errorData.error || 'Error desconocido'}`)
        if (errorData.details) {
          console.error('Error details:', errorData.details)
        }
      }
    } catch (error) {
      console.error('Error saving batch updates:', error)
      toast.error('Error al guardar los cambios')
    } finally {
      setIsSavingBatch(false)
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
          
          {/* Batch Editing Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={toggleBatchMode}
                variant={isBatchMode ? "default" : "outline"}
                className={isBatchMode ? "bg-primary" : ""}
              >
                <Edit size={16} className="mr-2" />
                {isBatchMode ? 'Salir del Modo Lote' : 'Edición en Lote'}
              </Button>
              
              {isBatchMode && (
                <>
                  <Button
                    onClick={selectAllVisible}
                    variant="outline"
                    size="sm"
                  >
                    Seleccionar Todas
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    size="sm"
                  >
                    Limpiar Selección
                  </Button>
                  <span className="text-sm text-foreground-muted">
                    {selectedClasses.size} clase{selectedClasses.size !== 1 ? 's' : ''} seleccionada{selectedClasses.size !== 1 ? 's' : ''}
                  </span>
                </>
              )}
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
                  isBatchMode={isBatchMode}
                  isSelected={selectedClasses.has(classData.id)}
                  onToggleSelection={toggleClassSelection}
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

        {/* Batch Edit Panel */}
        {isBatchMode && selectedClasses.size > 0 && (
          <div className="p-6 border-t border-border bg-background-secondary/50">
            <div className="bg-background rounded-lg border border-border p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Edit size={20} className="mr-2" />
                Editar {selectedClasses.size} Clase{selectedClasses.size !== 1 ? 's' : ''} Seleccionada{selectedClasses.size !== 1 ? 's' : ''}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Estado:
                  </label>
                  <select
                    value={batchEditData.status}
                    onChange={(e) => setBatchEditData({ ...batchEditData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No cambiar estado</option>
                    <option value="scheduled">Programada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Estado de Pago:
                  </label>
                  <select
                    value={batchEditData.payment_status}
                    onChange={(e) => setBatchEditData({ ...batchEditData, payment_status: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No cambiar pago</option>
                    <option value="unpaid">Sin pagar</option>
                    <option value="paid">Pagada</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Asignatura:
                  </label>
                  <CourseFilteredSubjectSelector
                    selectedSubject={batchEditData.subject}
                    onSubjectChange={(subject) => setBatchEditData({ ...batchEditData, subject })}
                    courseName={student.courses.name}
                    placeholder="Selecciona una asignatura (opcional)"
                  />
                </div>

                {/* Payment Notes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notas:
                  </label>
                  <input
                    type="text"
                    value={batchEditData.payment_notes}
                    onChange={(e) => setBatchEditData({ ...batchEditData, payment_notes: e.target.value })}
                    placeholder="Dejar vacío para no cambiar"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={clearSelection}
                  variant="outline"
                  disabled={isSavingBatch}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBatchSave}
                  disabled={isSavingBatch || !Object.values(batchEditData).some(value => value !== '')}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isSavingBatch ? (
                    <>
                      <DiagonalBoxLoader size="sm" color="white" className="mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

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
