// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { registerStudent } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { studentCode, password, confirmPassword } = await request.json()

    if (!studentCode || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const result = await registerStudent(studentCode, password, confirmPassword)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error registering student:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


