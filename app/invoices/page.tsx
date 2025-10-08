'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Mail,
  Eye,
  Edit,
  Trash2,
  Euro,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  QrCode,
  Shield,
  Users,
  BookOpen,
  Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Invoice, 
  Student, 
  Class, 
  FacturaRRSIF, 
  ModalSeleccionClases,
  FiscalData,
  ReceptorData,
  EstadoReloj
} from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

// Función temporal para generar números de factura
const generateInvoiceNumber = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${year}${month}${random}`
}
import { 
  verificarSincronizacionReloj,
  RRSIF_CONSTANTS 
} from '@/lib/rrsif-utils'
import { 
  inicializarSistemaEventos,
  registrarInicioOperacion,
  registrarIncidencia 
} from '@/lib/event-logger'
import { toast } from 'sonner'
import SeleccionClasesModal from '@/components/facturas/SeleccionClasesModal'
import ConfiguracionFiscalModal from '@/components/facturas/ConfiguracionFiscalModal'

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<FacturaRRSIF[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // Estados RRSIF
  const [estadoReloj, setEstadoReloj] = useState<EstadoReloj | null>(null)
  const [datosFiscales, setDatosFiscales] = useState<FiscalData | null>(null)
  const [datosReceptor, setDatosReceptor] = useState<ReceptorData | null>(null)
  const [sistemaInicializado, setSistemaInicializado] = useState(false)
  const [incluirQR, setIncluirQR] = useState(false) // Toggle para QR VeriFactu
  
  // Modales
  const [modalSeleccion, setModalSeleccion] = useState<ModalSeleccionClases>({
    isOpen: false,
    studentId: null,
    student: null,
    clasesPagadas: [],
    clasesSeleccionadas: []
  })
  const [modalConfiguracion, setModalConfiguracion] = useState(false)

  // Función auxiliar para mapear clases a ClasePagada
  const mapearClaseAPagada = (clase: any) => {
    console.log('=== MAPEANDO CLASE ===')
    console.log('Clase original:', clase)
    console.log('Students object:', clase.students)
    console.log('Student_id:', clase.student_id)
    console.log('¿Tiene students?', !!clase.students)
    console.log('¿Tiene first_name?', clase.students?.first_name)
    
    // Mapear datos del estudiante desde la estructura de la base de datos
    const studentData: Student = {
      id: clase.students?.id?.toString() || clase.student_id?.toString() || `student-${clase.id}`,
      firstName: clase.students?.first_name || 'Estudiante',
      lastName: clase.students?.last_name || 'Sin apellido',
      email: clase.students?.email || 'sin@email.com',
      phone: clase.students?.phone || '',
      address: clase.students?.address || '',
      city: clase.students?.city || '',
      province: clase.students?.province || '',
      postalCode: clase.students?.postal_code || '',
      country: clase.students?.country || 'España',
      dni: clase.students?.dni || '',
      nif: clase.students?.nif || '',
      birthDate: clase.students?.birth_date || '',
      courseId: clase.students?.course_id?.toString() || '1',
      studentCode: clase.students?.student_code || `STU-${clase.id}`,
      // Campos del receptor
      receptorNombre: clase.students?.receptor_nombre || '',
      receptorApellidos: clase.students?.receptor_apellidos || '',
      receptorEmail: clase.students?.receptor_email || '',
      createdAt: clase.students?.created_at || clase.created_at,
      updatedAt: clase.students?.updated_at || clase.updated_at
    }
    
    console.log('Student data mapeado:', studentData)
    console.log('¿Es un estudiante real?', studentData.firstName !== 'Estudiante')
    
    const mappedClass = {
      id: clase.id.toString(),
      studentId: studentData.id,
      student: studentData,
      fecha: clase.date,
      hora_inicio: clase.start_time,
      hora_fin: clase.end_time,
      duracion: clase.duration,
      asignatura: clase.subject || clase.notes || 'Clase particular',
      precio: clase.price,
      payment_status: 'paid' as const,
      payment_date: clase.payment_date || clase.updated_at,
      courseId: clase.course_id?.toString() || 'default',
      course: {
        id: clase.courses?.id?.toString() || clase.course_id?.toString() || 'default',
        name: clase.courses?.name || 'Clase particular',
        description: clase.courses?.description || 'Clase particular',
        price: clase.price,
        duration: clase.duration,
        color: clase.courses?.color || '#6366f1',
        isActive: clase.courses?.is_active ?? true,
        createdAt: clase.courses?.created_at || clase.created_at,
        updatedAt: clase.courses?.updated_at || clase.updated_at
      }
    }
    
    return mappedClass
  }

  // Inicializar sistema RRSIF
  useEffect(() => {
    const inicializarSistema = async () => {
      try {
        // Inicializar sistema de eventos
        await inicializarSistemaEventos()
        
        // Verificar sincronización del reloj
        const reloj = await verificarSincronizacionReloj()
        setEstadoReloj(reloj)
        
        if (!reloj.sincronizado) {
          await registrarIncidencia(
            `Reloj desincronizado: ${reloj.desfase_segundos}s de desfase`,
            'alta'
          )
          toast.warning('Reloj del sistema desincronizado. Verifique la hora del servidor.')
        }
        
        setSistemaInicializado(true)
        await registrarInicioOperacion()
        
      } catch (error) {
        console.error('Error inicializando sistema RRSIF:', error)
        await registrarIncidencia('Error inicializando sistema RRSIF', 'critica')
        toast.error('Error inicializando sistema de facturación')
      }
    }

    inicializarSistema()
  }, [])

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch students
        const studentsResponse = await fetch('/api/students')
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setStudents(studentsData)
        }

        // Fetch classes
        const classesResponse = await fetch('/api/classes')
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setClasses(classesData)
        }

        // Fetch invoices RRSIF
        const invoicesResponse = await fetch('/api/rrsif/facturas')
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
        }

        // Fetch fiscal configuration
        const configResponse = await fetch('/api/rrsif/configuracion-fiscal')
        if (configResponse.ok) {
          const configData = await configResponse.json()
          if (configData.success && configData.configuracion) {
            setDatosFiscales(configData.configuracion.datos_fiscales)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    if (sistemaInicializado) {
      fetchData()
    }
  }, [sistemaInicializado])

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === '' || invoice.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const handleNuevaFactura = () => {
    if (!datosFiscales) {
      toast.error('Configure primero los datos fiscales')
      setModalConfiguracion(true)
      return
    }
    
    // Obtener todas las clases pagadas de todos los estudiantes
    console.log('=== DEBUGGING CLASES ===')
    console.log('Total clases:', classes.length)
    if (classes.length > 0) {
      console.log('Primera clase:', classes[0])
      console.log('Students en primera clase:', (classes[0] as any)?.students)
      console.log('Student_id:', (classes[0] as any)?.student_id)
      console.log('Payment_status:', (classes[0] as any)?.payment_status)
      console.log('Status:', (classes[0] as any)?.status)
    }
    
    // Obtener todas las clases pagadas
    const todasLasClasesPagadas = classes
      .filter((clase: any) => clase.payment_status === 'paid' || clase.status === 'completed')
      .map(mapearClaseAPagada)
    
    console.log('Clases pagadas encontradas:', todasLasClasesPagadas.length)
    console.log('Primera clase pagada mapeada:', todasLasClasesPagadas[0])
    
    // Si no hay clases reales, mostrar mensaje
    if (todasLasClasesPagadas.length === 0) {
      console.log('No hay clases pagadas en la base de datos')
      toast.warning('No hay clases pagadas disponibles para generar facturas')
      return
    }
    
    // Mostrar modal de selección (ahora con dos fases)
    setModalSeleccion({
      isOpen: true,
      studentId: null,
      student: null,
      clasesPagadas: todasLasClasesPagadas,
      clasesSeleccionadas: []
    })
  }

  const handleSeleccionarEstudiante = async (studentId: string) => {
    // Esta función ya no es necesaria ya que el modal maneja la selección internamente
    // Se mantiene para compatibilidad con el componente
    console.log('handleSeleccionarEstudiante llamado con:', studentId)
  }

  const handleConfirmarSeleccion = async (clasesSeleccionadas: string[]) => {
    if (!datosFiscales) {
      toast.error('Datos fiscales no configurados')
      return
    }

    console.log('=== CONFIRMANDO SELECCIÓN ===')
    console.log('Datos fiscales disponibles:', JSON.stringify(datosFiscales, null, 2))
    console.log('Clases seleccionadas:', clasesSeleccionadas)

    try {
      // Obtener las clases seleccionadas del modal
      const clasesSeleccionadasData = modalSeleccion.clasesPagadas.filter(clase => 
        clasesSeleccionadas.includes(clase.id)
      )

      if (clasesSeleccionadasData.length === 0) {
        toast.error('No se seleccionaron clases')
        return
      }

      // Obtener datos del estudiante de la primera clase seleccionada
      const student = clasesSeleccionadasData[0].student
      if (!student) {
        toast.error('Datos del estudiante no encontrados')
        return
      }

      // Crear datos del receptor desde los datos del estudiante
      // Usar DNI o NIF, el que esté cumplimentado
      console.log('=== DEBUG IDENTIFICACIÓN FISCAL ===')
      console.log('student.dni:', student.dni)
      console.log('student.nif:', student.nif)
      console.log('student.dni type:', typeof student.dni)
      console.log('student.nif type:', typeof student.nif)
      console.log('student.dni truthy:', !!student.dni)
      console.log('student.nif truthy:', !!student.nif)
      console.log('student completo:', JSON.stringify(student, null, 2))
      
      const identificacionFiscal = student.dni || '00000000A'
      console.log('identificacionFiscal seleccionada:', identificacionFiscal)
      
      const datosReceptorEstudiante: ReceptorData = {
        nif: identificacionFiscal,
        nombre: `${student.receptorNombre || student.firstName} ${student.receptorApellidos || student.lastName}`,
        direccion: student.address || 'Dirección no especificada',
        codigoPostal: student.postalCode || '00000',
        municipio: student.city || 'Ciudad no especificada',
        provincia: student.province || 'Provincia no especificada',
        pais: student.country || 'España',
        telefono: student.phone,
        email: student.receptorEmail || student.email
      }
      
      console.log('datosReceptorEstudiante creado:', JSON.stringify(datosReceptorEstudiante, null, 2))
      console.log('Incluir QR (frontend):', incluirQR)

      const response = await fetch('/api/rrsif/generar-factura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          clasesIds: clasesSeleccionadas,
          datosFiscales,
          datosReceptor: datosReceptorEstudiante,
          descripcion: `Clases particulares - ${clasesSeleccionadas.length} clase${clasesSeleccionadas.length !== 1 ? 's' : ''}`,
          incluirQR: incluirQR
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Factura ${result.factura.invoiceNumber} generada exitosamente`)
        
        // Guardar factura en el almacenamiento
        try {
          const saveResponse = await fetch('/api/rrsif/facturas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ factura: result.factura }),
          })
          
          if (saveResponse.ok) {
            console.log('Factura guardada exitosamente')
          }
        } catch (saveError) {
          console.error('Error guardando factura:', saveError)
        }
        
        // Refresh invoices
        const invoicesResponse = await fetch('/api/rrsif/facturas')
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al generar la factura')
        if (error.detalles) {
          console.error('Detalles del error:', error.detalles)
        }
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Error al generar la factura')
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Factura enviada exitosamente')
        // Refresh invoices
        const invoicesResponse = await fetch('/api/invoices')
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
        }
      } else {
        toast.error('Error al enviar la factura')
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Error al enviar la factura')
    }
  }

  const handleDownloadPDF = async (invoice: FacturaRRSIF) => {
    try {
      const response = await fetch(`/api/rrsif/pdf?id=${invoice.id}`)
      
      if (!response.ok) {
        throw new Error('Error generando PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factura-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF descargado exitosamente')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error descargando PDF')
    }
  }

  const handleViewPDF = async (invoice: FacturaRRSIF) => {
    try {
      const response = await fetch(`/api/rrsif/pdf?id=${invoice.id}`)
      
      if (!response.ok) {
        throw new Error('Error generando PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      toast.success('PDF abierto en nueva ventana')
    } catch (error) {
      console.error('Error viewing PDF:', error)
      toast.error('Error visualizando PDF')
    }
  }

  const [showFinalizarModal, setShowFinalizarModal] = useState(false)
  const [facturaAFinalizar, setFacturaAFinalizar] = useState<string | null>(null)
  const [isFinalizando, setIsFinalizando] = useState(false)

  const handleFinalizarFactura = (invoiceId: string) => {
    setFacturaAFinalizar(invoiceId)
    setShowFinalizarModal(true)
  }

  const confirmarFinalizar = async () => {
    if (!facturaAFinalizar) return

    setIsFinalizando(true)
    try {
      const response = await fetch(`/api/rrsif/finalizar-factura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facturaId: facturaAFinalizar }),
      })

      if (response.ok) {
        toast.success('Factura finalizada exitosamente')
        // Refresh invoices
        const invoicesResponse = await fetch('/api/rrsif/facturas')
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
        }
        setShowFinalizarModal(false)
        setFacturaAFinalizar(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al finalizar la factura')
      }
    } catch (error) {
      console.error('Error finalizando factura:', error)
      toast.error('Error al finalizar la factura')
    } finally {
      setIsFinalizando(false)
    }
  }

  const handleEliminarFacturaProvisional = async (invoiceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta factura provisional?')) return

    try {
      const response = await fetch(`/api/rrsif/eliminar-factura-provisional?id=${invoiceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Factura provisional eliminada exitosamente')
        // Refresh invoices
        const invoicesResponse = await fetch('/api/rrsif/facturas')
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar la factura')
      }
    } catch (error) {
      console.error('Error eliminando factura:', error)
      toast.error('Error al eliminar la factura')
    }
  }

  const handleAnularFactura = async (invoiceId: string) => {
    if (!confirm('¿Estás seguro de que quieres anular esta factura? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/rrsif/anular-factura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          facturaId: invoiceId,
          motivo: 'Anulación solicitada por el usuario'
        }),
      })

      if (response.ok) {
        toast.success('Factura anulada exitosamente')
        // Refresh invoices
        const invoicesResponse = await fetch('/api/rrsif/facturas')
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
        }
      } else {
        toast.error('Error al anular la factura')
      }
    } catch (error) {
      console.error('Error anulando factura:', error)
      toast.error('Error al anular la factura')
    }
  }

  const handleGuardarConfiguracion = async (fiscales: FiscalData, receptor: ReceptorData | null) => {
    try {
      const response = await fetch('/api/rrsif/configuracion-fiscal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datosFiscales: fiscales
        }),
      })

      if (response.ok) {
        setDatosFiscales(fiscales)
        toast.success('Configuración fiscal guardada correctamente')
      } else {
        const error = await response.json()
        console.error('Error saving fiscal config:', error)
        toast.error('Error al guardar la configuración fiscal')
      }
    } catch (error) {
      console.error('Error saving fiscal config:', error)
      toast.error('Error al guardar la configuración fiscal')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/20 text-success border-success/30'
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/30'
      case 'sent':
        return 'bg-info/20 text-info border-info/30'
      default:
        return 'bg-foreground-muted/20 text-foreground-muted border-foreground-muted/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagada'
      case 'pending':
        return 'Pendiente'
      case 'sent':
        return 'Enviada'
      default:
        return 'Generada'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <FileText size={32} className="mr-3 text-primary" />
              Gestión de Facturas RRSIF
            </h1>
            {estadoReloj && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                estadoReloj.sincronizado 
                  ? 'bg-success/20 text-success border border-success/30' 
                  : 'bg-destructive/20 text-destructive border border-destructive/30'
              }`}>
                <Clock size={16} />
                <span>
                  {estadoReloj.sincronizado ? 'Reloj OK' : `Desfase: ${estadoReloj.desfase_segundos}s`}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setModalConfiguracion(true)}
              className="flex items-center"
            >
              <Settings size={16} className="mr-2" />
              Configuración
            </Button>
            
            {/* Toggle QR VeriFactu */}
            <div className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
              incluirQR 
                ? 'bg-primary/10 border-primary/30 text-primary' 
                : 'bg-background border-border text-foreground-muted'
            }`}>
              <QrCode size={16} className={incluirQR ? 'text-primary' : 'text-foreground-muted'} />
              <span className={`text-sm font-medium ${incluirQR ? 'text-primary' : 'text-foreground-muted'}`}>
                QR VeriFactu
              </span>
              <button
                onClick={() => setIncluirQR(!incluirQR)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  incluirQR ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    incluirQR ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <Button 
              onClick={handleNuevaFactura}
              disabled={!sistemaInicializado || !datosFiscales}
              className="flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="glass-effect rounded-lg p-4 text-center">
            <FileText size={24} className="text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
            <p className="text-sm text-foreground-muted">Total Facturas</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <Euro size={24} className="text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              €{invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
            </p>
            <p className="text-sm text-foreground-muted">Total Facturado</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <CheckCircle size={24} className="text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {invoices.filter(inv => inv.status === 'paid').length}
            </p>
            <p className="text-sm text-foreground-muted">Pagadas</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <Clock size={24} className="text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {invoices.filter(inv => inv.status === 'pending').length}
            </p>
            <p className="text-sm text-foreground-muted">Pendientes</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <Shield size={24} className="text-info mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {sistemaInicializado ? 'OK' : '--'}
            </p>
            <p className="text-sm text-foreground-muted">Sistema RRSIF</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-xl p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder="Buscar por número de factura o alumno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los estados</option>
              <option value="generated">Generada</option>
              <option value="sent">Enviada</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Invoices List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-effect rounded-xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {invoice.invoiceNumber}
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      {invoice.student.firstName} {invoice.student.lastName}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-foreground-muted">
                        <QrCode size={12} />
                        <span>RRSIF</span>
                      </div>
                      <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                        (invoice as any).incluye_qr 
                          ? 'bg-success/20 text-success border border-success/30' 
                          : 'bg-destructive/20 text-destructive border border-destructive/30'
                      }`}>
                        <QrCode size={12} />
                        <span>{(invoice as any).incluye_qr ? 'QR VeriFactu' : 'Sin QR'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-foreground-muted">
                        <Shield size={12} />
                        <span>Hash: {invoice.registro_facturacion?.hash_registro?.substring(0, 8)}...</span>
                      </div>
                      <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                        invoice.estado_factura === 'provisional' 
                          ? 'bg-warning/20 text-warning' 
                          : 'bg-success/20 text-success'
                      }`}>
                        <span>{invoice.estado_factura === 'provisional' ? 'Provisional' : 'Final'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSendInvoice(invoice.id)}
                      className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 text-blue-500 hover:from-blue-500/20 hover:to-blue-500/10 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105 active:scale-95"
                      title="Enviar factura por email"
                    >
                      <Mail 
                        size={16} 
                        className="transition-transform duration-300 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(invoice)}
                      className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 text-green-500 hover:from-green-500/20 hover:to-green-500/10 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-105 active:scale-95"
                      title="Descargar PDF de la factura"
                    >
                      <Download 
                        size={16} 
                        className="transition-transform duration-300 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    <button
                      onClick={() => handleViewPDF(invoice)}
                      className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-primary hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-105 active:scale-95"
                      title="Ver factura en nueva ventana"
                    >
                      <Eye 
                        size={16} 
                        className="transition-transform duration-300 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    {invoice.estado_factura === 'provisional' ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleFinalizarFactura(invoice.id)}
                          className="text-success hover:text-success"
                        >
                          <CheckCircle size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEliminarFacturaProvisional(invoice.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAnularFactura(invoice.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-foreground-muted">Mes</p>
                  <p className="font-medium text-foreground">{invoice.month}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Clases</p>
                  <p className="font-medium text-foreground">{invoice.classes.length}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Total</p>
                  <p className="font-semibold text-foreground text-lg">€{invoice.total.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-foreground-muted">
            <FileText size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No hay facturas</h3>
            <p>Comienza generando facturas para tus alumnos</p>
          </div>
        )}
      </motion.div>

      {/* Modales */}
      <SeleccionClasesModal
        modal={modalSeleccion}
        onClose={() => setModalSeleccion(prev => ({ ...prev, isOpen: false }))}
        onConfirmar={handleConfirmarSeleccion}
        onSeleccionarEstudiante={handleSeleccionarEstudiante}
      />

      <ConfiguracionFiscalModal
        isOpen={modalConfiguracion}
        onClose={() => setModalConfiguracion(false)}
        onSave={handleGuardarConfiguracion}
        datosFiscales={datosFiscales || undefined}
        datosReceptor={datosReceptor || undefined}
      />

      {/* Modal de Confirmación para Finalizar Factura */}
      <AnimatePresence>
        {showFinalizarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFinalizarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-xl border border-border w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <AlertCircle size={20} className="text-warning" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Finalizar Factura
                    </h2>
                    <p className="text-sm text-foreground-muted">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-warning mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">
                        ¿Estás seguro de que quieres finalizar esta factura?
                      </p>
                      <p className="text-sm text-foreground-muted mt-2">
                        Una vez finalizada, la factura será visible para el estudiante y no se podrá eliminar.
                      </p>
                    </div>
                  </div>

                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-warning">
                      <AlertCircle size={16} />
                      <span className="font-medium text-sm">Importante</span>
                    </div>
                    <p className="text-sm text-foreground-muted mt-2">
                      Esta acción es irreversible. La factura pasará de estado "Provisional" a "Final".
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border bg-muted/20">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowFinalizarModal(false)}
                    disabled={isFinalizando}
                    className="px-4 py-2 bg-background-tertiary text-foreground rounded-lg hover:bg-background-tertiary/70 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarFinalizar}
                    disabled={isFinalizando}
                    className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isFinalizando ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    <span>{isFinalizando ? 'Finalizando...' : 'Finalizar Factura'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InvoicesPage
