/**
 * Utilidades para cumplimiento RRSIF (Reglamento de Requisitos de los Sistemas de Facturación)
 * Real Decreto 1007/2023, modificado por RD 254/2025
 */

import CryptoJS from 'crypto-js'
import { 
  RegistroFacturacionAlta, 
  RegistroAnulacion, 
  // EventoSistema,
  EstadoReloj,
  FiscalData,
  ReceptorData,
  DesgloseIVA
} from '@/types'

// ===== SISTEMA DE HASH Y ENCADENAMIENTO =====

/**
 * Genera hash SHA-256 de un objeto
 */
export function generarHashSHA256(data: unknown): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort())
  return CryptoJS.SHA256(jsonString).toString()
}

/**
 * Genera hash de un registro de facturación
 */
export function generarHashRegistro(registro: RegistroFacturacionAlta | RegistroAnulacion): string {
  const datosParaHash = {
    nif_emisor: registro.nif_emisor,
    nombre_emisor: registro.nombre_emisor,
    nif_receptor: registro.nif_receptor,
    nombre_receptor: registro.nombre_receptor,
    serie: registro.serie,
    numero: registro.numero,
    fecha_expedicion: registro.fecha_expedicion,
    fecha_operacion: registro.fecha_operacion,
    importe_total: registro.importe_total,
    timestamp: registro.timestamp
  }
  
  return generarHashSHA256(datosParaHash)
}

/**
 * Obtiene el hash del último registro para encadenamiento
 */
export async function obtenerHashAnterior(): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/rrsif/ultimo-hash`)
    if (response.ok) {
      const data = await response.json()
      return data.hash || null
    }
  } catch (error) {
    console.error('Error obteniendo hash anterior:', error)
  }
  return null
}

// ===== SISTEMA DE NUMERACIÓN CORRELATIVA =====

/**
 * Genera número de factura correlativo anual
 */
export async function generarNumeroFactura(): Promise<string> {
  try {
    const response = await fetch('/api/rrsif/numero-factura', {
      method: 'POST'
    })
    if (response.ok) {
      const data = await response.json()
      return data.numero
    }
  } catch (error) {
    console.error('Error generando número de factura:', error)
    throw new Error('Error generando número de factura')
  }
  throw new Error('Error generando número de factura')
}

// ===== VERIFICACIÓN DE RELOJ DEL SISTEMA =====

/**
 * Verifica que el reloj del sistema esté sincronizado (desfase < 1 minuto)
 */
export async function verificarSincronizacionReloj(): Promise<EstadoReloj> {
  try {
    const response = await fetch('/api/rrsif/verificar-reloj')
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Error verificando reloj:', error)
  }
  
  return {
    sincronizado: false,
    desfase_segundos: 999999,
    hora_oficial: '',
    hora_sistema: new Date().toISOString(),
    ultima_verificacion: new Date().toISOString()
  }
}

// ===== FIRMA ELECTRÓNICA (MODO LOCAL) =====

/**
 * Genera firma electrónica para modalidad local
 * En un entorno real, esto se haría con certificado digital
 */
export function generarFirmaElectronica(registro: RegistroFacturacionAlta | RegistroAnulacion): string {
  const datosFirma = {
    hash_registro: registro.hash_registro,
    timestamp: registro.timestamp,
    id_sistema: 'EURELA-CONNECT-RRSIF',
    version: '1.0.0'
  }
  
  const firma = CryptoJS.HmacSHA256(
    JSON.stringify(datosFirma),
    process.env.NEXT_PUBLIC_RRSIF_SECRET_KEY || 'clave-secreta-desarrollo'
  ).toString()
  
  return firma
}

// ===== CÁLCULO DE IVA =====

/**
 * Calcula desglose de IVA según normativa española
 */
export function calcularDesgloseIVA(baseImponible: number, tipoIVA: number = 21): DesgloseIVA[] {
  const cuota = (baseImponible * tipoIVA) / 100
  
  return [{
    tipo: tipoIVA,
    base: baseImponible,
    cuota: cuota,
    descripcion: `IVA ${tipoIVA}%`
  }]
}

// ===== GENERACIÓN DE URL DE VERIFICACIÓN QR =====

/**
 * Genera URL de verificación para el código QR
 */
export function generarURLVerificacionQR(registro: RegistroFacturacionAlta): string {
  const baseUrl = process.env.NEXT_PUBLIC_VERIFICATION_URL || 'https://verificacion.eurela-connect.com'
  return `${baseUrl}/verificar?hash=${registro.hash_registro}&nif=${registro.nif_emisor}&numero=${registro.numero}`
}

// ===== VALIDACIÓN DE DATOS FISCALES =====

/**
 * Valida NIF español
 */
export function validarNIF(nif: string): boolean {
  const regex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i
  if (!regex.test(nif)) return false
  
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const numero = parseInt(nif.substring(0, 8))
  const letra = nif.charAt(8).toUpperCase()
  
  return letras.charAt(numero % 23) === letra
}

/**
 * Valida datos fiscales del emisor
 */
export function validarDatosFiscales(datos: FiscalData): string[] {
  const errores: string[] = []
  
  if (!validarNIF(datos.nif)) {
    errores.push('NIF del emisor no válido')
  }
  
  if (!datos.nombre || datos.nombre.trim().length < 2) {
    errores.push('Nombre del emisor es obligatorio')
  }
  
  if (!datos.direccion || datos.direccion.trim().length < 5) {
    errores.push('Dirección del emisor es obligatoria')
  }
  
  if (!datos.codigoPostal || !/^\d{5}$/.test(datos.codigoPostal)) {
    errores.push('Código postal debe tener 5 dígitos')
  }
  
  if (!datos.municipio || datos.municipio.trim().length < 2) {
    errores.push('Municipio es obligatorio')
  }
  
  if (!datos.provincia || datos.provincia.trim().length < 2) {
    errores.push('Provincia es obligatoria')
  }
  
  if (!datos.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
    errores.push('Email del emisor no válido')
  }
  
  return errores
}

/**
 * Valida datos del receptor
 */
export function validarDatosReceptor(datos: ReceptorData): string[] {
  const errores: string[] = []
  
  if (!datos.nif || datos.nif.trim().length < 9) {
    errores.push('NIF del receptor es obligatorio')
  }
  
  if (!datos.nombre || datos.nombre.trim().length < 2) {
    errores.push('Nombre del receptor es obligatorio')
  }
  
  if (!datos.direccion || datos.direccion.trim().length < 5) {
    errores.push('Dirección del receptor es obligatoria')
  }
  
  if (!datos.codigoPostal || !/^\d{5}$/.test(datos.codigoPostal)) {
    errores.push('Código postal del receptor debe tener 5 dígitos')
  }
  
  if (!datos.municipio || datos.municipio.trim().length < 2) {
    errores.push('Municipio del receptor es obligatorio')
  }
  
  if (!datos.provincia || datos.provincia.trim().length < 2) {
    errores.push('Provincia del receptor es obligatoria')
  }
  
  return errores
}

// ===== GENERACIÓN DE IDS ÚNICOS =====

/**
 * Genera ID único para registros
 */
export function generarIdUnico(): string {
  return CryptoJS.lib.WordArray.random(16).toString()
}

/**
 * Genera timestamp actual en formato ISO 8601
 */
export function generarTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Genera timestamp numérico
 */
export function generarTimestampNumerico(): number {
  return Date.now()
}

// ===== UTILIDADES DE FORMATO =====

/**
 * Formatea número de factura con serie
 */
export function formatearNumeroFactura(serie: string, numero: number): string {
  return `${serie}-${numero.toString().padStart(4, '0')}`
}

/**
 * Formatea importe para factura
 */
export function formatearImporte(importe: number | undefined): string {
  if (importe === undefined || importe === null) {
    return '0.00'
  }
  return importe.toFixed(2)
}

/**
 * Formatea fecha para factura
 */
export function formatearFechaFactura(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// ===== CONSTANTES RRSIF =====

export const RRSIF_CONSTANTS = {
  VERSION_SOFTWARE: '1.0.0',
  ID_SISTEMA: 'EURELA-CONNECT-RRSIF',
  SERIE_DEFAULT: 'ERK',
  TIPO_IVA_DEFAULT: 21,
  DESFASE_MAXIMO_SEGUNDOS: 60, // 1 minuto
  TAMANO_QR_MM: { min: 30, max: 40 },
  LEYENDA_VERIFACTU: 'Factura verificable en la sede electrónica de la AEAT',
  LEYENDA_QR: 'VERI*FACTU'
} as const
