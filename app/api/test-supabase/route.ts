// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING SUPABASE CONNECTION ===')
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Test 1: Verificar conexión básica
    const { data: testData, error: testError } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .limit(1)
    
    if (testError) {
      console.error('Error en test básico:', testError)
      return NextResponse.json({
        success: false,
        error: 'Error de conexión a Supabase',
        details: testError.message,
        code: testError.code
      }, { status: 500 })
    }
    
    // Test 2: Verificar tabla de clases
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('id, payment_status, status_invoice')
      .limit(5)
    
    if (classesError) {
      console.error('Error en test de clases:', classesError)
      return NextResponse.json({
        success: false,
        error: 'Error accediendo a tabla de clases',
        details: classesError.message,
        code: classesError.code
      }, { status: 500 })
    }
    
    // Test 3: Verificar tabla de facturas
    const { data: facturasData, error: facturasError } = await supabase
      .from('facturas_rrsif')
      .select('id, invoice_number')
      .limit(1)
    
    if (facturasError) {
      console.error('Error en test de facturas:', facturasError)
      return NextResponse.json({
        success: false,
        error: 'Error accediendo a tabla de facturas',
        details: facturasError.message,
        code: facturasError.code
      }, { status: 500 })
    }
    
    console.log('=== TESTS COMPLETADOS EXITOSAMENTE ===')
    console.log('Students found:', testData?.length || 0)
    console.log('Classes found:', classesData?.length || 0)
    console.log('Facturas found:', facturasData?.length || 0)
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a Supabase funcionando correctamente',
      data: {
        students: testData?.length || 0,
        classes: classesData?.length || 0,
        facturas: facturasData?.length || 0
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('=== ERROR CRÍTICO EN TEST SUPABASE ===')
    console.error('Error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack available')
    
    return NextResponse.json({
      success: false,
      error: 'Error crítico en test de Supabase',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
