import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facturaId = searchParams.get('id')

    if (!facturaId) {
      return NextResponse.json({ error: 'ID de factura requerido' })
    }

    console.log('🔍 DEBUGGING FACTURA PDF:', facturaId)

    // Obtener factura de la base de datos
    const { data: facturaData, error: facturaError } = await supabase
      .from('facturas_rrsif')
      .select('*')
      .eq('id', facturaId)
      .single()

    if (facturaError || !facturaData) {
      return NextResponse.json({ error: 'Factura no encontrada' })
    }

    console.log('📄 Datos de la factura desde BD:')
    console.log('- receptor_nif:', facturaData.receptor_nif)
    console.log('- receptor_tipo_identificacion:', facturaData.receptor_tipo_identificacion)
    console.log('- Todos los campos receptor:', Object.keys(facturaData).filter(k => k.startsWith('receptor_')))

    // Mapear como lo hace el endpoint PDF
    const receptor = {
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
    }

    console.log('🔄 Objeto receptor mapeado:')
    console.log('- receptor.nif:', receptor.nif)
    console.log('- receptor.tipoIdentificacion:', receptor.tipoIdentificacion)
    console.log('- receptor completo:', receptor)

    return NextResponse.json({
      success: true,
      facturaId,
      datosOriginales: {
        receptor_nif: facturaData.receptor_nif,
        receptor_tipo_identificacion: facturaData.receptor_tipo_identificacion
      },
      receptorMapeado: receptor
    })

  } catch (err) {
    console.error('❌ Error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error desconocido' })
  }
}
