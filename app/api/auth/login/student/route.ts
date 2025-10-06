import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { studentCode, password } = await request.json()

    if (!studentCode || !password) {
      return NextResponse.json(
        { success: false, error: 'Código de estudiante y contraseña requeridos' },
        { status: 400 }
      )
    }

    const result = await authenticateStudent(studentCode, password)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error authenticating student:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


