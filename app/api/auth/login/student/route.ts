import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json()

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Código de estudiante/email y contraseña requeridos' },
        { status: 400 }
      )
    }

    const result = await authenticateStudent(identifier, password)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error authenticating student:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


