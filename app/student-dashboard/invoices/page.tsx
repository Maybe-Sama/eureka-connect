'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentLayout from '@/components/layout/student-layout'
import { FileText, Download, Eye, CheckCircle, Clock, XCircle, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

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
    if (filter === 'all') return true
    if (filter === 'paid') return invoice.status.toLowerCase() === 'paid' || invoice.status.toLowerCase() === 'pagada'
    if (filter === 'pending') return invoice.status.toLowerCase() === 'pending' || invoice.status.toLowerCase() === 'pendiente'
    return true
  })

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const paidAmount = invoices
    .filter(inv => inv.status.toLowerCase() === 'paid' || inv.status.toLowerCase() === 'pagada')
    .reduce((sum, inv) => sum + inv.total, 0)
  const pendingAmount = invoices
    .filter(inv => inv.status.toLowerCase() === 'pending' || inv.status.toLowerCase() === 'pendiente')
    .reduce((sum, inv) => sum + inv.total, 0)

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceModal(true)
  }

  const handleCloseModal = () => {
    setShowInvoiceModal(false)
    setSelectedInvoice(null)
  }

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-effect bg-primary/10 rounded-2xl shadow-lg p-6 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground-secondary text-sm font-medium">Total Facturas</p>
                <p className="text-3xl font-bold mt-2 text-foreground">{invoices.length}</p>
              </div>
              <FileText size={40} className="text-primary/50" />
            </div>
          </div>

          <div className="glass-effect bg-success/10 rounded-2xl shadow-lg p-6 border border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground-secondary text-sm font-medium">Pagado</p>
                <p className="text-3xl font-bold mt-2 text-foreground">€{paidAmount.toFixed(2)}</p>
              </div>
              <CheckCircle size={40} className="text-success/50" />
            </div>
          </div>

          <div className="glass-effect bg-warning/10 rounded-2xl shadow-lg p-6 border border-warning/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground-secondary text-sm font-medium">Pendiente</p>
                <p className="text-3xl font-bold mt-2 text-foreground">€{pendingAmount.toFixed(2)}</p>
              </div>
              <Clock size={40} className="text-warning/50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground-secondary">Filtrar por:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-background-tertiary text-foreground-secondary hover:bg-background-tertiary/70'
              }`}
            >
              Todas ({invoices.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'paid'
                  ? 'bg-success text-white shadow-lg'
                  : 'bg-background-tertiary text-foreground-secondary hover:bg-background-tertiary/70'
              }`}
            >
              Pagadas ({invoices.filter(i => i.status.toLowerCase() === 'paid' || i.status.toLowerCase() === 'pagada').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === 'pending'
                  ? 'bg-warning text-white shadow-lg'
                  : 'bg-background-tertiary text-foreground-secondary hover:bg-background-tertiary/70'
              }`}
            >
              Pendientes ({invoices.filter(i => i.status.toLowerCase() === 'pending' || i.status.toLowerCase() === 'pendiente').length})
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="glass-effect rounded-2xl shadow-lg overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background-tertiary">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Número
                  </th>
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
                  <th className="px-6 py-4 text-right text-xs font-medium text-foreground-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background-secondary divide-y divide-border">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-foreground-muted">
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
                          <div className="text-sm font-medium text-foreground">
                            {invoice.invoice_number}
                          </div>
                        </td>
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
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-primary hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-105 active:scale-95"
                            title="Ver detalles de la factura"
                          >
                            <Eye 
                              size={18} 
                              className="transition-transform duration-300 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </button>
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

        {/* Invoice Modal */}
        <AnimatePresence>
          {showInvoiceModal && selectedInvoice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background rounded-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Factura {selectedInvoice.invoice_number}
                      </h2>
                      <p className="text-sm text-foreground-muted">
                        {new Date(selectedInvoice.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                  {/* Invoice Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Información de la Factura</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Número:</span>
                          <span className="font-medium text-foreground">{selectedInvoice.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Fecha:</span>
                          <span className="font-medium text-foreground">
                            {new Date(selectedInvoice.date).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Estado:</span>
                          <span className="font-medium text-foreground">
                            {getStatusInfo(selectedInvoice.status).text}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Total:</span>
                          <span className="font-bold text-lg text-foreground">€{selectedInvoice.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Descripción</h3>
                      <p className="text-foreground-muted">
                        {selectedInvoice.description || 'Servicios de formación educativa'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusInfo(selectedInvoice.status).color} ${getStatusInfo(selectedInvoice.status).bg} ${getStatusInfo(selectedInvoice.status).border}`}>
                      <span className="mr-2">{getStatusInfo(selectedInvoice.status).icon}</span>
                      {getStatusInfo(selectedInvoice.status).text}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-foreground-muted">
                      Factura generada el {new Date(selectedInvoice.created_at).toLocaleDateString('es-ES')}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCloseModal}
                        className="group relative px-6 py-3 bg-gradient-to-r from-background-tertiary to-background-tertiary/80 text-foreground rounded-xl hover:from-background-tertiary/80 hover:to-background-tertiary/60 hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 font-medium border border-border"
                      >
                        <X size={16} className="transition-transform duration-300 group-hover:scale-110" />
                        <span>Cerrar</span>
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(selectedInvoice)}
                        className="group relative px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 font-medium"
                      >
                        <Download 
                          size={16} 
                          className="transition-transform duration-300 group-hover:scale-110" 
                        />
                        <span>Descargar PDF</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudentLayout>
  )
}


