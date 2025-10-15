// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { authenticateTeacher } from '@/lib/auth-complex'
import { checkRateLimit, resetRateLimit, getClientIP } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    // Verificar rate limiting
    const clientIP = getClientIP(request)
    const rateLimitKey = `teacher-login:${clientIP}`
    const rateLimit = checkRateLimit(rateLimitKey)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimit.error },
        { status: 429 } // Too Many Requests
      )
    }

    const result = await authenticateTeacher(email, password)

    // Si el login es exitoso, resetear el contador
    if (result.success) {
      resetRateLimit(rateLimitKey)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error authenticating teacher:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


