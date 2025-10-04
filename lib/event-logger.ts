/**
 * Sistema de registro de eventos RRSIF
 * Registra todos los eventos del sistema según normativa española
 */

import { EventoSistema } from '@/types'
import { generarIdUnico, generarTimestamp, generarTimestampNumerico, generarHashSHA256 } from './rrsif-utils'

// ===== TIPOS DE EVENTOS RRSIF =====

export type TipoEvento = 
  | 'inicio_operacion'
  | 'fin_operacion'
  | 'generacion_factura'
  | 'anulacion_factura'
  | 'incidencia'
  | 'exportacion'
  | 'restauracion'
  | 'evento_resumen'
  | 'apagado_reinicio'

// ===== CONFIGURACIÓN =====

const EVENT_CONFIG = {
  // Intervalo para eventos resumen (6 horas en milisegundos)
  RESUMEN_INTERVAL: 6 * 60 * 60 * 1000,
  // Último evento resumen
  ultimoResumen: 0,
  // Eventos en memoria (en producción debería ser base de datos)
  eventos: [] as EventoSistema[]
} as const

// ===== REGISTRO DE EVENTOS =====

/**
 * Registra un evento del sistema
 */
export async function registrarEvento(
  tipo: TipoEvento,
  detalle: string,
  actor: string = 'sistema',
  metadatos: Record<string, any> = {}
): Promise<EventoSistema> {
  const evento: EventoSistema = {
    id: generarIdUnico(),
    tipo_evento: tipo,
    timestamp: generarTimestampNumerico(),
    actor,
    detalle,
    hash_evento: undefined, // Se calculará después
    metadatos: {
      hora_exacta: generarTimestamp(),
      ip: metadatos.ip || 'localhost',
      user_agent: metadatos.user_agent || 'EURELA-CONNECT-RRSIF',
      dispositivo: metadatos.dispositivo || 'servidor',
      ...metadatos
    },
    created_at: generarTimestamp()
  }
  
  // Calcular hash del evento
  evento.hash_evento = generarHashSHA256({
    id: evento.id,
    tipo: evento.tipo_evento,
    timestamp: evento.timestamp,
    actor: evento.actor,
    detalle: evento.detalle
  })
  
  // Agregar a la lista de eventos
  EVENT_CONFIG.eventos.push(evento)
  
  // Verificar si necesitamos evento resumen (solo si no es un evento resumen)
  if (tipo !== 'evento_resumen') {
    await verificarEventoResumen()
  }
  
  // En producción, aquí se guardaría en la base de datos
  console.log(`[RRSIF EVENT] ${tipo}: ${detalle}`)
  
  return evento
}

/**
 * Verifica si es necesario generar un evento resumen
 */
async function verificarEventoResumen(): Promise<void> {
  const ahora = Date.now()
  const tiempoDesdeUltimoResumen = ahora - EVENT_CONFIG.ultimoResumen
  
  if (tiempoDesdeUltimoResumen >= EVENT_CONFIG.RESUMEN_INTERVAL) {
    await generarEventoResumen()
    EVENT_CONFIG.ultimoResumen = ahora
  }
}

/**
 * Genera evento resumen cada 6 horas
 */
async function generarEventoResumen(): Promise<EventoSistema> {
  const eventosRecientes = EVENT_CONFIG.eventos.filter(
    e => Date.now() - e.timestamp < EVENT_CONFIG.RESUMEN_INTERVAL
  )
  
  const resumen = {
    total_eventos: eventosRecientes.length,
    eventos_por_tipo: eventosRecientes.reduce((acc, e) => {
      acc[e.tipo_evento] = (acc[e.tipo_evento] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    primer_evento: eventosRecientes[0]?.timestamp || 0,
    ultimo_evento: eventosRecientes[eventosRecientes.length - 1]?.timestamp || 0
  }
  
  // Crear evento resumen directamente sin llamar a registrarEvento para evitar bucle
  const evento: EventoSistema = {
    id: generarIdUnico(),
    tipo_evento: 'evento_resumen',
    timestamp: generarTimestampNumerico(),
    actor: 'sistema',
    detalle: `Resumen de ${resumen.total_eventos} eventos en las últimas 6 horas`,
    hash_evento: undefined,
    metadatos: {
      hora_exacta: generarTimestamp(),
      ip: 'localhost',
      user_agent: 'EURELA-CONNECT-RRSIF',
      dispositivo: 'servidor',
      resumen
    },
    created_at: generarTimestamp()
  }
  
  // Calcular hash del evento
  evento.hash_evento = generarHashSHA256({
    id: evento.id,
    tipo: evento.tipo_evento,
    timestamp: evento.timestamp,
    actor: evento.actor,
    detalle: evento.detalle
  })
  
  // Agregar a la lista de eventos
  EVENT_CONFIG.eventos.push(evento)
  
  console.log(`[RRSIF EVENT] ${evento.tipo_evento}: ${evento.detalle}`)
  
  return evento
}

// ===== EVENTOS ESPECÍFICOS RRSIF =====

/**
 * Registra inicio de operación del sistema
 */
export async function registrarInicioOperacion(): Promise<EventoSistema> {
  return await registrarEvento(
    'inicio_operacion',
    'Sistema de facturación RRSIF iniciado en modalidad local',
    'sistema',
    {
      version: '1.0.0',
      modo: 'local',
      timestamp_inicio: generarTimestamp()
    }
  )
}

/**
 * Registra fin de operación del sistema
 */
export async function registrarFinOperacion(): Promise<EventoSistema> {
  return await registrarEvento(
    'fin_operacion',
    'Sistema de facturación RRSIF finalizado',
    'sistema',
    {
      timestamp_fin: generarTimestamp(),
      total_eventos: EVENT_CONFIG.eventos.length
    }
  )
}

/**
 * Registra generación de factura
 */
export async function registrarGeneracionFactura(
  numeroFactura: string,
  hashRegistro: string,
  actor: string = 'usuario'
): Promise<EventoSistema> {
  return await registrarEvento(
    'generacion_factura',
    `Factura ${numeroFactura} generada exitosamente`,
    actor,
    {
      numero_factura: numeroFactura,
      hash_registro: hashRegistro,
      timestamp_generacion: generarTimestamp()
    }
  )
}

/**
 * Registra anulación de factura
 */
export async function registrarAnulacionFactura(
  numeroFactura: string,
  motivo: string,
  hashRegistro: string,
  actor: string = 'usuario'
): Promise<EventoSistema> {
  return await registrarEvento(
    'anulacion_factura',
    `Factura ${numeroFactura} anulada: ${motivo}`,
    actor,
    {
      numero_factura: numeroFactura,
      motivo_anulacion: motivo,
      hash_registro: hashRegistro,
      timestamp_anulacion: generarTimestamp()
    }
  )
}

/**
 * Registra incidencia del sistema
 */
export async function registrarIncidencia(
  descripcion: string,
  severidad: 'baja' | 'media' | 'alta' | 'critica' = 'media',
  actor: string = 'sistema'
): Promise<EventoSistema> {
  return await registrarEvento(
    'incidencia',
    `Incidencia [${severidad.toUpperCase()}]: ${descripcion}`,
    actor,
    {
      severidad,
      timestamp_incidencia: generarTimestamp()
    }
  )
}

/**
 * Registra exportación de datos
 */
export async function registrarExportacion(
  tipoExportacion: string,
  registrosExportados: number,
  actor: string = 'usuario'
): Promise<EventoSistema> {
  return await registrarEvento(
    'exportacion',
    `Exportación de ${registrosExportados} registros de tipo ${tipoExportacion}`,
    actor,
    {
      tipo_exportacion: tipoExportacion,
      registros_exportados: registrosExportados,
      timestamp_exportacion: generarTimestamp()
    }
  )
}

/**
 * Registra restauración de datos
 */
export async function registrarRestauracion(
  archivoRestaurado: string,
  registrosRestaurados: number,
  actor: string = 'usuario'
): Promise<EventoSistema> {
  return await registrarEvento(
    'restauracion',
    `Restauración desde ${archivoRestaurado}: ${registrosRestaurados} registros`,
    actor,
    {
      archivo_restaurado: archivoRestaurado,
      registros_restaurados: registrosRestaurados,
      timestamp_restauracion: generarTimestamp()
    }
  )
}

/**
 * Registra apagado o reinicio del sistema
 */
export async function registrarApagadoReinicio(
  tipo: 'apagado' | 'reinicio',
  actor: string = 'sistema'
): Promise<EventoSistema> {
  return await registrarEvento(
    'apagado_reinicio',
    `Sistema ${tipo} - Generando evento resumen final`,
    actor,
    {
      tipo_operacion: tipo,
      timestamp_operacion: generarTimestamp(),
      total_eventos: EVENT_CONFIG.eventos.length
    }
  )
}

// ===== CONSULTA DE EVENTOS =====

/**
 * Obtiene todos los eventos del sistema
 */
export function obtenerEventos(): EventoSistema[] {
  return [...EVENT_CONFIG.eventos]
}

/**
 * Obtiene eventos por tipo
 */
export function obtenerEventosPorTipo(tipo: TipoEvento): EventoSistema[] {
  return EVENT_CONFIG.eventos.filter(e => e.tipo_evento === tipo)
}

/**
 * Obtiene eventos en un rango de tiempo
 */
export function obtenerEventosPorRango(
  inicio: number,
  fin: number
): EventoSistema[] {
  return EVENT_CONFIG.eventos.filter(
    e => e.timestamp >= inicio && e.timestamp <= fin
  )
}

/**
 * Obtiene el último evento
 */
export function obtenerUltimoEvento(): EventoSistema | null {
  return EVENT_CONFIG.eventos[EVENT_CONFIG.eventos.length - 1] || null
}

// ===== UTILIDADES =====

/**
 * Inicializa el sistema de eventos
 */
export async function inicializarSistemaEventos(): Promise<void> {
  await registrarInicioOperacion()
  console.log('[RRSIF] Sistema de eventos inicializado')
}

/**
 * Finaliza el sistema de eventos
 */
export async function finalizarSistemaEventos(): Promise<void> {
  await registrarApagadoReinicio('apagado')
  console.log('[RRSIF] Sistema de eventos finalizado')
}

/**
 * Obtiene estadísticas de eventos
 */
export function obtenerEstadisticasEventos(): {
  total: number
  porTipo: Record<string, number>
  ultimoResumen: number
  proximoResumen: number
} {
  const porTipo = EVENT_CONFIG.eventos.reduce((acc, e) => {
    acc[e.tipo_evento] = (acc[e.tipo_evento] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const proximoResumen = EVENT_CONFIG.ultimoResumen + EVENT_CONFIG.RESUMEN_INTERVAL
  
  return {
    total: EVENT_CONFIG.eventos.length,
    porTipo,
    ultimoResumen: EVENT_CONFIG.ultimoResumen,
    proximoResumen
  }
}
