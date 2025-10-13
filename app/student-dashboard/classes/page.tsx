'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { StudentClassItem } from '@/components/students/StudentClassItem'
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
    has_shared_pricing?: boolean
  }
  courses: {
    name: string
    price: number
    shared_class_price?: number
    color: string
  }
}

export default function StudentClassesPage() {
  // Responsive page - Updated for mobile optimization
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'eventual'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'payment'>('date')

  useEffect(() => {
    if (!loading) {
      if (!isStudent) {
        router.push('/login')
      } else {
        fetchClasses()
      }
    }
  }, [loading, isStudent, router, selectedMonth])

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      
      if (!user?.studentId) {
        toast.error('No se pudo obtener la información del estudiante')
        return
      }

      // Validar que studentId sea un número válido
      if (isNaN(Number(user.studentId))) {
        console.error('Invalid studentId:', user.studentId)
        toast.error('ID de estudiante inválido')
        return
      }

      const url = `/api/class-tracking/classes?studentId=${user.studentId}&month=${selectedMonth}`
      console.log('Fetching URL:', url)
      
      // Validar que la URL sea válida
      try {
        const fullUrl = new URL(url, window.location.origin)
        console.log('Full URL:', fullUrl.toString())
      } catch (urlError) {
        console.error('Invalid URL:', url, urlError)
        toast.error('Error en la URL de la solicitud')
        return
      }
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al cargar las clases')
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Error al cargar las clases')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchClasses()
  }

  // Filter and search classes
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = 
      cls.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.payment_notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.courses.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || 
      (filterType === 'recurring' && cls.is_recurring) ||
      (filterType === 'eventual' && !cls.is_recurring)
    
    return matchesSearch && matchesType
  })

  // Sort classes
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case 'status':
        const statusOrder = { 'completed': 0, 'scheduled': 1, 'cancelled': 2 }
        return (statusOrder[a.status as keyof typeof statusOrder] || 3) - 
               (statusOrder[b.status as keyof typeof statusOrder] || 3)
      case 'payment':
        const paymentOrder = { 'paid': 0, 'unpaid': 1 }
        return (paymentOrder[a.payment_status as keyof typeof paymentOrder] || 2) - 
               (paymentOrder[b.payment_status as keyof typeof paymentOrder] || 2)
      default:
        return 0
    }
  })

  // Calculate statistics
  const stats = {
    total: classes.length,
    completed: classes.filter(c => c.status === 'completed').length,
    cancelled: classes.filter(c => c.status === 'cancelled').length,
    paid: classes.filter(c => c.payment_status === 'paid').length,
    unpaid: classes.filter(c => c.payment_status === 'unpaid').length,
    totalEarned: classes.reduce((sum, c) => sum + c.price, 0),
    totalPaid: classes.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + c.price, 0),
    totalUnpaid: classes.filter(c => c.payment_status === 'unpaid').reduce((sum, c) => sum + c.price, 0)
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh] p-3 sm:p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 sm:mb-4 md:mb-6"
        >
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
            <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center">
              <BookOpen size={18} className="mr-2 text-primary" />
              <span className="hidden xs:inline">Mis Clases</span>
              <span className="xs:hidden">Clases</span>
            </h1>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="w-full xs:w-auto h-9 xs:h-auto text-xs sm:text-sm"
              size="sm"
            >
              <RefreshCw size={14} className="mr-1 xs:mr-2" />
              <span>Actualizar</span>
            </Button>
          </div>

          {/* Main Panel */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 border border-border/50 shadow-lg">
            {/* Month Selector and Stats Row */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
              {/* Month Selector */}
              <div className="flex-1 w-full min-w-0">
                <label className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2 block">Mes:</label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button 
                    onClick={() => {
                      const [year, month] = selectedMonth.split('-').map(Number)
                      const prevMonth = month === 1 ? 12 : month - 1
                      const prevYear = month === 1 ? year - 1 : year
                      setSelectedMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`)
                    }}
                    variant="outline" 
                    size="sm"
                    className="px-2 sm:px-3 h-8 sm:h-9 text-xs sm:text-sm flex-shrink-0"
                  >
                    ←
                  </Button>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-background border border-border rounded-lg text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button 
                    onClick={() => {
                      const [year, month] = selectedMonth.split('-').map(Number)
                      const nextMonth = month === 12 ? 1 : month + 1
                      const nextYear = month === 12 ? year + 1 : year
                      const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`
                      const currentMonth = new Date().toISOString().slice(0, 7)
                      if (nextMonthStr <= currentMonth) {
                        setSelectedMonth(nextMonthStr)
                      }
                    }}
                    variant="outline" 
                    size="sm"
                    className="px-2 sm:px-3 h-8 sm:h-9 text-xs sm:text-sm flex-shrink-0"
                    disabled={selectedMonth >= new Date().toISOString().slice(0, 7)}
                  >
                    →
                  </Button>
                </div>
              </div>
              
              {/* Quick Stats - Optimized for mobile */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 w-full xl:w-auto">
                <div className="text-center p-1.5 sm:p-2 md:p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 md:p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-green-500">{stats.completed}</p>
                  <p className="text-xs text-foreground-muted">Completadas</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 md:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs sm:text-sm md:text-xl font-bold text-blue-500">€{stats.totalEarned.toFixed(0)}</p>
                  <p className="text-xs text-foreground-muted">Total</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 md:p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs sm:text-sm md:text-xl font-bold text-green-500">€{stats.totalPaid.toFixed(0)}</p>
                  <p className="text-xs text-foreground-muted">Pagado</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4 md:mb-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={14} />
                <input
                  type="text"
                  placeholder="Buscar por asignatura, notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 sm:pl-8 md:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-background border border-border rounded-lg text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'recurring' | 'eventual')}
                    className="w-full px-2 sm:px-3 py-2 bg-background border border-border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todas las clases</option>
                    <option value="recurring">Recurrentes</option>
                    <option value="eventual">Eventuales</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'payment')}
                    className="w-full px-2 sm:px-3 py-2 bg-background border border-border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="date">Ordenar por fecha</option>
                    <option value="status">Ordenar por estado</option>
                    <option value="payment">Ordenar por pago</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Classes List */}
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {sortedClasses.length > 0 ? (
                sortedClasses.map((cls) => (
                  <StudentClassItem key={cls.id} classData={cls} />
                ))
              ) : (
                <div className="text-center py-4 sm:py-6 md:py-8 lg:py-12">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-foreground-muted mx-auto mb-2 sm:mb-3 lg:mb-4" />
                  <p className="text-xs sm:text-sm md:text-base text-foreground-muted px-4">No se encontraron clases para el mes seleccionado</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
