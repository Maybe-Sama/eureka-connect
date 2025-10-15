// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      )
    }

    const result = await validateSession(token)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error validating session:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


