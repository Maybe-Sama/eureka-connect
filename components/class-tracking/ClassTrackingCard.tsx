'use client'

import { motion } from 'framer-motion'
import { 
  User, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Euro, 
  TrendingUp,
  AlertCircle,
  Calendar,
  RefreshCw
} from 'lucide-react'

interface ClassTrackingData {
  id: number
  student_id: number
  course_id: number
  month_year: string
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

interface ClassTrackingCardProps {
  data: ClassTrackingData
  onClick: () => void
}

export const ClassTrackingCard = ({ data, onClick }: ClassTrackingCardProps) => {
  const completionRate = data.total_classes_scheduled > 0 
    ? Math.round((data.total_classes_completed / data.total_classes_scheduled) * 100) 
    : 0

  const paymentRate = data.total_earned > 0 
    ? Math.round((data.total_paid / data.total_earned) * 100) 
    : 0

  const hasUnpaidClasses = data.total_unpaid > 0
  const hasCancelledClasses = data.total_classes_cancelled > 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-effect card-hover rounded-lg p-5 border border-border relative overflow-hidden cursor-pointer"
      style={{ borderColor: data.courses.color }}
    >
      {/* Top border with course color */}
      <div 
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent" 
        style={{ color: data.courses.color }} 
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <User size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {data.students.first_name} {data.students.last_name}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {hasUnpaidClasses && (
            <AlertCircle size={16} className="text-amber-500" />
          )}
          {hasCancelledClasses && (
            <XCircle size={16} className="text-red-500" />
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <BookOpen size={16} className="text-foreground-muted" />
          <span className="text-sm text-foreground-muted">{data.courses.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Euro size={16} className="text-foreground-muted" />
          <span className="text-sm text-foreground-muted">€{data.courses.price}/hora</span>
        </div>
      </div>

      {/* Classes Summary */}
      <div className="space-y-3 mb-4">
        {/* Total Classes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-foreground-muted" />
            <span className="text-sm text-foreground-muted">Total Clases</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">{data.total_classes_scheduled}</span>
            <div className="flex items-center space-x-1">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-xs text-green-500">{data.total_classes_completed}</span>
              {data.total_classes_cancelled > 0 && (
                <>
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-xs text-red-500">{data.total_classes_cancelled}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recurring Classes */}
        {data.recurring_classes_scheduled > 0 && (
          <div className="flex items-center justify-between pl-4">
            <div className="flex items-center space-x-2">
              <RefreshCw size={14} className="text-foreground-muted" />
              <span className="text-xs text-foreground-muted">Recurrentes</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-foreground">{data.recurring_classes_scheduled}</span>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} className="text-green-500" />
                <span className="text-xs text-green-500">{data.recurring_classes_completed}</span>
                {data.recurring_classes_cancelled > 0 && (
                  <>
                    <XCircle size={12} className="text-red-500" />
                    <span className="text-xs text-red-500">{data.recurring_classes_cancelled}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Eventual Classes */}
        {data.eventual_classes_scheduled > 0 && (
          <div className="flex items-center justify-between pl-4">
            <div className="flex items-center space-x-2">
              <Calendar size={14} className="text-foreground-muted" />
              <span className="text-xs text-foreground-muted">Eventuales</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-foreground">{data.eventual_classes_scheduled}</span>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} className="text-green-500" />
                <span className="text-xs text-green-500">{data.eventual_classes_completed}</span>
                {data.eventual_classes_cancelled > 0 && (
                  <>
                    <XCircle size={12} className="text-red-500" />
                    <span className="text-xs text-red-500">{data.eventual_classes_cancelled}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-foreground-muted">Progreso</span>
          <span className="text-xs font-medium text-foreground">{completionRate}%</span>
        </div>
        <div className="w-full bg-background-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Ingresos</span>
          <span className="text-sm font-bold text-foreground">€{data.total_earned.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground-muted">Pagado</span>
          <span className="text-green-500">€{data.total_paid.toFixed(2)}</span>
        </div>
        
        {data.total_unpaid > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground-muted">Pendiente</span>
            <span className="text-amber-500">€{data.total_unpaid.toFixed(2)}</span>
          </div>
        )}

        {/* Payment Progress */}
        {data.total_earned > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-muted">Pagos</span>
              <span className="text-xs font-medium text-foreground">{paymentRate}%</span>
            </div>
            <div className="w-full bg-background-secondary rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${paymentRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Click indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrendingUp size={16} className="text-foreground-muted" />
      </div>
    </motion.div>
  )
}

