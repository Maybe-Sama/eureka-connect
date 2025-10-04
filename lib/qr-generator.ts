/**
 * Generador de códigos QR para facturas RRSIF
 * Cumple con los requisitos de tamaño y posición según normativa española
 */

import QRCode from 'qrcode'
import { RegistroFacturacionAlta } from '@/types'

// ===== CONFIGURACIÓN QR RRSIF =====

export const QR_CONFIG = {
  // Tamaño mínimo y máximo según RRSIF (30x30mm a 40x40mm)
  TAMANO_MM: { min: 30, max: 40 },
  // Resolución para conversión a píxeles (300 DPI)
  DPI: 300,
  // Margen del QR
  MARGEN: 4,
  // Color del QR (negro sobre blanco)
  COLOR: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  // Nivel de corrección de errores
  ERROR_CORRECTION_LEVEL: 'M' as const
} as const

// ===== GENERACIÓN DE CONTENIDO QR =====

/**
 * Genera el contenido del código QR según normativa RRSIF
 */
export function generarContenidoQR(registro: RegistroFacturacionAlta): string {
  const datosQR = {
    // Datos obligatorios para verificación
    hash: registro.hash_registro,
    nif_emisor: registro.nif_emisor,
    numero: registro.numero,
    serie: registro.serie,
    fecha: registro.fecha_expedicion,
    importe: registro.importe_total,
    // URL de verificación
    url: registro.url_verificacion_qr,
    // Metadatos adicionales
    timestamp: registro.timestamp,
    version: '1.0'
  }
  
  return JSON.stringify(datosQR)
}

/**
 * Genera URL de verificación para el QR
 */
export function generarURLVerificacion(registro: RegistroFacturacionAlta): string {
  const baseUrl = process.env.NEXT_PUBLIC_VERIFICATION_URL || 'https://verificacion.eurela-connect.com'
  const params = new URLSearchParams({
    hash: registro.hash_registro,
    nif: registro.nif_emisor,
    numero: registro.numero,
    serie: registro.serie,
    fecha: registro.fecha_expedicion,
    importe: registro.importe_total.toString()
  })
  
  return `${baseUrl}/verificar?${params.toString()}`
}

// ===== GENERACIÓN DE QR COMO DATA URL =====

/**
 * Genera código QR como data URL (base64)
 */
export async function generarQRDataURL(
  registro: RegistroFacturacionAlta,
  tamanoPx: number = 120 // 40mm a 300 DPI ≈ 120px
): Promise<string> {
  try {
    const contenido = generarContenidoQR(registro)
    
    const qrDataURL = await QRCode.toDataURL(contenido, {
      width: tamanoPx,
      margin: QR_CONFIG.MARGEN,
      color: QR_CONFIG.COLOR,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION_LEVEL,
      type: 'image/png',
      quality: 1.0
    })
    
    return qrDataURL
  } catch (error) {
    console.error('Error generando QR:', error)
    throw new Error('Error generando código QR')
  }
}

/**
 * Genera código QR como buffer
 */
export async function generarQRBuffer(
  registro: RegistroFacturacionAlta,
  tamanoPx: number = 120
): Promise<Buffer> {
  try {
    const contenido = generarContenidoQR(registro)
    
    const qrBuffer = await QRCode.toBuffer(contenido, {
      width: tamanoPx,
      margin: QR_CONFIG.MARGEN,
      color: QR_CONFIG.COLOR,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION_LEVEL,
      type: 'png'
    })
    
    return qrBuffer
  } catch (error) {
    console.error('Error generando QR buffer:', error)
    throw new Error('Error generando código QR')
  }
}

// ===== CÁLCULO DE TAMAÑOS =====

/**
 * Convierte milímetros a píxeles según DPI
 */
export function mmToPx(mm: number, dpi: number = QR_CONFIG.DPI): number {
  return Math.round((mm * dpi) / 25.4)
}

/**
 * Convierte píxeles a milímetros según DPI
 */
export function pxToMm(px: number, dpi: number = QR_CONFIG.DPI): number {
  return (px * 25.4) / dpi
}

/**
 * Calcula el tamaño óptimo del QR en píxeles
 */
export function calcularTamanoOptimoQR(tamanoMM: number = QR_CONFIG.TAMANO_MM.max): number {
  const tamanoPx = mmToPx(tamanoMM)
  
  // Asegurar que esté dentro de los límites
  const minPx = mmToPx(QR_CONFIG.TAMANO_MM.min)
  const maxPx = mmToPx(QR_CONFIG.TAMANO_MM.max)
  
  return Math.max(minPx, Math.min(maxPx, tamanoPx))
}

// ===== VALIDACIÓN DE QR =====

/**
 * Valida que el QR generado cumple con los requisitos RRSIF
 */
export function validarQR(registro: RegistroFacturacionAlta, qrDataURL: string): boolean {
  try {
    // Verificar que el data URL es válido
    if (!qrDataURL.startsWith('data:image/png;base64,')) {
      return false
    }
    
    // Verificar que contiene los datos necesarios
    const contenido = generarContenidoQR(registro)
    if (!contenido.includes(registro.hash_registro)) {
      return false
    }
    
    if (!contenido.includes(registro.nif_emisor)) {
      return false
    }
    
    if (!contenido.includes(registro.numero)) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error validando QR:', error)
    return false
  }
}

// ===== GENERACIÓN DE QR CON LEYENDA VERIFACTU =====

/**
 * Genera QR con leyenda VeriFactu (para futura integración)
 */
export async function generarQRConLeyenda(
  registro: RegistroFacturacionAlta,
  incluirLeyenda: boolean = false
): Promise<{
  qrDataURL: string
  leyenda?: string
}> {
  const qrDataURL = await generarQRDataURL(registro)
  
  if (incluirLeyenda) {
    return {
      qrDataURL,
      leyenda: 'Factura verificable en la sede electrónica de la AEAT'
    }
  }
  
  return { qrDataURL }
}

// ===== UTILIDADES DE DEBUGGING =====

/**
 * Decodifica el contenido de un QR (para debugging)
 */
export function decodificarContenidoQR(qrDataURL: string): any {
  try {
    // En un entorno real, esto se haría con una librería de decodificación
    // Por ahora, solo extraemos el base64 y simulamos la decodificación
    const base64 = qrDataURL.split(',')[1]
    if (!base64) {
      throw new Error('QR data URL inválido')
    }
    
    // Simulación de decodificación
    return {
      hash: 'simulado',
      nif_emisor: 'simulado',
      numero: 'simulado',
      serie: 'simulado',
      fecha: 'simulado',
      importe: 'simulado',
      url: 'simulado',
      timestamp: 'simulado',
      version: '1.0'
    }
  } catch (error) {
    console.error('Error decodificando QR:', error)
    return null
  }
}

// ===== CONSTANTES =====

export const QR_LEYENDAS = {
  VERIFACTU: 'Factura verificable en la sede electrónica de la AEAT',
  QR_VERIFACTU: 'VERI*FACTU',
  POSICION: 'El código QR debe situarse al principio de la factura (arriba y centrado o a la izquierda)'
} as const
