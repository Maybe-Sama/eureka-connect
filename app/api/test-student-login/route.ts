// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json()

    console.log('🧪 Testing student login with:', { 
      identifier: identifier?.substring(0, 20) + '...', 
      hasPassword: !!password 
    })

    // Probar con los datos reales de la base de datos
    const testResults = []

    // Test 1: Código sin guiones (como está en la BD)
    if (identifier && !identifier.includes('@')) {
      const normalizedCode = identifier.replace(/[-\s]/g, '').trim().toUpperCase()
      testResults.push({
        test: 'Código normalizado',
        input: identifier,
        normalized: normalizedCode,
        length: normalizedCode.length
      })
    }

    // Test 2: Email
    if (identifier && identifier.includes('@')) {
      testResults.push({
        test: 'Email',
        input: identifier,
        normalized: identifier.trim().toLowerCase()
      })
    }

    // Test 3: Intentar autenticación real
    const authResult = await authenticateStudent(identifier, password)

    return NextResponse.json({
      success: true,
      testResults,
      authResult,
      debug: {
        identifier,
        hasPassword: !!password,
        isEmail: identifier?.includes('@'),
        isCode: !identifier?.includes('@')
      }
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}












