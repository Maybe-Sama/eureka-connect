import { NextRequest, NextResponse } from 'next/server'
import { verifyStudentCode } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { studentCode } = await request.json()

    if (!studentCode) {
      return NextResponse.json(
        { success: false, error: 'Código de estudiante requerido' },
        { status: 400 }
      )
    }

    const result = await verifyStudentCode(studentCode)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error verifying student code:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


