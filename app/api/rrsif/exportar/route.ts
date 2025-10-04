/**
 * API para exportación de registros RRSIF
 * Permite exportar registros de facturación y eventos según normativa
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  registrarExportacion,
  obtenerEventos,
  obtenerEstadisticasEventos 
} from '@/lib/event-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, fechaInicio, fechaFin, formato = 'json' } = body

    // Validar parámetros
    if (!tipo || !['facturas', 'eventos', 'completo'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de exportación inválido' },
        { status: 400 }
      )
    }

    let registrosExportados = 0
    let datosExportados: any = {}

    // Exportar según el tipo solicitado
    switch (tipo) {
      case 'facturas':
        // En un entorno real, aquí se obtendrían las facturas de la base de datos
        datosExportados = {
          tipo: 'facturas',
          fecha_exportacion: new Date().toISOString(),
          total_registros: 0,
          facturas: []
        }
        registrosExportados = 0
        break

      case 'eventos':
        const eventos = obtenerEventos()
        const estadisticas = obtenerEstadisticasEventos()
        
        datosExportados = {
          tipo: 'eventos',
          fecha_exportacion: new Date().toISOString(),
          total_registros: eventos.length,
          estadisticas,
          eventos: eventos.map(evento => ({
            id: evento.id,
            tipo: evento.tipo_evento,
            timestamp: evento.timestamp,
            actor: evento.actor,
            detalle: evento.detalle,
            hash: evento.hash_evento,
            created_at: evento.created_at
          }))
        }
        registrosExportados = eventos.length
        break

      case 'completo':
        // Exportación completa de todos los datos
        const todosLosEventos = obtenerEventos()
        const estadisticasCompletas = obtenerEstadisticasEventos()
        
        datosExportados = {
          tipo: 'completo',
          fecha_exportacion: new Date().toISOString(),
          sistema: {
            nombre: 'EURELA-CONNECT-RRSIF',
            version: '1.0.0',
            modo: 'local'
          },
          estadisticas: estadisticasCompletas,
          eventos: todosLosEventos.map(evento => ({
            id: evento.id,
            tipo: evento.tipo_evento,
            timestamp: evento.timestamp,
            actor: evento.actor,
            detalle: evento.detalle,
            hash: evento.hash_evento,
            created_at: evento.created_at
          })),
          facturas: [] // En un entorno real, aquí se incluirían las facturas
        }
        registrosExportados = todosLosEventos.length
        break
    }

    // Registrar evento de exportación
    await registrarExportacion(
      tipo,
      registrosExportados,
      'usuario'
    )

    // Generar archivo según formato
    let archivo: string
    let nombreArchivo: string
    let contentType: string

    if (formato === 'json') {
      archivo = JSON.stringify(datosExportados, null, 2)
      nombreArchivo = `export_rrsif_${tipo}_${new Date().toISOString().split('T')[0]}.json`
      contentType = 'application/json'
    } else if (formato === 'csv') {
      // En un entorno real, aquí se convertirían los datos a CSV
      archivo = 'Formato CSV en desarrollo'
      nombreArchivo = `export_rrsif_${tipo}_${new Date().toISOString().split('T')[0]}.csv`
      contentType = 'text/csv'
    } else {
      return NextResponse.json(
        { success: false, error: 'Formato de exportación no soportado' },
        { status: 400 }
      )
    }

    // En un entorno real, aquí se guardaría el archivo en el sistema de archivos
    // y se retornaría la URL de descarga
    console.log(`Exportación ${tipo} completada:`, {
      registros: registrosExportados,
      archivo: nombreArchivo,
      tamaño: archivo.length
    })

    return NextResponse.json({
      success: true,
      exportacion: {
        tipo,
        registros_exportados: registrosExportados,
        archivo: nombreArchivo,
        tamaño_bytes: archivo.length,
        fecha_exportacion: new Date().toISOString(),
        datos: datosExportados
      }
    })

  } catch (error) {
    console.error('Error exportando datos RRSIF:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'completo'

    // Obtener estadísticas de exportación
    const estadisticas = obtenerEstadisticasEventos()

    return NextResponse.json({
      success: true,
      estadisticas: {
        total_eventos: estadisticas.total,
        eventos_por_tipo: estadisticas.porTipo,
        ultimo_resumen: new Date(estadisticas.ultimoResumen).toISOString(),
        proximo_resumen: new Date(estadisticas.proximoResumen).toISOString()
      },
      tipos_disponibles: ['facturas', 'eventos', 'completo'],
      formatos_disponibles: ['json', 'csv']
    })

  } catch (error) {
    console.error('Error obteniendo estadísticas de exportación:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
