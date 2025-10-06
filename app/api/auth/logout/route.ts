import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/auth-complex'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      )
    }

    const success = await logout(token)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error logging out:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


