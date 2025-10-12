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

      const response = await fetch(`/api/class-tracking/classes?studentId=${user.studentId}&month=${selectedMonth}`)
      
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
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
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
            <BookOpen size={32} className="mr-3 text-primary" />
            Mis Clases
          </h1>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="flex items-center"
          >
            <RefreshCw size={20} className="mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Main Panel */}
        <div className="glass-effect rounded-xl p-6 border border-border">
          {/* Month Selector and Stats */}
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
            </div>
            
            {/* Quick Stats */}
            <div className="flex space-x-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-foreground-muted">Total Clases</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                <p className="text-foreground-muted">Completadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">€{stats.totalEarned.toFixed(2)}</p>
                <p className="text-foreground-muted">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">€{stats.totalPaid.toFixed(2)}</p>
                <p className="text-foreground-muted">Pagado</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={20} />
              <input
                type="text"
                placeholder="Buscar por asignatura, notas o curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-foreground-muted" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'recurring' | 'eventual')}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Todas las clases</option>
                  <option value="recurring">Recurrentes</option>
                  <option value="eventual">Eventuales</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-foreground-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'payment')}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="date">Ordenar por fecha</option>
                  <option value="status">Ordenar por estado</option>
                  <option value="payment">Ordenar por pago</option>
                </select>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="space-y-4">
            {sortedClasses.length > 0 ? (
              sortedClasses.map((cls) => (
                <StudentClassItem key={cls.id} classData={cls} />
              ))
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">No se encontraron clases para el mes seleccionado</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
