// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Probando inserción con receptor_tipo_identificacion...')
    
    // Intentar insertar una factura de prueba con el campo receptor_tipo_identificacion
    const { data, error } = await supabase
      .from('facturas_rrsif')
      .insert({
        id: `test-${Date.now()}`,
        invoice_number: 'TEST-001',
        student_id: 1,
        total: 0,
        month: 'test',
        status: 'test',
        estado_factura: 'test',
        descripcion: 'Test de migración',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        emisor_nif: '12345678A',
        emisor_nombre: 'Test Emisor',
        emisor_direccion: 'Test Dirección',
        emisor_codigo_postal: '00000',
        emisor_municipio: 'Test Ciudad',
        emisor_provincia: 'Test Provincia',
        emisor_pais: 'España',
        emisor_telefono: '000000000',
        emisor_email: 'test@test.com',
        receptor_nif: '87654321B',
        receptor_nombre: 'Test Receptor',
        receptor_direccion: 'Test Dirección',
        receptor_codigo_postal: '00000',
        receptor_municipio: 'Test Ciudad',
        receptor_provincia: 'Test Provincia',
        receptor_pais: 'España',
        receptor_telefono: '000000000',
        receptor_email: 'test@test.com',
        receptor_tipo_identificacion: 'NIF', // Campo que queremos probar
        serie: 'TEST',
        numero: '001',
        fecha_expedicion: new Date().toISOString(),
        hash_registro: 'test-hash',
        timestamp: new Date().toISOString(),
        estado_envio: 'pendiente',
        url_verificacion: null,
        pdf_generado: false,
        pdf_path: null,
        pdf_size: null,
        incluye_qr: false
      })
      .select()
    
    if (error) {
      console.error('❌ Error insertando factura de prueba:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'El campo receptor_tipo_identificacion probablemente no existe en la tabla'
      })
    }
    
    console.log('✅ Factura de prueba insertada exitosamente:', data)
    
    // Limpiar la factura de prueba
    await supabase
      .from('facturas_rrsif')
      .delete()
      .eq('id', `test-${Date.now()}`)
    
    return NextResponse.json({
      success: true,
      message: 'Campo receptor_tipo_identificacion existe y funciona correctamente',
      data: data
    })
    
  } catch (err) {
    console.error('❌ Error en prueba:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    })
  }
}
