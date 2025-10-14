'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  Euro, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  Search,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { ClassTrackingCard } from './ClassTrackingCard'
import { ClassDetailsModal } from './ClassDetailsModal'
import { MonthlyReportModal } from './MonthlyReportModal'
import { toast } from 'sonner'

interface ClassTrackingData {
  id: number
  student_id: number
  course_id: number
  month_year: string
  students: {
    first_name: string
    last_name: string
    email: string
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

interface MonthlyReport {
  id: number
  month_year: string
  total_students: number
  total_classes_scheduled: number
  total_classes_completed: number
  total_classes_cancelled: number
  total_recurring_classes: number
  total_eventual_classes: number
  total_earned: number
  total_paid: number
  total_unpaid: number
  average_earned_per_student: number
}

const ClassTrackingDashboard = () => {
  const [trackingData, setTrackingData] = useState<ClassTrackingData[]>([])
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingClasses, setIsUpdatingClasses] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedStudent, setSelectedStudent] = useState<ClassTrackingData | null>(null)
  const [isClassDetailsOpen, setIsClassDetailsOpen] = useState(false)
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'eventual'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch tracking data
      const trackingResponse = await fetch(`/api/class-tracking?month=${selectedMonth}`)
      if (trackingResponse.ok) {
        const tracking = await trackingResponse.json()
        setTrackingData(tracking)
      }

      // Fetch monthly report
      const reportResponse = await fetch(`/api/class-tracking/monthly-report?month=${selectedMonth}`)
      if (reportResponse.ok) {
        const report = await reportResponse.json()
        setMonthlyReport(report)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  const handleRefresh = () => {
    fetchData()
  }

  const handleGenerateMissingClasses = async () => {
    try {
      setIsUpdatingClasses(true)
      toast.info('🔄 Generando clases faltantes hasta hoy... Esto puede tardar unos momentos')
      
      // Add timeout for long-running operations
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 seconds timeout
      
      const response = await fetch('/api/class-tracking/generate-missing-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const result = await response.json()
        
        // Enhanced success message with more details
        if (result.totalClassesCreated > 0) {
          toast.success(`✅ ¡Perfecto! Se generaron ${result.totalClassesCreated} clases nuevas para ${result.studentsProcessed} estudiantes hasta hoy`)
        } else {
          toast.success(`✅ Verificación completada. Todas las clases están actualizadas hasta hoy (${result.studentsProcessed} estudiantes procesados)`)
        }
        
        fetchData() // Refresh data
      } else {
        const error = await response.json()
        toast.error(`❌ Error: ${error.error || 'No se pudieron generar las clases'}`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('⏰ La operación tardó demasiado tiempo. Por favor, inténtalo de nuevo.')
      } else {
        console.error('Error generating missing classes:', error)
        toast.error('❌ Error al generar las clases faltantes. Verifica la conexión e inténtalo de nuevo.')
      }
    } finally {
      setIsUpdatingClasses(false)
    }
  }

  const handleStudentClick = (student: ClassTrackingData) => {
    setSelectedStudent(student)
    setIsClassDetailsOpen(true)
  }


  const handleClassUpdate = () => {
    fetchData() // Refresh data after class update
  }

  // Filter and search
  const filteredData = trackingData.filter(student => {
    const matchesSearch = 
      student.students.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.students.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.students.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || 
      (filterType === 'recurring' && student.recurring_classes_scheduled > 0) ||
      (filterType === 'eventual' && student.eventual_classes_scheduled > 0)
    
    return matchesSearch && matchesType
  })

  // Calculate totals
  const totals = {
    students: trackingData.length,
    classesScheduled: trackingData.reduce((sum, s) => sum + s.total_classes_scheduled, 0),
    classesCompleted: trackingData.reduce((sum, s) => sum + s.total_classes_completed, 0),
    classesCancelled: trackingData.reduce((sum, s) => sum + s.total_classes_cancelled, 0),
    recurringClasses: trackingData.reduce((sum, s) => sum + s.recurring_classes_scheduled, 0),
    eventualClasses: trackingData.reduce((sum, s) => sum + s.eventual_classes_scheduled, 0),
    totalEarned: trackingData.reduce((sum, s) => sum + s.total_earned, 0),
    totalPaid: trackingData.reduce((sum, s) => sum + s.total_paid, 0),
    totalUnpaid: trackingData.reduce((sum, s) => sum + s.total_unpaid, 0),
    recurringEarned: trackingData.reduce((sum, s) => sum + s.recurring_earned, 0),
    eventualEarned: trackingData.reduce((sum, s) => sum + s.eventual_earned, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
      </div>
    )
  }

  // Show updating classes overlay
  if (isUpdatingClasses) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <DiagonalBoxLoader size="lg" color="hsl(var(--success))" />
          </div>
          <p className="text-foreground-muted text-lg font-medium">Actualizando clases hasta hoy...</p>
          <p className="text-foreground-muted text-sm mt-2">Esto puede tardar unos momentos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Calendar size={32} className="mr-3 text-primary" />
            Seguimiento de Clases
          </h1>
          <div className="flex gap-2">
            <div className="relative group">
              <Button 
                onClick={handleGenerateMissingClasses} 
                variant="outline" 
                disabled={isUpdatingClasses}
                className="flex items-center bg-green-500/10 border-green-500 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingClasses ? (
                  <DiagonalBoxLoader size="sm" color="hsl(var(--success))" className="mr-2" />
                ) : (
                  <RefreshCw size={20} className="mr-2" />
                )}
                {isUpdatingClasses ? 'Actualizando...' : 'Actualizar Clases hasta Hoy'}
              </Button>
              
              {/* Enhanced Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="flex items-center space-x-2">
                  <Info size={16} />
                  <div>
                    <div className="font-semibold">Generar clases faltantes</div>
                    <div className="text-xs text-gray-300">
                      Crea automáticamente todas las clases desde la fecha de inicio de cada estudiante hasta hoy
                    </div>
                    <div className="text-xs text-gray-300">
                      Solo genera clases nuevas, no duplica las existentes
                    </div>
                  </div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <Button 
              onClick={() => setIsMonthlyReportOpen(true)} 
              variant="outline" 
              className="flex items-center"
            >
              <Download size={20} className="mr-2" />
              Reporte Mensual
            </Button>
          </div>
        </div>

        {/* Main Panel */}
        <div className="glass-effect rounded-xl p-6 border border-border">
          {/* Header with Month Selector and Stats */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Mes:</label>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => {
                      const [year, month] = selectedMonth.split('-').map(Number)
                      const prevMonth = month === 1 ? 12 : month - 1
                      const prevYear = month === 1 ? year - 1 : year
                      setSelectedMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`)
                    }}
                    variant="outline" 
                    size="sm"
                    className="px-2"
                  >
                    ←
                  </Button>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button 
                    onClick={() => {
                      const [year, month] = selectedMonth.split('-').map(Number)
                      const nextMonth = month === 12 ? 1 : month + 1
                      const nextYear = month === 12 ? year + 1 : year
                      const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`
                      // Don't go beyond current month
                      const currentMonth = new Date().toISOString().slice(0, 7)
                      if (nextMonthStr <= currentMonth) {
                        setSelectedMonth(nextMonthStr)
                      }
                    }}
                    variant="outline" 
                    size="sm"
                    className="px-2"
                    disabled={selectedMonth >= new Date().toISOString().slice(0, 7)}
                  >
                    →
                  </Button>
                </div>
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="flex items-center">
                <RefreshCw size={16} className="mr-2" />
                Actualizar
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="flex space-x-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{totals.students}</p>
                <p className="text-foreground-muted">Alumnos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{totals.classesCompleted}</p>
                <p className="text-foreground-muted">Completadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">€{totals.totalPaid.toFixed(2)}</p>
                <p className="text-foreground-muted">Pagado</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={20} />
              <input
                type="text"
                placeholder="Buscar alumno por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-3">
            {filteredData.length > 0 ? (
              filteredData.map((student) => (
                <motion.div
                  key={student.student_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="p-4">
                    {/* Student Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {student.students.first_name} {student.students.last_name}
                          </h3>
                          <p className="text-sm text-foreground-muted">{student.students.email}</p>
                          <p className="text-sm text-foreground-muted">{student.courses.name}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleStudentClick(student)}
                        className="bg-primary hover:bg-primary-hover"
                      >
                        Ver Clases
                      </Button>
                    </div>

                    {/* Student Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{student.total_classes_scheduled}</p>
                        <p className="text-xs text-foreground-muted">Total Clases</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-500">{student.total_classes_completed}</p>
                        <p className="text-xs text-foreground-muted">Completadas</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-500">{student.total_classes_cancelled || 0}</p>
                        <p className="text-xs text-foreground-muted">Canceladas</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">€{student.total_earned.toFixed(2)}</p>
                        <p className="text-xs text-foreground-muted">Ingresos</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-500">€{student.total_paid.toFixed(2)}</p>
                        <p className="text-xs text-foreground-muted">Pagado</p>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-foreground-muted mb-1">
                          <span>Progreso de Clases</span>
                          <span>{student.total_classes_scheduled > 0 ? Math.round((student.total_classes_completed / student.total_classes_scheduled) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-background-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${student.total_classes_scheduled > 0 ? Math.round((student.total_classes_completed / student.total_classes_scheduled) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-foreground-muted mb-1">
                          <span>Progreso de Pagos</span>
                          <span>{student.total_earned > 0 ? Math.round((student.total_paid / student.total_earned) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-background-secondary rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${student.total_earned > 0 ? Math.round((student.total_paid / student.total_earned) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">No se encontraron alumnos para el mes seleccionado</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {selectedStudent && (
        <ClassDetailsModal
          isOpen={isClassDetailsOpen}
          onClose={() => {
            setIsClassDetailsOpen(false)
            setSelectedStudent(null)
          }}
          student={selectedStudent}
          month={selectedMonth}
          onClassUpdate={handleClassUpdate}
        />
      )}

      <MonthlyReportModal
        isOpen={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
        report={monthlyReport}
        month={selectedMonth}
      />

    </div>
  )
}

export default ClassTrackingDashboard
