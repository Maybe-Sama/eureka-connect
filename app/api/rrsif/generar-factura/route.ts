import { NextRequest, NextResponse } from 'next/server'
import { generarPDFFactura } from '@/lib/pdf-generator'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, clasesIds, datosFiscales, datosReceptor, descripcion, incluirQR = false } = body

    console.log('=== GENERANDO FACTURA ===')
    console.log('StudentId:', studentId)
    console.log('ClasesIds:', clasesIds)
    console.log('DatosFiscales recibidos:', JSON.stringify(datosFiscales, null, 2))
    console.log('DatosReceptor:', JSON.stringify(datosReceptor, null, 2))
    console.log('Descripción:', descripcion)
    console.log('Incluir QR:', incluirQR)

    // Validar datos requeridos
    if (!studentId || !clasesIds || !datosFiscales || !datosReceptor) {
      return NextResponse.json(
        { error: 'Datos incompletos para generar la factura' },
        { status: 400 }
      )
    }

    // Obtener datos reales de las clases desde la base de datos
    const { data: clasesReales, error: clasesError } = await supabase
      .from('classes')
      .select(`
        id,
        date,
        start_time,
        end_time,
        duration,
        subject,
        price,
        student_id
      `)
      .in('id', clasesIds)
      .eq('payment_status', 'paid')

    if (clasesError) {
      console.error('Error obteniendo clases:', clasesError)
      return NextResponse.json(
        { error: 'Error obteniendo datos de las clases' },
        { status: 500 }
      )
    }

    if (!clasesReales || clasesReales.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron clases válidas' },
        { status: 400 }
      )
    }

    // Obtener datos del estudiante por separado
    const estudianteId = clasesReales[0].student_id
    const { data: estudianteData, error: estudianteError } = await supabase
      .from('students')
      .select(`
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
        has_shared_pricing
      `)
      .eq('id', estudianteId)
      .single()

    if (estudianteError) {
      console.error('Error obteniendo estudiante:', estudianteError)
      return NextResponse.json(
        { error: 'Error obteniendo datos del estudiante' },
        { status: 500 }
      )
    }

    // Mapear datos de las clases
    const clasesData = clasesReales.map((clase: any) => ({
      id: clase.id,
      fecha: clase.date,
      hora_inicio: clase.start_time,
      hora_fin: clase.end_time,
      duracion: clase.duration,
      asignatura: clase.subject || 'Clase particular',
      precio: clase.price
    }))

    // Calcular total real basado en los precios de las clases
    const total = clasesData.reduce((sum, clase) => sum + clase.precio, 0)

    // Obtener número correlativo de factura
    const numeroResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rrsif/numero-factura`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    let numeroFactura = 'ERK-0001' // Fallback correcto
    if (numeroResponse.ok) {
      const numeroData = await numeroResponse.json()
      if (numeroData.success && numeroData.siguienteNumero) {
        numeroFactura = numeroData.siguienteNumero
      }
    } else {
      console.warn('Error obteniendo número de factura, usando fallback:', numeroResponse.status)
    }

    const facturaData = {
      id: `factura-${Date.now()}`,
      invoiceNumber: numeroFactura,
      student_id: studentId,
      student: {
        id: studentId,
        firstName: estudianteData.first_name,
        lastName: estudianteData.last_name,
        email: estudianteData.email,
        phone: estudianteData.phone,
        address: estudianteData.address,
        city: estudianteData.city,
        province: estudianteData.province,
        postalCode: estudianteData.postal_code,
        country: estudianteData.country,
        dni: estudianteData.dni,
        has_shared_pricing: estudianteData.has_shared_pricing || false
      },
      receptor: datosReceptor,
      classes: clasesData,
      total: total,
      month: new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      }),
      status: 'generated',
      estado_factura: 'provisional',
      descripcion: descripcion,
      datos_fiscales_emisor: datosFiscales,
      datos_receptor: datosReceptor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      registro_facturacion: {
        serie: 'ERK',
        numero: String(Date.now()).slice(-4),
        fecha_expedicion: new Date().toISOString(),
        fecha_operacion: new Date().toISOString(),
        hash_registro: `hash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        estado_envio: 'pendiente',
        url_verificacion: incluirQR ? `https://verifactu.aeat.es/verifactu/hash-${Date.now()}` : null,
        base_imponible: total * 0.826, // Base imponible (sin IVA)
        importe_total: total,
        desglose_iva: [{
          tipo: 21,
          cuota: total * 0.174, // IVA 21%
          base: total * 0.826
        }]
      }
    }

    console.log('Factura generada:', facturaData)

    // Guardar factura directamente en Supabase
    console.log('Guardando factura en Supabase:', facturaData.id)

    try {
      // Guardar factura en Supabase
      const { data: facturaGuardada, error: facturaError } = await supabase
        .from('facturas_rrsif')
        .insert({
          id: facturaData.id,
          invoice_number: facturaData.invoiceNumber,
          student_id: parseInt(facturaData.student_id),
          total: facturaData.total,
          month: facturaData.month,
          status: facturaData.status,
          estado_factura: facturaData.estado_factura,
          descripcion: facturaData.descripcion,
          created_at: facturaData.created_at,
          updated_at: facturaData.updated_at,
          
          // Datos fiscales del emisor
          emisor_nif: facturaData.datos_fiscales_emisor?.nif || '',
          emisor_nombre: facturaData.datos_fiscales_emisor?.nombre || '',
          emisor_direccion: facturaData.datos_fiscales_emisor?.direccion || '',
          emisor_codigo_postal: facturaData.datos_fiscales_emisor?.codigoPostal || '',
          emisor_municipio: facturaData.datos_fiscales_emisor?.municipio || '',
          emisor_provincia: facturaData.datos_fiscales_emisor?.provincia || '',
          emisor_pais: facturaData.datos_fiscales_emisor?.pais || 'España',
          emisor_telefono: facturaData.datos_fiscales_emisor?.telefono || '',
          emisor_email: facturaData.datos_fiscales_emisor?.email || '',
          
          // Datos del receptor
          receptor_nif: facturaData.datos_receptor?.nif || '',
          receptor_nombre: facturaData.datos_receptor?.nombre || '',
          receptor_direccion: facturaData.datos_receptor?.direccion || '',
          receptor_codigo_postal: facturaData.datos_receptor?.codigoPostal || '',
          receptor_municipio: facturaData.datos_receptor?.municipio || '',
          receptor_provincia: facturaData.datos_receptor?.provincia || '',
          receptor_pais: facturaData.datos_receptor?.pais || 'España',
          receptor_telefono: facturaData.datos_receptor?.telefono || '',
          receptor_email: facturaData.datos_receptor?.email || '',
          
          // Registro de facturación RRSIF
          serie: facturaData.registro_facturacion?.serie || 'ERK',
          numero: facturaData.registro_facturacion?.numero || '',
          fecha_expedicion: facturaData.registro_facturacion?.fecha_expedicion || '',
          hash_registro: facturaData.registro_facturacion?.hash_registro || '',
          timestamp: facturaData.registro_facturacion?.timestamp || '',
          estado_envio: facturaData.registro_facturacion?.estado_envio || 'pendiente',
          url_verificacion: facturaData.registro_facturacion?.url_verificacion || '',
          
          // Metadatos adicionales
          pdf_generado: false,
          pdf_path: null,
          pdf_size: null
          // incluye_qr: incluirQR // Temporalmente comentado hasta que se ejecute la migración
        })
        .select()

      if (facturaError) {
        console.error('Error guardando factura en Supabase:', facturaError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al guardar factura en la base de datos',
            detalles: facturaError.message
          },
          { status: 500 }
        )
      }

      // Guardar las clases de la factura si existen
      if (facturaData.classes && facturaData.classes.length > 0) {
        const clasesData = facturaData.classes.map((clase: any) => ({
          factura_id: facturaData.id,
          clase_id: parseInt(clase.id),
          fecha: clase.fecha,
          hora_inicio: clase.hora_inicio,
          hora_fin: clase.hora_fin,
          duracion: clase.duracion,
          asignatura: clase.asignatura,
          precio: clase.precio
        }))

        const { error: clasesError } = await supabase
          .from('factura_clases')
          .insert(clasesData)

        if (clasesError) {
          console.error('Error guardando clases de factura:', clasesError)
          // No fallar la operación principal, solo loguear el error
        }
      }

      console.log('Factura guardada exitosamente en Supabase:', facturaData.id)

    } catch (dbError) {
      console.error('Error en operación de base de datos:', dbError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al guardar en la base de datos',
          detalles: dbError instanceof Error ? dbError.message : 'Error desconocido'
        },
        { status: 500 }
      )
    }

    // Generar PDF
    try {
      const pdfDoc = await generarPDFFactura(facturaData as any, incluirQR)
      const pdfBuffer = pdfDoc.output('arraybuffer')
      
      console.log('PDF generado exitosamente, tamaño:', pdfBuffer.byteLength, 'bytes')
      
      // En un entorno real, aquí se guardaría el PDF en el sistema de archivos o S3
      // Por ahora, solo logueamos el éxito
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError)
      // Continuar sin PDF por ahora
    }

    return NextResponse.json({
      success: true,
      factura: facturaData,
      message: 'Factura generada y guardada exitosamente en Supabase'
    })

  } catch (error) {
    console.error('Error generando factura:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}