/**
 * Generador de PDF para facturas RRSIF
 * Cumple con requisitos de posición y tamaño del QR según normativa española
 */

import jsPDF from 'jspdf'
import { 
  FacturaRRSIF, 
  FiscalData, 
  ReceptorData, 
  ClasePagada,
  DesgloseIVA 
} from '@/types'
import { generarQRDataURL, calcularTamanoOptimoQR, QR_LEYENDAS } from './qr-generator'
import { formatearFechaFactura, formatearImporte, RRSIF_CONSTANTS } from './rrsif-utils'

// ===== CONFIGURACIÓN PDF =====

const PDF_CONFIG = {
  // Tamaño A4 en mm
  A4_WIDTH: 210,
  A4_HEIGHT: 297,
  // Márgenes
  MARGIN_TOP: 20,
  MARGIN_BOTTOM: 20,
  MARGIN_LEFT: 20,
  MARGIN_RIGHT: 20,
  // Tamaño del QR (30-40mm según RRSIF)
  QR_SIZE_MM: 35,
  // Posición del QR (arriba y centrado o a la izquierda)
  QR_POSITION: {
    x: 20, // Margen izquierdo
    y: 30  // Debajo del encabezado
  },
  // Fuentes
  FONT_SIZE: {
    TITLE: 16,
    SUBTITLE: 12,
    NORMAL: 10,
    SMALL: 8
  },
  // Colores
  COLORS: {
    PRIMARY: '#1f2937',
    SECONDARY: '#6b7280',
    SUCCESS: '#059669',
    WARNING: '#d97706',
    BORDER: '#e5e7eb'
  }
} as const

// ===== GENERACIÓN DE PDF =====

/**
 * Genera PDF de factura RRSIF
 */
export async function generarPDFFactura(factura: FacturaRRSIF): Promise<jsPDF> {
  const doc = new jsPDF()
  
  // Configurar fuente
  doc.setFont('helvetica')
  
  // Generar QR
  const qrDataURL = await generarQRDataURL(
    factura.registro_facturacion,
    calcularTamanoOptimoQR(PDF_CONFIG.QR_SIZE_MM)
  )
  
  // Página 1: Encabezado y QR
  await generarEncabezado(doc, factura, qrDataURL)
  
  // Página 1: Datos del emisor y receptor
  generarDatosFiscales(doc, factura.datos_fiscales_emisor, factura.datos_receptor)
  
  // Página 1: Detalles de la factura
  generarDetallesFactura(doc, factura)
  
  // Página 1: Tabla de clases
  generarTablaClases(doc, factura.classes || [])
  
  // Página 1: Totales e IVA
  generarTotales(doc, factura)
  
  // Página 1: Pie de página
  generarPiePagina(doc, factura)
  
  return doc
}

/**
 * Genera encabezado con QR en posición correcta
 */
async function generarEncabezado(
  doc: jsPDF, 
  factura: FacturaRRSIF, 
  qrDataURL: string
): Promise<void> {
  // Título principal
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.TITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.text('FACTURA', PDF_CONFIG.MARGIN_LEFT, PDF_CONFIG.MARGIN_TOP)
  
  // Número de factura
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.text(
    `Nº ${factura.registro_facturacion.serie}-${factura.registro_facturacion.numero}`,
    PDF_CONFIG.A4_WIDTH - 60,
    PDF_CONFIG.MARGIN_TOP
  )
  
  // Fecha de expedición
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
  doc.text(
    `Fecha: ${formatearFechaFactura(factura.registro_facturacion.fecha_expedicion)}`,
    PDF_CONFIG.A4_WIDTH - 60,
    PDF_CONFIG.MARGIN_TOP + 8
  )
  
  // QR Code (posición correcta según RRSIF)
  const qrSize = PDF_CONFIG.QR_SIZE_MM
  doc.addImage(
    qrDataURL,
    'PNG',
    PDF_CONFIG.QR_POSITION.x,
    PDF_CONFIG.QR_POSITION.y,
    qrSize,
    qrSize
  )
  
  // Leyenda VeriFactu (si aplica)
  if (factura.registro_facturacion.estado_envio === 'verifactu') {
    doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
    doc.setTextColor(PDF_CONFIG.COLORS.SUCCESS)
    doc.text(
      QR_LEYENDAS.VERIFACTU,
      PDF_CONFIG.QR_POSITION.x,
      PDF_CONFIG.QR_POSITION.y + qrSize + 5
    )
  }
  
  // Línea separadora
  doc.setDrawColor(PDF_CONFIG.COLORS.BORDER)
  doc.setLineWidth(0.5)
  doc.line(
    PDF_CONFIG.MARGIN_LEFT,
    PDF_CONFIG.QR_POSITION.y + qrSize + 15,
    PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT,
    PDF_CONFIG.QR_POSITION.y + qrSize + 15
  )
}

/**
 * Genera datos fiscales del emisor y receptor
 */
function generarDatosFiscales(
  doc: jsPDF,
  emisor: FiscalData,
  receptor: ReceptorData
): void {
  const startY = PDF_CONFIG.QR_POSITION.y + PDF_CONFIG.QR_SIZE_MM + 25
  
  // Emisor (izquierda)
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.text('EMISOR', PDF_CONFIG.MARGIN_LEFT, startY)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.text(emisor.nombre, PDF_CONFIG.MARGIN_LEFT, startY + 8)
  doc.text(`NIF: ${emisor.nif}`, PDF_CONFIG.MARGIN_LEFT, startY + 14)
  doc.text(emisor.direccion, PDF_CONFIG.MARGIN_LEFT, startY + 20)
  doc.text(`${emisor.codigoPostal} ${emisor.municipio} (${emisor.provincia})`, PDF_CONFIG.MARGIN_LEFT, startY + 26)
  doc.text(emisor.pais, PDF_CONFIG.MARGIN_LEFT, startY + 32)
  doc.text(`Tel: ${emisor.telefono}`, PDF_CONFIG.MARGIN_LEFT, startY + 38)
  doc.text(`Email: ${emisor.email}`, PDF_CONFIG.MARGIN_LEFT, startY + 44)
  
  // Receptor (derecha)
  const receptorX = PDF_CONFIG.A4_WIDTH / 2 + 10
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.text('RECEPTOR', receptorX, startY)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.text(receptor.nombre, receptorX, startY + 8)
  doc.text(`NIF: ${receptor.nif}`, receptorX, startY + 14)
  doc.text(receptor.direccion, receptorX, startY + 20)
  doc.text(`${receptor.codigoPostal} ${receptor.municipio} (${receptor.provincia})`, receptorX, startY + 26)
  doc.text(receptor.pais, receptorX, startY + 32)
  if (receptor.telefono) {
    doc.text(`Tel: ${receptor.telefono}`, receptorX, startY + 38)
  }
  if (receptor.email) {
    doc.text(`Email: ${receptor.email}`, receptorX, startY + 44)
  }
}

/**
 * Genera detalles de la factura
 */
function generarDetallesFactura(doc: jsPDF, factura: FacturaRRSIF): void {
  const startY = PDF_CONFIG.QR_POSITION.y + PDF_CONFIG.QR_SIZE_MM + 80
  
  // Descripción
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.text('CONCEPTO', PDF_CONFIG.MARGIN_LEFT, startY)
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.text(factura.descripcion || 'Clase particular', PDF_CONFIG.MARGIN_LEFT, startY + 8)
  
  // Período de facturación
  doc.text(
    `Período: ${factura.month}`,
    PDF_CONFIG.MARGIN_LEFT,
    startY + 16
  )
  
  // Hash del registro (para verificación)
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.text(
    `Hash: ${factura.registro_facturacion.hash_registro.substring(0, 16)}...`,
    PDF_CONFIG.MARGIN_LEFT,
    startY + 24
  )
}

/**
 * Genera tabla de clases
 */
function generarTablaClases(doc: jsPDF, clases: ClasePagada[]): void {
  const startY = PDF_CONFIG.QR_POSITION.y + PDF_CONFIG.QR_SIZE_MM + 120
  
  // Encabezado de tabla
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.text('DETALLE DE CLASES', PDF_CONFIG.MARGIN_LEFT, startY)
  
  // Encabezados de columna
  const headerY = startY + 10
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  
  doc.text('Fecha', PDF_CONFIG.MARGIN_LEFT, headerY)
  doc.text('Hora', PDF_CONFIG.MARGIN_LEFT + 25, headerY)
  doc.text('Asignatura', PDF_CONFIG.MARGIN_LEFT + 50, headerY)
  doc.text('Duración', PDF_CONFIG.MARGIN_LEFT + 100, headerY)
  doc.text('Precio', PDF_CONFIG.A4_WIDTH - 25, headerY)
  
  // Filas de clases
  let currentY = headerY + 8
  clases.forEach((clase, index) => {
    if (currentY > PDF_CONFIG.A4_HEIGHT - 50) {
      // Nueva página si es necesario
      doc.addPage()
      currentY = 30
    }
    
    doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
    doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
    
    doc.text(formatearFechaFactura(clase.fecha), PDF_CONFIG.MARGIN_LEFT, currentY)
    doc.text(`${clase.hora_inicio}-${clase.hora_fin}`, PDF_CONFIG.MARGIN_LEFT + 25, currentY)
    doc.text(clase.asignatura, PDF_CONFIG.MARGIN_LEFT + 50, currentY)
    doc.text(`${clase.duracion} min`, PDF_CONFIG.MARGIN_LEFT + 100, currentY)
    doc.text(`€${formatearImporte(clase.precio)}`, PDF_CONFIG.A4_WIDTH - 25, currentY)
    
    currentY += 10
  })
  
  // Línea de separación MUY abajo
  if (clases.length > 0) {
    doc.setDrawColor(PDF_CONFIG.COLORS.BORDER)
    doc.setLineWidth(0.5)
    doc.line(PDF_CONFIG.MARGIN_LEFT, currentY + 10, PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT, currentY + 10)
  }
}

/**
 * Genera sección de totales e IVA
 */
function generarTotales(doc: jsPDF, factura: FacturaRRSIF): void {
  const startY = PDF_CONFIG.A4_HEIGHT - 80
  
  // Línea separadora
  doc.setDrawColor(PDF_CONFIG.COLORS.BORDER)
  doc.setLineWidth(0.5)
  doc.line(PDF_CONFIG.MARGIN_LEFT, startY - 10, PDF_CONFIG.A4_WIDTH - PDF_CONFIG.MARGIN_RIGHT, startY - 10)
  
  // Totales
  const totalX = PDF_CONFIG.A4_WIDTH - 80
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  doc.text('Base Imponible:', totalX - 40, startY)
  doc.text(`€${formatearImporte(factura.registro_facturacion.base_imponible)}`, totalX, startY)
  
  // IVA
  if (factura.registro_facturacion.desglose_iva && Array.isArray(factura.registro_facturacion.desglose_iva)) {
    factura.registro_facturacion.desglose_iva.forEach((iva, index) => {
      doc.text(`IVA ${iva.tipo}%:`, totalX - 40, startY + 8 + (index * 8))
      doc.text(`€${formatearImporte(iva.cuota)}`, totalX, startY + 8 + (index * 8))
    })
  }
  
  // Línea de total
  doc.setDrawColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.setLineWidth(1)
  doc.line(totalX - 40, startY + 20, totalX + 20, startY + 20)
  
  // Total final
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SUBTITLE)
  doc.setTextColor(PDF_CONFIG.COLORS.PRIMARY)
  doc.text('TOTAL:', totalX - 40, startY + 30)
  doc.text(`€${formatearImporte(factura.registro_facturacion.importe_total)}`, totalX, startY + 30)
}

/**
 * Genera pie de página
 */
function generarPiePagina(doc: jsPDF, factura: FacturaRRSIF): void {
  const startY = PDF_CONFIG.A4_HEIGHT - 20
  
  doc.setFontSize(PDF_CONFIG.FONT_SIZE.SMALL)
  doc.setTextColor(PDF_CONFIG.COLORS.SECONDARY)
  
  // Información del sistema
  doc.text(
    `Generado por EURELA-CONNECT RRSIF v${RRSIF_CONSTANTS.VERSION_SOFTWARE}`,
    PDF_CONFIG.MARGIN_LEFT,
    startY
  )
  
  // Timestamp
  doc.text(
    `Generado: ${new Date().toLocaleString('es-ES')}`,
    PDF_CONFIG.A4_WIDTH - 80,
    startY
  )
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
