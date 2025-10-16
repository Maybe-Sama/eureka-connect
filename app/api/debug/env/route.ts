// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Solo mostrar en desarrollo o si se especifica explícitamente
    const isDev = process.env.NODE_ENV === 'development'
    const showDebug = request.nextUrl.searchParams.get('debug') === 'true'
    
    if (!isDev && !showDebug) {
      return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 })
    }
    
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      // Verificar si los archivos existen
      filesystem: {
        cwd: process.cwd(),
        logoExists: false
      }
    }
    
    // Verificar si el logo existe
    try {
      const fs = require('fs')
      const path = require('path')
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      envCheck.filesystem.logoExists = fs.existsSync(logoPath)
    } catch (error) {
      envCheck.filesystem.logoExists = false
    }
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Error checking environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
