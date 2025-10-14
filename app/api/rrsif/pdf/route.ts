import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { generarPDFFactura } from '@/lib/pdf-generator'

export async function GET(request: NextRequest) {
  try {
    // Validar que la URL sea válida
    if (!request.url) {
      return NextResponse.json(
        { error: 'URL de request inválida' },
        { status: 400 }
      )
    }

    let searchParams
    try {
      const url = new URL(request.url)
      searchParams = url.searchParams
    } catch (urlError) {
      console.error('Error creando URL:', urlError)
      return NextResponse.json(
        { error: 'URL de request malformada' },
        { status: 400 }
      )
    }

    const facturaId = searchParams.get('id')

    if (!facturaId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // Obtener factura real de la base de datos
    const { data: facturaData, error: facturaError } = await supabase
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
          has_shared_pricing
        )
      `)
      .eq('id', facturaId)
      .single()

    if (facturaError || !facturaData) {
      console.error('Error obteniendo factura:', facturaError)
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }


    // Obtener clases de la factura
    const { data: clasesData, error: clasesError } = await supabase
      .from('factura_clases')
      .select('*')
      .eq('factura_id', facturaId)

    if (clasesError) {
      console.error('Error obteniendo clases:', clasesError)
    }

    // Mapear datos al formato esperado
    const factura = {
      id: facturaData.id,
      invoiceNumber: facturaData.invoice_number,
      student_id: facturaData.student_id,
      student: {
        id: facturaData.students.id,
        firstName: facturaData.students.first_name,
        lastName: facturaData.students.last_name,
        email: facturaData.students.email,
        phone: facturaData.students.phone,
        address: facturaData.students.address,
        city: facturaData.students.city,
        province: facturaData.students.province,
        postalCode: facturaData.students.postal_code,
        country: facturaData.students.country,
        dni: facturaData.students.dni,
        has_shared_pricing: facturaData.students.has_shared_pricing || false
      },
      receptor: {
        nif: facturaData.receptor_nif,
        nombre: facturaData.receptor_nombre,
        direccion: facturaData.receptor_direccion,
        codigoPostal: facturaData.receptor_codigo_postal,
        municipio: facturaData.receptor_municipio,
        provincia: facturaData.receptor_provincia,
        pais: facturaData.receptor_pais,
        telefono: facturaData.receptor_telefono,
        email: facturaData.receptor_email,
        tipoIdentificacion: facturaData.receptor_tipo_identificacion || 'DNI'
      },
      classes: clasesData?.map(clase => ({
        id: clase.id,
        fecha: clase.fecha,
        hora_inicio: clase.hora_inicio,
        hora_fin: clase.hora_fin,
        duracion: clase.duracion,
        asignatura: clase.asignatura,
        precio: clase.precio
      })) || [],
      total: facturaData.total,
      month: facturaData.month,
      status: facturaData.status,
      estado_factura: facturaData.estado_factura,
      descripcion: facturaData.descripcion,
      datos_fiscales_emisor: {
        nif: facturaData.emisor_nif,
        nombre: facturaData.emisor_nombre,
        direccion: facturaData.emisor_direccion,
        codigoPostal: facturaData.emisor_codigo_postal,
        municipio: facturaData.emisor_municipio,
        provincia: facturaData.emisor_provincia,
        pais: facturaData.emisor_pais,
        telefono: facturaData.emisor_telefono,
        email: facturaData.emisor_email
      },
      datos_receptor: {
        nif: facturaData.receptor_nif,
        nombre: facturaData.receptor_nombre,
        direccion: facturaData.receptor_direccion,
        codigoPostal: facturaData.receptor_codigo_postal,
        municipio: facturaData.receptor_municipio,
        provincia: facturaData.receptor_provincia,
        pais: facturaData.receptor_pais,
        telefono: facturaData.receptor_telefono,
        email: facturaData.receptor_email,
        tipoIdentificacion: facturaData.receptor_tipo_identificacion || 'DNI'
      },
      created_at: facturaData.created_at,
      updated_at: facturaData.updated_at,
      registro_facturacion: {
        serie: facturaData.serie,
        numero: facturaData.numero,
        fecha_expedicion: facturaData.fecha_expedicion,
        fecha_operacion: facturaData.fecha_expedicion,
        hash_registro: facturaData.hash_registro,
        timestamp: facturaData.timestamp,
        estado_envio: facturaData.estado_envio,
        url_verificacion: facturaData.url_verificacion,
        base_imponible: facturaData.total * 0.826,
        importe_total: facturaData.total,
        desglose_iva: [{
          tipo: 21,
          cuota: facturaData.total * 0.174,
          base: facturaData.total * 0.826
        }]
      }
    }


    // Generar PDF usando el campo incluye_qr de la base de datos
    const incluirQR = facturaData.incluye_qr === true
    const pdfDoc = await generarPDFFactura(factura as any, incluirQR)
    const pdfBuffer = pdfDoc.output('arraybuffer')

    // Devolver PDF como respuesta
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${factura.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { 
        error: 'Error generando PDF',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
