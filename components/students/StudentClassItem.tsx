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
    const date = new Date(dateString)
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
      className="bg-background rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Course color accent */}
      <div 
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-60" 
        style={{ color: classData.courses.color }} 
      />
      
      <div className="p-5">
        {/* Header with Date and Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar size={18} className="text-foreground-muted" />
              <span className="font-semibold text-foreground text-lg">
                {formatDate(classData.date)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={18} className="text-foreground-muted" />
              <span className="text-sm text-foreground-muted font-medium">
                {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {classData.is_recurring ? (
                <RefreshCw size={16} className="text-blue-500" />
              ) : (
                <Calendar size={16} className="text-purple-500" />
              )}
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted/50 text-foreground-muted">
                {classData.is_recurring ? 'Recurrente' : 'Eventual'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Euro size={18} className="text-foreground-muted" />
            <span className="font-bold text-foreground text-lg">
              €{classData.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Course Information */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen size={16} className="text-foreground-muted" />
            <span className="text-sm font-medium text-foreground-muted">Curso:</span>
            <span className="text-sm font-semibold text-foreground">{classData.courses.name}</span>
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
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            {classData.subject && (
              <p className="text-sm text-foreground-muted mb-2">
                <strong className="text-foreground">Asignatura:</strong> {classData.subject}
              </p>
            )}
            {classData.payment_notes && (
              <p className="text-sm text-foreground-muted">
                <strong className="text-foreground">Notas:</strong> {classData.payment_notes}
              </p>
            )}
          </div>
        )}

        {/* Status and Payment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Status Card */}
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-foreground">Estado:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(classData.status)}
                <span className={`text-sm font-semibold ${getStatusColor(classData.status)}`}>
                  {getStatusText(classData.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-foreground">Pago:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${classData.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className={`text-sm font-semibold ${getPaymentStatusColor(classData.payment_status)}`}>
                  {getPaymentText(classData.payment_status)}
                </span>
              </div>
            </div>
          </div>
        </div>

      
       

        {/* Progress Indicators */}
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <div className="flex items-center space-x-4">
            <span>Duración: {classData.duration} min</span>
            <span>Día: {classData.day_of_week === 0 ? 'Domingo' : 
                         classData.day_of_week === 1 ? 'Lunes' :
                         classData.day_of_week === 2 ? 'Martes' :
                         classData.day_of_week === 3 ? 'Miércoles' :
                         classData.day_of_week === 4 ? 'Jueves' :
                         classData.day_of_week === 5 ? 'Viernes' : 'Sábado'}</span>
          </div>
          <div className="text-right">
            <span className="font-medium">
              {classData.is_recurring ? 'Clase recurrente' : 'Clase eventual'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
