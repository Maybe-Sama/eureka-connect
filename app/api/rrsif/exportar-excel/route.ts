import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facturaIds } = body

    if (!facturaIds || !Array.isArray(facturaIds) || facturaIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos una factura para exportar' },
        { status: 400 }
      )
    }

    // Obtener facturas seleccionadas desde Supabase
    const { data: facturas, error } = await supabase
      .from('facturas_rrsif')
      .select(`
        *,
        students!inner(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          province,
          postal_code,
          country,
          dni,
          nif
        )
      `)
      .in('id', facturaIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo facturas para exportar:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener facturas de la base de datos' },
        { status: 500 }
      )
    }

    if (!facturas || facturas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron facturas con los IDs proporcionados' },
        { status: 404 }
      )
    }

    // Obtener clases para cada factura
    const facturasConClases = await Promise.all(
      facturas.map(async (factura: any) => {
        const { data: clasesData, error: clasesError } = await supabase
          .from('factura_clases')
          .select('*')
          .eq('factura_id', factura.id)

        if (clasesError) {
          console.error(`Error obteniendo clases para factura ${factura.id}:`, clasesError)
        }

        return {
          ...factura,
          clases: clasesData || []
        }
      })
    )

    // Preparar datos para Excel - Solo datos esenciales
    const excelData = facturasConClases.map((factura: any) => {
      const student = factura.students
      
      // Formatear fecha de generación
      const fechaGeneracion = factura.fecha_expedicion || factura.created_at
      const fechaFormateada = new Date(fechaGeneracion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      // Obtener DNI/NIF del receptor (padre/madre/tutor) - datos fiscales
      const dniNif = factura.receptor_nif || student?.dni || student?.nif || 'Sin DNI/NIF'
      
      // Obtener nombre del receptor (padre/madre/tutor) - datos fiscales
      const nombreCompleto = factura.receptor_nombre || 
                            `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 
                            'Sin nombre'
      
      return {
        'Fecha Generación': fechaFormateada,
        'N° Factura': factura.invoice_number,
        'Importe (€)': Number(factura.total.toFixed(2)),
        'Cliente DNI/NIF': dniNif, // DNI/NIF del receptor (padre/madre/tutor)
        'Cliente Nombre': nombreCompleto // Nombre del receptor (padre/madre/tutor)
      }
    })

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Ajustar ancho de columnas - Solo 5 columnas esenciales
    const columnWidths = [
      { wch: 15 }, // Fecha Generación
      { wch: 20 }, // N° Factura
      { wch: 12 }, // Importe (€)
      { wch: 15 }, // Cliente DNI/NIF
      { wch: 30 }  // Cliente Nombre
    ]
    
    worksheet['!cols'] = columnWidths

    // Aplicar formato de moneda a la columna de importe
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }) // Columna C (Importe)
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].z = '"€"#,##0.00' // Formato de moneda
      }
    }

    // Añadir worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas')

    // Crear hoja de resumen - Datos esenciales
    const totalImporte = facturas.reduce((sum: number, factura: any) => sum + factura.total, 0)
    const facturasPagadas = facturas.filter((f: any) => f.status === 'paid').length
    const facturasPendientes = facturas.filter((f: any) => f.status === 'pending').length
    
    const resumenData = [
      {
        'Concepto': 'Total Facturas Exportadas',
        'Valor': facturas.length
      },
      {
        'Concepto': 'Total Importe (€)',
        'Valor': totalImporte.toFixed(2)
      },
      {
        'Concepto': 'Facturas Pagadas',
        'Valor': facturasPagadas
      },
      {
        'Concepto': 'Facturas Pendientes',
        'Valor': facturasPendientes
      },
      {
        'Concepto': 'Importe Promedio por Factura (€)',
        'Valor': facturas.length > 0 ? (totalImporte / facturas.length).toFixed(2) : '0.00'
      }
    ]

    const resumenWorksheet = XLSX.utils.json_to_sheet(resumenData)
    resumenWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, resumenWorksheet, 'Resumen')

    // Generar buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    })

    // Generar nombre de archivo fijo
    const filename = 'Eureka-Connet-Facturas.xlsx'

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exportando facturas a Excel:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al exportar facturas' },
      { status: 500 }
    )
  }
}
