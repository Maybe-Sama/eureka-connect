import { NextRequest, NextResponse } from 'next/server'
import { authenticateTeacher } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    const result = await authenticateTeacher(email, password)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error authenticating teacher:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


