'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudentLayout from '@/components/layout/student-layout'
import { FileText, Download, Eye, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

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
      // Intentar cargar facturas RRSIF primero
      const { data: rrsifInvoices, error: rrsifError } = await supabase
        .from('facturas_rrsif')
        .select('*')
        .eq('student_id', user?.studentId?.toString())
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
          icon: <AlertCircle size={20} />,
          text: 'Enviada',
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
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Ver factura"
                          >
                            <Eye size={18} />
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
      </div>
    </StudentLayout>
  )
}


