'use client'

import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Euro, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  BookOpen,
  MessageSquare
} from 'lucide-react'

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

interface StudentClassItemProps {
  classData: ClassData
}

export const StudentClassItem = ({ classData }: StudentClassItemProps) => {
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
    // Parsear fecha como local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconocido'
    }
  }

  const getPaymentText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return 'Pagada'
      case 'unpaid':
        return 'Sin pagar'
      default:
        return 'Desconocido'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-background rounded-lg sm:rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Course color accent */}
      <div 
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-60" 
        style={{ color: classData.courses.color }} 
      />
      
      <div className="p-3 sm:p-4 md:p-5">
        {/* Header with Date and Time - Mobile Optimized */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0">
              <Calendar size={16} className="text-foreground-muted flex-shrink-0" />
              <span className="font-semibold text-foreground text-sm sm:text-base lg:text-lg truncate">
                {formatDate(classData.date)}
              </span>
            </div>
            <div className="flex items-center space-x-2 min-w-0">
              <Clock size={16} className="text-foreground-muted flex-shrink-0" />
              <span className="text-xs sm:text-sm text-foreground-muted font-medium">
                {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {classData.is_recurring ? (
                <RefreshCw size={14} className="text-blue-500 flex-shrink-0" />
              ) : (
                <Calendar size={14} className="text-purple-500 flex-shrink-0" />
              )}
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted/50 text-foreground-muted whitespace-nowrap">
                {classData.is_recurring ? 'Recurrente' : 'Eventual'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Euro size={16} className="text-foreground-muted" />
            <span className="font-bold text-foreground text-sm sm:text-base lg:text-lg">
              €{classData.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Course Information */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 mb-2 min-w-0">
            <BookOpen size={14} className="text-foreground-muted flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-foreground-muted">Curso:</span>
            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">{classData.courses.name}</span>
          </div>
          {classData.students.has_shared_pricing && classData.courses.shared_class_price && (
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                Precio compartido: €{classData.courses.shared_class_price}/hora
              </span>
            </div>
          )}
        </div>

        {/* Subject and Payment Notes */}
        {(classData.subject || classData.payment_notes) && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted/30 rounded-lg">
            {classData.subject && (
              <p className="text-xs sm:text-sm text-foreground-muted mb-1 sm:mb-2">
                <strong className="text-foreground">Asignatura:</strong> {classData.subject}
              </p>
            )}
            {classData.payment_notes && (
              <p className="text-xs sm:text-sm text-foreground-muted">
                <strong className="text-foreground">Notas:</strong> {classData.payment_notes}
              </p>
            )}
          </div>
        )}

        {/* Status and Payment Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
          {/* Status Card */}
          <div className="p-2 sm:p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <span className="text-xs sm:text-sm font-medium text-foreground flex-shrink-0">Estado:</span>
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                {getStatusIcon(classData.status)}
                <span className={`text-xs sm:text-sm font-semibold ${getStatusColor(classData.status)} truncate`}>
                  {getStatusText(classData.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="p-2 sm:p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <span className="text-xs sm:text-sm font-medium text-foreground flex-shrink-0">Pago:</span>
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${classData.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className={`text-xs sm:text-sm font-semibold ${getPaymentStatusColor(classData.payment_status)} truncate`}>
                  {getPaymentText(classData.payment_status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicators - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs text-foreground-muted">
          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 sm:gap-4">
            <span>Duración: {classData.duration} min</span>
            <span className="hidden xs:inline">Día: {classData.day_of_week === 0 ? 'Domingo' : 
                         classData.day_of_week === 1 ? 'Lunes' :
                         classData.day_of_week === 2 ? 'Martes' :
                         classData.day_of_week === 3 ? 'Miércoles' :
                         classData.day_of_week === 4 ? 'Jueves' :
                         classData.day_of_week === 5 ? 'Viernes' : 'Sábado'}</span>
          </div>
          <div className="text-left sm:text-right">
            <span className="font-medium text-xs sm:text-sm">
              {classData.is_recurring ? 'Clase recurrente' : 'Clase eventual'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
