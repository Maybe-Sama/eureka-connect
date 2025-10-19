'use client'

import { motion } from 'framer-motion'
import { 
  X, 
  Download, 
  Calendar, 
  Users, 
  Clock, 
  Euro, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface MonthlyReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: MonthlyReport | null
  month: string
}

export const MonthlyReportModal = ({ isOpen, onClose, report, month }: MonthlyReportModalProps) => {
  if (!isOpen || !report) return null

  const completionRate = report.total_classes_scheduled > 0 
    ? Math.round((report.total_classes_completed / report.total_classes_scheduled) * 100) 
    : 0

  const paymentRate = report.total_earned > 0 
    ? Math.round((report.total_paid / report.total_earned) * 100) 
    : 0

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    // Usar día 1 para asegurar que siempre estamos en el mes correcto
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const handleDownload = () => {
    // Create CSV content
    const csvContent = [
      ['Reporte Mensual', formatMonth(month)],
      [''],
      ['Métricas Generales', ''],
      ['Total de Alumnos', report.total_students],
      ['Total de Clases Programadas', report.total_classes_scheduled],
      ['Total de Clases Completadas', report.total_classes_completed],
      ['Total de Clases Canceladas', report.total_classes_cancelled],
      [''],
      ['Tipos de Clases', ''],
      ['Clases Recurrentes', report.total_recurring_classes],
      ['Clases Eventuales', report.total_eventual_classes],
      [''],
      ['Ingresos', ''],
      ['Total Ganado', `€${report.total_earned.toFixed(2)}`],
      ['Total Pagado', `€${report.total_paid.toFixed(2)}`],
      ['Total Pendiente', `€${report.total_unpaid.toFixed(2)}`],
      ['Promedio por Alumno', `€${report.average_earned_per_student.toFixed(2)}`],
      [''],
      ['Porcentajes', ''],
      ['Tasa de Completado', `${completionRate}%`],
      ['Tasa de Pago', `${paymentRate}%`]
    ].map(row => row.join(',')).join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte-mensual-${month}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Reporte Mensual
              </h2>
              <p className="text-foreground-muted">{formatMonth(month)}</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleDownload} variant="outline" className="flex items-center">
                <Download size={20} className="mr-2" />
                Descargar CSV
              </Button>
              <Button variant="ghost" onClick={onClose} size="sm">
                <X size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total Alumnos</p>
                  <p className="text-2xl font-bold text-foreground">{report.total_students}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Clases Programadas</p>
                  <p className="text-2xl font-bold text-foreground">{report.total_classes_scheduled}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Clases Completadas</p>
                  <p className="text-2xl font-bold text-green-500">{report.total_classes_completed}</p>
                  <p className="text-xs text-foreground-muted">{completionRate}% del total</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Clases Canceladas</p>
                  <p className="text-2xl font-bold text-red-500">{report.total_classes_cancelled || 0}</p>
                  <p className="text-xs text-foreground-muted">{report.total_classes_scheduled > 0 ? Math.round(((report.total_classes_cancelled || 0) / report.total_classes_scheduled) * 100) : 0}% del total</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-foreground">€{report.total_earned.toFixed(2)}</p>
                </div>
                <Euro className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Classes Breakdown */}
            <div className="glass-effect rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Desglose de Clases
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Total Programadas</span>
                  <span className="font-medium text-foreground">{report.total_classes_scheduled}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Completadas</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-green-500">{report.total_classes_completed}</span>
                    <div className="w-16 bg-background-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Canceladas</span>
                  <span className="font-medium text-red-500">{report.total_classes_cancelled}</span>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground-muted">Recurrentes</span>
                    <span className="font-medium text-foreground">{report.total_recurring_classes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-muted">Eventuales</span>
                    <span className="font-medium text-foreground">{report.total_eventual_classes}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="glass-effect rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Euro className="w-5 h-5 mr-2 text-primary" />
                Desglose Financiero
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Total Ganado</span>
                  <span className="font-medium text-foreground">€{report.total_earned.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Total Pagado</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-green-500">€{report.total_paid.toFixed(2)}</span>
                    <div className="w-16 bg-background-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${paymentRate}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Pendiente de Pago</span>
                  <span className="font-medium text-amber-500">€{report.total_unpaid.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-muted">Promedio por Alumno</span>
                    <span className="font-medium text-foreground">€{report.average_earned_per_student.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="glass-effect rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Métricas de Rendimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-foreground-muted">Tasa de Completado</span>
                  <span className="font-medium text-foreground">{completionRate}%</span>
                </div>
                <div className="w-full bg-background-secondary rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-foreground-muted">Tasa de Pago</span>
                  <span className="font-medium text-foreground">{paymentRate}%</span>
                </div>
                <div className="w-full bg-background-secondary rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

