// @ts-nocheck
/**
 * API para obtener facturas RRSIF
 * Retorna lista de facturas con información de cumplimiento normativo
 * Ahora usa Supabase en lugar de almacenamiento en memoria
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Obtener facturas desde Supabase
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
          has_shared_pricing
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo facturas desde Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener facturas de la base de datos' },
        { status: 500 }
      )
    }

    // Obtener clases para cada factura
    const facturasConClases = await Promise.all(
      facturas?.map(async (factura) => {
        // Obtener clases de la factura
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
      }) || []
    )

    // Mapear datos de Supabase al formato esperado
    const facturasFormateadas = facturasConClases.map(factura => ({
      id: factura.id,
      invoiceNumber: factura.invoice_number,
      student_id: factura.student_id,
      student: {
        id: factura.student_id,
        firstName: factura.students?.first_name || 'Estudiante',
        lastName: factura.students?.last_name || 'Sin apellido',
        email: factura.students?.email || '',
        phone: factura.students?.phone || '',
        address: factura.students?.address || '',
        city: factura.students?.city || '',
        province: factura.students?.province || '',
        postalCode: factura.students?.postal_code || '',
        country: factura.students?.country || 'España',
        dni: factura.students?.dni || '',
        has_shared_pricing: factura.students?.has_shared_pricing || false,
        birthDate: '',
        courseId: '1',
        studentCode: `STU-${factura.student_id}`,
        receptorNombre: '',
        receptorApellidos: '',
        receptorEmail: '',
        createdAt: factura.created_at,
        updatedAt: factura.updated_at
      },
      receptor: {
        nif: factura.receptor_nif,
        nombre: factura.receptor_nombre,
        direccion: factura.receptor_direccion,
        codigoPostal: factura.receptor_codigo_postal,
        municipio: factura.receptor_municipio,
        provincia: factura.receptor_provincia,
        pais: factura.receptor_pais,
        telefono: factura.receptor_telefono,
        email: factura.receptor_email
      },
      classes: factura.clases?.map(clase => ({
        id: clase.id,
        fecha: clase.fecha,
        hora_inicio: clase.hora_inicio,
        hora_fin: clase.hora_fin,
        duracion: clase.duracion,
        asignatura: clase.asignatura,
        precio: clase.precio
      })) || [],
      total: factura.total,
      month: factura.month,
      status: factura.status,
      estado_factura: factura.estado_factura,
      descripcion: factura.descripcion,
      datos_fiscales_emisor: {
        nif: factura.emisor_nif,
        nombre: factura.emisor_nombre,
        direccion: factura.emisor_direccion,
        codigoPostal: factura.emisor_codigo_postal,
        municipio: factura.emisor_municipio,
        provincia: factura.emisor_provincia,
        pais: factura.emisor_pais,
        telefono: factura.emisor_telefono,
        email: factura.emisor_email
      },
      datos_receptor: {
        nif: factura.receptor_nif,
        nombre: factura.receptor_nombre,
        direccion: factura.receptor_direccion,
        codigoPostal: factura.receptor_codigo_postal,
        municipio: factura.receptor_municipio,
        provincia: factura.receptor_provincia,
        pais: factura.receptor_pais,
        telefono: factura.receptor_telefono,
        email: factura.receptor_email
      },
      created_at: factura.created_at,
      updated_at: factura.updated_at,
      registro_facturacion: {
        serie: factura.serie,
        numero: factura.numero,
        fecha_expedicion: factura.fecha_expedicion,
        hash_registro: factura.hash_registro,
        timestamp: factura.timestamp,
        estado_envio: factura.estado_envio,
        url_verificacion: factura.url_verificacion
      },
      incluye_qr: factura.incluye_qr
    })) || []

    return NextResponse.json(facturasFormateadas)

  } catch (error) {
    console.error('Error obteniendo facturas RRSIF:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { factura } = body

    if (!factura) {
      return NextResponse.json(
        { success: false, error: 'Datos de factura requeridos' },
        { status: 400 }
      )
    }

    // Guardar factura en Supabase
    const { data, error } = await supabase
      .from('facturas_rrsif')
      .insert({
        id: factura.id,
        invoice_number: factura.invoiceNumber,
        student_id: parseInt(factura.student_id),
        total: factura.total,
        month: factura.month,
        status: factura.status,
        estado_factura: factura.estado_factura,
        descripcion: factura.descripcion,
        created_at: factura.created_at,
        updated_at: factura.updated_at,
        
        // Datos fiscales del emisor
        emisor_nif: factura.datos_fiscales_emisor?.nif || '',
        emisor_nombre: factura.datos_fiscales_emisor?.nombre || '',
        emisor_direccion: factura.datos_fiscales_emisor?.direccion || '',
        emisor_codigo_postal: factura.datos_fiscales_emisor?.codigoPostal || '',
        emisor_municipio: factura.datos_fiscales_emisor?.municipio || '',
        emisor_provincia: factura.datos_fiscales_emisor?.provincia || '',
        emisor_pais: factura.datos_fiscales_emisor?.pais || 'España',
        emisor_telefono: factura.datos_fiscales_emisor?.telefono || '',
        emisor_email: factura.datos_fiscales_emisor?.email || '',
        
        // Datos del receptor
        receptor_nif: factura.datos_receptor?.nif || '',
        receptor_nombre: factura.datos_receptor?.nombre || '',
        receptor_direccion: factura.datos_receptor?.direccion || '',
        receptor_codigo_postal: factura.datos_receptor?.codigoPostal || '',
        receptor_municipio: factura.datos_receptor?.municipio || '',
        receptor_provincia: factura.datos_receptor?.provincia || '',
        receptor_pais: factura.datos_receptor?.pais || 'España',
        receptor_telefono: factura.datos_receptor?.telefono || '',
        receptor_email: factura.datos_receptor?.email || '',
        receptor_tipo_identificacion: factura.datos_receptor?.tipoIdentificacion || 'DNI',
        
        // Registro de facturación RRSIF
        serie: factura.registro_facturacion?.serie || 'ERK',
        numero: factura.registro_facturacion?.numero || '',
        fecha_expedicion: factura.registro_facturacion?.fecha_expedicion || '',
        hash_registro: factura.registro_facturacion?.hash_registro || '',
        timestamp: factura.registro_facturacion?.timestamp || '',
        estado_envio: factura.registro_facturacion?.estado_envio || 'pendiente',
        url_verificacion: factura.registro_facturacion?.url_verificacion || '',
        
        // Metadatos adicionales
        pdf_generado: false,
        pdf_path: null,
        pdf_size: null
      })
      .select()

    if (error) {
      console.error('Error guardando factura en Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Error al guardar factura en la base de datos' },
        { status: 500 }
      )
    }

    // Guardar las clases de la factura si existen
    if (factura.classes && factura.classes.length > 0) {
      const clasesData = factura.classes.map((clase: any) => ({
        factura_id: factura.id,
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

    return NextResponse.json({
      success: true,
      factura: factura,
      message: 'Factura guardada exitosamente en Supabase'
    })

  } catch (error) {
    console.error('Error guardando factura RRSIF:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
