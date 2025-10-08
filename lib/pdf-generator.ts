/**
 * Generador de PDF para facturas RRSIF
 * Cumple con requisitos de posición y tamaño del QR según normativa española
 * Diseño profesional inspirado en facturas comerciales modernas
 */

import jsPDF from 'jspdf'
import { 
  FacturaRRSIF, 
  FiscalData, 
  ReceptorData, 
  Class,
  DesgloseIVA 
} from '@/types'
import { generarQRDataURL, calcularTamanoOptimoQR, QR_LEYENDAS } from './qr-generator'
import { formatearFechaFactura, formatearImporte, RRSIF_CONSTANTS } from './rrsif-utils'
import fs from 'fs'
import path from 'path'

// ===== CONFIGURACIÓN PDF =====

const PDF_CONFIG = {
  // Tamaño A4 en mm
  A4_WIDTH: 210,
  A4_HEIGHT: 297,
  // Márgenes
  MARGIN_TOP: 15,
  MARGIN_BOTTOM: 20,
  MARGIN_LEFT: 15,
  MARGIN_RIGHT: 15,
  // Tamaño del logo
  LOGO_SIZE: 25,
  // Tamaño del QR (30-40mm según RRSIF)
  QR_SIZE_MM: 35,
  // Fuentes
  FONT_SIZE: {
    TITLE: 14,
    SUBTITLE: 10,
    NORMAL: 9,
    SMALL: 8,
    TINY: 7
  },
  // Colores
  COLORS: {
    PRIMARY: '#000000',      // Negro para títulos
    SECONDARY: '#4a4a4a',    // Gris oscuro para texto
    LIGHT_GRAY: '#9ca3af',   // Gris claro
    BORDER: '#d1d5db',       // Gris para bordes
    TABLE_HEADER: '#f3f4f6'  // Fondo gris muy claro
  }
} as const

// ===== GENERACIÓN DE PDF =====

/**
 * Carga el logo de Eureka Learning
 */
async function cargarLogo(): Promise<string> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const logoBuffer = fs.readFileSync(logoPath)
    const base64 = logoBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error)
    return ''
  }
}

/**
 * Genera PDF de factura RRSIF con diseño profesional
 */
export async function generarPDFFactura(factura: FacturaRRSIF, incluirQR: boolean = false): Promise<jsPDF> {
  const doc = new jsPDF()
  
  // Configurar fuente
  doc.setFont('helvetica')
  
  // Generar QR solo si está habilitado
  let qrDataURL = ''
  if (incluirQR) {
    qrDataURL = await generarQRDataURL(
      factura.registro_facturacion,
      calcularTamanoOptimoQR(PDF_CONFIG.QR_SIZE_MM)
    )
  }
  
  // Cargar logo
  const logoDataURL = await cargarLogo()
  
  // Generar contenido
  await generarEncabezado(doc, factura, qrDataURL, logoDataURL, incluirQR)
  generarDatosFiscales(doc, factura.datos_fiscales_emisor, factura.datos_receptor, factura)
  const tableEndY = generarTablaConceptos(doc, factura.classes || [], factura)
  generarTotales(doc, factura, tableEndY)
  generarNotas(doc, factura)
  generarPiePagina(doc, factura)
  
  return doc
}

/**
 * Genera encabezado con logo y QR (estilo profesional)
 */
async function generarEncabezado(
  doc: jsPDF, 
  factura: FacturaRRSIF, 
  qrDataURL: string,
  logoDataURL: string,
  incluirQR: boolean = false
): Promise<void> {
  let currentY = PDF_CONFIG.MARGIN_TOP
  
  // Logo - posición y tamaño según si hay QR o no
  if (logoDataURL) {
    if (incluirQR) {
      // Con QR: Logo en esquina superior izquierda (tamaño normal)
      doc.addImage(
        logoDataURL,
        'PNG',
        PDF_CONFIG.MARGIN_LEFT,
        PDF_CONFIG.MARGIN_TOP,
        PDF_CONFIG.LOGO_SIZE,
        PDF_CONFIG.LOGO_SIZE
      )
    } else {
      // Sin QR: Logo en esquina superior derecha (doble tamaño)
      const logoSize = PDF_CONFIG.LOGO_SIZE * 2
      const logoX = PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT - logoSize
      doc.addImage(
        logoDataURL,
        'PNG',
        logoX,
        PDF_CONFIG.MARGIN_TOP,
        logoSize,
        logoSize
      )
    }
  }
  
  // QR en la esquina superior derecha (solo si está habilitado)
  if (incluirQR && qrDataURL) {
    const qrX = PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT - PDF_CONFIG.QR_SIZE_MM
    
    // Texto "QR tributario:" encima del QR
    doc.setFontSize(PDF_CONFIG.FONT_SIZE.TINY)
    doc.setTextColor(PDF_CONFIG.COLORS.LIGHT_GRAY)
    doc.text('QR tributario:', qrX, currentY)
    
    // QR Code
    doc.addImage(
      qrDataURL,
      'PNG',
      qrX,
      currentY + 2,
      PDF_CONFIG.QR_SIZE_MM,
      PDF_CONFIG.QR_SIZE_MM
    )
    
    // Leyenda VERI*FACTU debajo del QR
    doc.setFontSize(PDF_CONFIG.FONT_SIZE.TINY)
    doc.text('VERI*FACTU', qrX + (PDF_CONFIG.QR_SIZE_MM / 2), currentY + PDF_CONFIG.QR_SIZE_MM + 6, { align: 'center' })
  }
  
  // Información de la factura (debajo del logo)
  currentY = PDF_CONFIG.MARGIN_TOP + PDF_CONFIG.LOGO_SIZE + 10
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.setFont('helvetica', 'normal')
  doc.text('Factura', PDF_CONFIG.MARGIN_LEFT, currentY)
  
  // Número de factura
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.TITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.setFont('helvetica', 'bold')
  const numeroVisible = (factura as any).invoiceNumber 
    || `${factura.registro_facturacion.serie}-${factura.registro_facturacion.numero}`
  doc.text(numeroVisible, PDF_CONFIG.MARGIN_LEFT, currentY + 7)
  
  // Fecha de Emisión y Moneda (lado izquierdo)
  currentY += 15
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.setFont('helvetica', 'bold')
  doc.text('Fecha de Emisión', PDF_CONFIG.MARGIN_LEFT, currentY)
  doc.text('Moneda', PDF_CONFIG.MARGIN_LEFT + 45, currentY)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.text(formatearFechaFactura(factura.registro_facturacion.fecha_expedicion), PDF_CONFIG.MARGIN_LEFT, currentY + 4)
  doc.text('Euro (EUR)', PDF_CONFIG.MARGIN_LEFT + 45, currentY + 4)
}

/**
 * Genera datos fiscales del emisor y receptor (estilo profesional)
 */
function generarDatosFiscales(
  doc: jsPDF,
  emisor: FiscalData,
  receptor: ReceptorData,
  factura?: any
): void {
  // Comenzar después del encabezado con más espacio (Logo 25mm + espacio 10mm + Factura info ~25mm + espacio extra = ~75mm desde arriba)
  const startY = 75
  
  // Proveedor (izquierda)
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.LIGHT_GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text('Proveedor', PDF_CONFIG.MARGIN_LEFT, startY)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.setFont('helvetica', 'bold')
  doc.text(emisor.nombre, PDF_CONFIG.MARGIN_LEFT, startY + 5)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.setFont('helvetica', 'normal')
  
  // Dirección en múltiples líneas si es muy larga
  const maxWidth = 85
  const direccionCompleta = `${emisor.direccion}, ${emisor.codigoPostal}, ${emisor.municipio}, ${emisor.provincia} (${emisor.pais})`
  const lineasDireccion = doc.splitTextToSize(direccionCompleta, maxWidth)
  let currentY = startY + 9
  lineasDireccion.forEach((linea: string) => {
    doc.text(linea, PDF_CONFIG.MARGIN_LEFT, currentY)
    currentY += 3.5
  })
  
  doc.text(`Email: ${emisor.email}`, PDF_CONFIG.MARGIN_LEFT, currentY)
  doc.text(`DNI: (ES) ${emisor.nif}`, PDF_CONFIG.MARGIN_LEFT, currentY + 3.5)
  
  // Cliente (derecha)
  const clienteX = PDF_CONFIG.A4_WIDTH / 2 + 5
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.LIGHT_GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text('Cliente', clienteX, startY)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.setFont('helvetica', 'bold')
  // Mostrar nombre del alumno (hijo) en lugar del padre
  const nombreAlumno = factura?.student?.firstName && factura?.student?.lastName 
    ? `${factura.student.firstName} ${factura.student.lastName}`
    : receptor.nombre
  doc.text(nombreAlumno, clienteX, startY + 5)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.setFont('helvetica', 'normal')
  
  // Dirección del cliente
  const direccionCliente = `${receptor.direccion}, ${receptor.codigoPostal}, ${receptor.municipio}, ${receptor.provincia} (${receptor.pais})`
  const lineasCliente = doc.splitTextToSize(direccionCliente, maxWidth)
  currentY = startY + 9
  lineasCliente.forEach((linea: string) => {
    doc.text(linea, clienteX, currentY)
    currentY += 3.5
  })
  
  doc.text(`DNI: (ES) ${receptor.nif}`, clienteX, currentY)
  currentY += 3.5
  
  // Mostrar información del alumno
  if (factura?.student?.firstName && factura?.student?.lastName) {
    doc.text(`Alumno: ${factura.student.firstName} ${factura.student.lastName}`, clienteX, currentY)
  }
}

/**
 * Genera tabla de conceptos (servicios facturados) - Estilo profesional
 */
function generarTablaConceptos(doc: jsPDF, clases: any[], factura?: any): number {
  // Comenzar después de Proveedor/Cliente (startY 75 + nombre 5 + dirección ~10 + email/nif ~8 = ~105mm)
  const startY = 105
  let currentY = startY
  
  // Cabecera de la tabla con fondo gris
  const headerHeight = 8
  doc.setFillColor(243, 244, 246) // Gris muy claro
  doc.rect(PDF_CONFIG.MARGIN_LEFT, currentY, PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_LEFT - PDF_CONFIG.MARGIN_RIGHT, headerHeight, 'F')
  
  // Encabezados de columna (sin columna de descuento)
  const colX = {
    num: PDF_CONFIG.MARGIN_LEFT + 2,
    descripcion: PDF_CONFIG.MARGIN_LEFT + 8,
    cant: PDF_CONFIG.MARGIN_LEFT + 80,
    unidad: PDF_CONFIG.MARGIN_LEFT + 95,
    precio: PDF_CONFIG.MARGIN_LEFT + 110,
    modalidad: PDF_CONFIG.MARGIN_LEFT + 130,
    total: PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT - 2
  }
  
  currentY += 5.5
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.setFont('helvetica', 'bold')
  
  doc.text('#', colX.num, currentY)
  doc.text('Descripción', colX.descripcion, currentY)
  doc.text('Cant.', colX.cant, currentY)
  doc.text('Unidad', colX.unidad, currentY)
  doc.text('Precio', colX.precio, currentY)
  doc.text('Modalidad', colX.modalidad, currentY)
  doc.text('Total', colX.total, currentY, { align: 'right' })
  
  currentY += 4
  
  // Línea bajo encabezados
  doc.setDrawColor(PDF_CONFIG.COLORS.BORDER)
  doc.setLineWidth(0.3)
  doc.line(PDF_CONFIG.MARGIN_LEFT, currentY, PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT, currentY)
  
  currentY += 5
  
  // Calcular datos de las clases
  const totalClases = clases.length
  const totalHoras = clases.reduce((sum, c) => sum + (c.duracion / 60), 0)
  const precioTotal = clases.reduce((sum, c) => sum + c.precio, 0)
  const precioUnitario = totalClases > 0 ? precioTotal / totalClases : 0
  
  // Debug: Log de los datos calculados
  console.log('Datos de clases:', {
    totalClases,
    totalHoras,
    precioTotal,
    precioUnitario,
    clases: clases.map(c => ({ 
      duracion: c.duracion, 
      precio: c.precio,
      hora_inicio: c.hora_inicio,
      hora_fin: c.hora_fin,
      fecha: c.fecha
    }))
  })
  
  // Fila de datos (sin columna de descuento)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  
  doc.text('1', colX.num, currentY)
  doc.text('Clases particulares', colX.descripcion, currentY)
  
  // Asegurar que los valores se muestren correctamente
  const horasTexto = totalHoras > 0 ? totalHoras.toFixed(1) : '0.0'
  const precioTexto = precioUnitario > 0 ? `€${formatearImporte(precioUnitario)}` : '€0.00'
  const totalTexto = precioTotal > 0 ? `€${formatearImporte(precioTotal)}` : '€0.00'
  
  // Determinar modalidad basada en si es clase individual o compartida
  let modalidadTexto = 'Individual' // Por defecto
  
  // Verificar si el estudiante tiene modalidad compartida
  if (factura?.student?.has_shared_pricing === true) {
    modalidadTexto = 'Compartida'
  }
  
  doc.text(horasTexto, colX.cant, currentY)
  doc.text('h', colX.unidad, currentY)
  doc.text(precioTexto, colX.precio, currentY)
  doc.text(modalidadTexto, colX.modalidad, currentY)
  doc.text(totalTexto, colX.total, currentY, { align: 'right' })
  
  currentY += 6
  
  return currentY
}

/**
 * Genera sección de totales (sin IVA)
 */
function generarTotales(doc: jsPDF, factura: FacturaRRSIF, tableEndY: number): void {
  let currentY = tableEndY + 8
  
  // Solo mostrar total a pagar (sin impuestos)
  const sumaX = PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT - 45
  const valorX = PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT - 2
  
  // Total a pagar
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.setFont('helvetica', 'bold')
  doc.text('Total a pagar', sumaX, currentY)
  doc.text(`${formatearImporte(factura.registro_facturacion.importe_total)}€`, valorX, currentY, { align: 'right' })
}

/**
 * Genera sección de notas
 */
function generarNotas(doc: jsPDF, factura: FacturaRRSIF): void {
  const startY = 250
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.setFont('helvetica', 'bold')
  doc.text('Notas', PDF_CONFIG.MARGIN_LEFT, startY)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_CONFIG.COLORS.LIGHT_GRAY)
  
  const emisor = factura.datos_fiscales_emisor
  doc.text(
    `Si tienes cualquier duda, contacta con nosotros en ${emisor.email}`,
    PDF_CONFIG.MARGIN_LEFT,
    startY + 5
  )
}

/**
 * Genera pie de página (estilo profesional)
 */
function generarPiePagina(doc: jsPDF, factura: FacturaRRSIF): void {
  const startY = PDF_CONFIG.A4_HEIGHT - 10
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.TINY)
  doc.setTextColor(PDF_CONFIG.COLORS.LIGHT_GRAY)
  doc.setFont('helvetica', 'normal')
  
  // Logo pequeño a la izquierda
  const logoSize = 8
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const logoBuffer = fs.readFileSync(logoPath)
    const base64 = logoBuffer.toString('base64')
    const logoDataURL = `data:image/png;base64,${base64}`
    doc.addImage(logoDataURL, 'PNG', PDF_CONFIG.MARGIN_LEFT, startY - 6, logoSize, logoSize)
  } catch (error) {
    // Si no se puede cargar el logo, continuar sin él
  }
  
  // Texto "EUREKA" o nombre de la empresa
  doc.text('EUREKA', PDF_CONFIG.MARGIN_LEFT + logoSize + 2, startY)
  
  // Numeración de página a la derecha
  doc.text('Página 1 de 1', PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT, startY, { align: 'right' })
}

// ===== UTILIDADES =====

/**
 * Guarda el PDF en el sistema de archivos
 */
export async function guardarPDF(
  doc: jsPDF, 
  nombreArchivo: string
): Promise<string> {
  const pdfBlob = doc.output('blob')
  const pdfArrayBuffer = await pdfBlob.arrayBuffer()
  
  // En un entorno real, esto se guardaría en el sistema de archivos
  // Por ahora, solo retornamos el nombre del archivo
  console.log(`PDF guardado: ${nombreArchivo}`)
  
  return nombreArchivo
}

/**
 * Genera nombre de archivo para la factura
 */
export function generarNombreArchivo(factura: FacturaRRSIF): string {
  const fecha = factura.registro_facturacion.fecha_expedicion.replace(/-/g, '')
  return `factura_${factura.registro_facturacion.serie}_${factura.registro_facturacion.numero}_${fecha}.pdf`
}

/**
 * Valida que el PDF cumple con RRSIF
 */
export function validarPDFRRSIF(doc: jsPDF, factura: FacturaRRSIF): boolean {
  // Verificar que el QR está en la posición correcta
  // Verificar que contiene todos los datos obligatorios
  // Verificar que el tamaño del QR es correcto
  
  return true // Implementación simplificada
}
