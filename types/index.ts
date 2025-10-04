export interface Course {
  id: string
  name: string
  description?: string
  price: number
  duration: number // in minutes
  color: string
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  phone: string
  parentPhone?: string
  parentContactType?: string
  courseId: string
  studentCode: string
  fixedSchedule?: string // JSON string with fixed schedule
  startDate?: string
  // Fiscal data fields
  dni?: string
  nif?: string
  address?: string
  postalCode?: string
  city?: string
  province?: string
  country?: string
  // Receptor data fields (padre/madre/tutor)
  receptorNombre?: string
  receptorApellidos?: string
  receptorEmail?: string
  createdAt: string
  updatedAt: string
}

export interface Class {
  id: string
  studentId: string
  student: Student
  startTime: string
  endTime: string
  duration: number // in minutes
  isRecurring: boolean
  dayOfWeek?: number // 0-6 for recurring classes
  date: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  payment_status?: 'unpaid' | 'paid'
  payment_date?: string
  payment_notes?: string
  notes?: string
  price: number
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  studentId: string
  student: Student
  month: string // YYYY-MM format
  classes: Class[]
  subtotal: number
  tax: number
  total: number
  status: 'generated' | 'sent' | 'paid' | 'pending'
  sentAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface TeacherProfile {
  id: string
  name: string
  nif: string
  fiscalAddress: string
  bankAccount: string
  logo?: string
  email: string
  phone: string
  createdAt: string
  updatedAt: string
}

export interface NotificationSettings {
  id: string
  emailReminders: boolean
  whatsappReminders: boolean
  reminderAdvance: number // hours before class
  invoiceNotifications: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  todayClasses: number
  monthlyIncome: number
  pendingInvoices: number
  paidInvoices: number
  totalStudents: number
  monthlyClasses: number
}

export interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  classId?: string
  studentName?: string
}

export interface WeeklySchedule {
  [dayOfWeek: number]: TimeSlot[]
}

export interface ClassChangeModal {
  isOpen: boolean
  class: Class | null
  changeType: 'oneTime' | 'permanent' | null
}

// ===== TIPOS PARA CUMPLIMIENTO RRSIF =====

// Datos fiscales del emisor (profesor autónomo)
export interface FiscalData {
  nif: string
  nombre: string
  direccion: string
  codigoPostal: string
  municipio: string
  provincia: string
  pais: string
  telefono: string
  email: string
  regimenFiscal: 'autonomo' | 'sociedad'
  actividadEconomica: string
  codigoActividad: string
}

// Datos del receptor (alumno/padre)
export interface ReceptorData {
  nif: string
  nombre: string
  direccion: string
  codigoPostal: string
  municipio: string
  provincia: string
  pais: string
  telefono?: string
  email?: string
}

// Desglose de IVA
export interface DesgloseIVA {
  tipo: number // 0, 4, 10, 21
  base: number
  cuota: number
  descripcion: string
}

// Registro de facturación de alta (RRSIF)
export interface RegistroFacturacionAlta {
  id: string
  nif_emisor: string
  nombre_emisor: string
  nif_receptor: string
  nombre_receptor: string
  serie: string
  numero: string
  fecha_expedicion: string // ISO 8601
  fecha_operacion: string // ISO 8601
  descripcion: string
  base_imponible: number
  desglose_iva: DesgloseIVA[]
  importe_total: number
  id_sistema: string
  version_software: string
  hash_registro: string // SHA-256
  hash_registro_anterior: string | null
  timestamp: number
  url_verificacion_qr: string
  firma: string // Firma electrónica en modalidad local
  estado_envio: 'local' | 'verifactu'
  metadatos: {
    hora_exacta: string
    ip_emisor?: string
    user_agent?: string
    dispositivo?: string
  }
  created_at: string
  updated_at: string
}

// Registro de anulación (RRSIF)
export interface RegistroAnulacion {
  id: string
  registro_original_id: string
  motivo_anulacion: string
  fecha_anulacion: string // ISO 8601
  hash_registro: string // SHA-256
  hash_registro_anterior: string
  timestamp: number
  firma: string
  estado_envio: 'local' | 'verifactu'
  metadatos: {
    hora_exacta: string
    ip_emisor?: string
    user_agent?: string
    dispositivo?: string
  }
  created_at: string
  updated_at: string
}

// Eventos del sistema (RRSIF)
export interface EventoSistema {
  id: string
  tipo_evento: 'inicio_operacion' | 'fin_operacion' | 'generacion_factura' | 'anulacion_factura' | 'incidencia' | 'exportacion' | 'restauracion' | 'evento_resumen' | 'apagado_reinicio'
  timestamp: number
  actor: string // Usuario o sistema
  detalle: string
  hash_evento?: string
  metadatos: {
    hora_exacta: string
    ip?: string
    user_agent?: string
    dispositivo?: string
  }
  created_at: string
}

// Factura RRSIF (extensión de Invoice)
export interface FacturaRRSIF extends Invoice {
  registro_facturacion: RegistroFacturacionAlta
  qr_code: string
  pdf_path: string
  clases_pagadas: Class[]
  datos_fiscales_emisor: FiscalData
  datos_receptor: ReceptorData
  es_rectificativa: boolean
  factura_original_id?: string
  registro_anulacion?: RegistroAnulacion
  estado_factura: 'provisional' | 'final' // Nuevo campo para estados
  fecha_finalizacion?: string // Fecha cuando se marcó como final
}

// Configuración del sistema de facturación
export interface ConfiguracionFacturacion {
  id: string
  datos_fiscales: FiscalData
  numeracion_serie: string
  numeracion_actual: number
  año_corriente: number
  iva_por_defecto: number
  modo_verifactu: boolean
  url_verificacion: string
  certificado_digital?: string
  created_at: string
  updated_at: string
}

// Clase pagada para facturación
export interface ClasePagada {
  id: string
  studentId: string
  student: Student
  fecha: string
  hora_inicio: string
  hora_fin: string
  duracion: number
  asignatura: string
  precio: number
  payment_status: 'paid'
  payment_date: string
  payment_notes?: string
  courseId: string
  course: Course
}

// Modal para selección de clases
export interface ModalSeleccionClases {
  isOpen: boolean
  studentId: string | null
  student: Student | null
  clasesPagadas: ClasePagada[]
  clasesSeleccionadas: string[]
}

// Estado de sincronización del reloj
export interface EstadoReloj {
  sincronizado: boolean
  desfase_segundos: number
  hora_oficial: string
  hora_sistema: string
  ultima_verificacion: string
}
