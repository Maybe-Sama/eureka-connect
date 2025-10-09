'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentLayout from '@/components/layout/student-layout'
import { FileText, Download, Eye, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Invoice {
  id: string
  invoice_number: string
  date: string
  due_date?: string
  status: string
  total: number
  subtotal?: number
  tax?: number
  fixed_classes?: number
  eventual_classes?: number
  description?: string
  created_at: string
}

export default function StudentInvoicesPage() {
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [filterMonth, setFilterMonth] = useState<string>('')

  useEffect(() => {
    if (!loading && !isStudent) {
      router.push('/login')
    }
  }, [loading, isStudent, router])

  useEffect(() => {
    if (isStudent && user?.studentId) {
      loadInvoices()
    }
  }, [isStudent, user?.studentId])

  const loadInvoices = async () => {
    try {
      // Intentar cargar facturas RRSIF primero (solo definitivas)
      const { data: rrsifInvoices, error: rrsifError } = await supabase
        .from('facturas_rrsif')
        .select('*')
        .eq('student_id', user?.studentId?.toString())
        .eq('estado_factura', 'final') // Solo facturas definitivas
        .order('created_at', { ascending: false })

      if (!rrsifError && rrsifInvoices && rrsifInvoices.length > 0) {
        // Mapear facturas RRSIF al formato esperado
        const mappedInvoices = rrsifInvoices.map((invoice: any) => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          date: invoice.fecha_expedicion || invoice.created_at,
          status: invoice.status,
          total: invoice.total,
          description: invoice.descripcion,
          created_at: invoice.created_at
        }))
        setInvoices(mappedInvoices)
      } else {
        // Si no hay facturas RRSIF, intentar con facturas normales
        const { data: normalInvoices, error: normalError } = await supabase
          .from('invoices')
          .select('*')
          .eq('student_id', user?.studentId)
          .order('created_at', { ascending: false })

        if (!normalError && normalInvoices) {
          setInvoices(normalInvoices)
        }
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pagada':
        return {
          icon: <CheckCircle size={20} />,
          text: 'Pagada',
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        }
      case 'pending':
      case 'pendiente':
        return {
          icon: <Clock size={20} />,
          text: 'Pendiente',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200'
        }
      case 'cancelled':
      case 'cancelada':
        return {
          icon: <XCircle size={20} />,
          text: 'Cancelada',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        }
      case 'generated':
      case 'sent':
      case 'enviada':
        return {
          icon: <FileText size={20} />,
          text: 'Emitida',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        }
      default:
        return {
          icon: <AlertCircle size={20} />,
          text: status,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        }
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!filterMonth) return true
    
    const invoiceDate = new Date(invoice.date)
    const invoiceMonth = invoiceDate.getMonth() + 1 // getMonth() returns 0-11, we want 1-12
    const invoiceYear = invoiceDate.getFullYear()
    
    const [selectedYear, selectedMonth] = filterMonth.split('-').map(Number)
    
    return invoiceYear === selectedYear && invoiceMonth === selectedMonth
  })



  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/rrsif/pdf?id=${invoice.id}`)
      
      if (!response.ok) {
        throw new Error('Error generando PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factura-${invoice.invoice_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Mostrar notificación de éxito
      const event = new CustomEvent('toast', {
        detail: { message: 'PDF descargado exitosamente', type: 'success' }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Error descargando PDF:', error)
      const event = new CustomEvent('toast', {
        detail: { message: 'Error al descargar el PDF', type: 'error' }
      })
      window.dispatchEvent(event)
    }
  }

  const handleViewPDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/rrsif/pdf?id=${invoice.id}`)
      
      if (!response.ok) {
        throw new Error('Error generando PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // Mostrar notificación de éxito
      const event = new CustomEvent('toast', {
        detail: { message: 'PDF abierto en nueva ventana', type: 'success' }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Error visualizando PDF:', error)
      const event = new CustomEvent('toast', {
        detail: { message: 'Error visualizando PDF', type: 'error' }
      })
      window.dispatchEvent(event)
    }
  }

  if (loading || loadingData) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground-muted">Cargando facturas...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (!isStudent) {
    return null
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <FileText className="mr-3 text-primary" size={32} />
            Mis Facturas
          </h1>
          <p className="text-foreground-secondary mt-2">
            Consulta el historial de tus facturas y estados de pago
          </p>
        </div>


        {/* Filters */}
        <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-foreground-secondary">Filtrar por mes:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
            >
              <option value="">Todos los meses</option>
              {(() => {
                const months = [
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ]
                
                if (invoices.length === 0) {
                  return <option value="" disabled>No hay facturas</option>
                }
                
                // Encontrar la fecha de la primera factura
                const firstInvoiceDate = new Date(Math.min(...invoices.map(inv => new Date(inv.date).getTime())))
                const currentDate = new Date()
                
                const options = []
                
                // Generar opciones desde la primera factura hasta el mes actual
                const startYear = firstInvoiceDate.getFullYear()
                const startMonth = firstInvoiceDate.getMonth()
                const endYear = currentDate.getFullYear()
                const endMonth = currentDate.getMonth()
                
                for (let year = startYear; year <= endYear; year++) {
                  const monthStart = year === startYear ? startMonth : 0
                  const monthEnd = year === endYear ? endMonth : 11
                  
                  for (let month = monthStart; month <= monthEnd; month++) {
                    const value = `${year}-${month + 1}`
                    const label = `${months[month]} ${year}`
                    options.push(
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  }
                }
                
                return options
              })()}
            </select>
            {filterMonth && (
              <button
                onClick={() => setFilterMonth('')}
                className="px-3 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="glass-effect rounded-2xl shadow-lg overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background-tertiary">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Importe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background-secondary divide-y divide-border">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-foreground-muted">
                      <FileText size={48} className="mx-auto text-foreground-muted/30 mb-4" />
                      <p className="text-lg font-medium">No hay facturas disponibles</p>
                      <p className="text-sm mt-2">Las facturas aparecerán aquí cuando sean generadas</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const statusInfo = getStatusInfo(invoice.status)
                    return (
                      <tr key={invoice.id} className="hover:bg-background-tertiary transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {new Date(invoice.date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground max-w-xs truncate">
                            {invoice.description || 'Servicios de formación'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-foreground">
                            €{invoice.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-2 ${statusInfo.color} ${statusInfo.bg} ${statusInfo.border}`}>
                            <span className="mr-1">{statusInfo.icon}</span>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewPDF(invoice)}
                              className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-primary hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-105 active:scale-95"
                              title="Ver factura en nueva ventana"
                            >
                              <Eye 
                                size={18} 
                                className="transition-transform duration-300 group-hover:scale-110" 
                              />
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(invoice)}
                              className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 text-success hover:from-success/20 hover:to-success/10 hover:border-success/30 hover:shadow-lg hover:shadow-success/10 transition-all duration-300 hover:scale-105 active:scale-95"
                              title="Descargar PDF"
                            >
                              <Download 
                                size={18} 
                                className="transition-transform duration-300 group-hover:scale-110" 
                              />
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Section */}
        <div className="glass-effect bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            ¿Tienes alguna pregunta sobre tus facturas?
          </h3>
          <p className="text-foreground-secondary text-sm">
            Si necesitas información adicional o tienes alguna consulta sobre tus facturas, por favor contacta con tu profesor.
          </p>
        </div>

      </div>
    </StudentLayout>
  )
}


