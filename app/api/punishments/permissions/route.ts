import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const action = searchParams.get('action') // 'spin', 'complete', 'view'

    if (!studentId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Verificar que el usuario esté autenticado
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar el token y obtener información del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Obtener información del usuario desde la tabla de usuarios
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type, student_id, teacher_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verificar permisos según la acción
    let hasPermission = false
    let reason = ''

    switch (action) {
      case 'spin':
        // Solo el profesor puede lanzar la ruleta para un estudiante
        if (userData.user_type === 'teacher') {
          hasPermission = true
        } else if (userData.user_type === 'student' && userData.student_id?.toString() === studentId) {
          // El estudiante puede lanzar su propia ruleta, pero con restricciones
          hasPermission = true
        } else {
          reason = 'Solo el profesor puede lanzar la ruleta para otros estudiantes'
        }
        break

      case 'complete':
        // Solo el profesor puede marcar castigos como completados
        if (userData.user_type === 'teacher') {
          hasPermission = true
        } else {
          reason = 'Solo el profesor puede marcar castigos como completados'
        }
        break

      case 'view':
        // El profesor puede ver todos, el estudiante solo los suyos
        if (userData.user_type === 'teacher' || 
            (userData.user_type === 'student' && userData.student_id?.toString() === studentId)) {
          hasPermission = true
        } else {
          reason = 'No tienes permisos para ver estos datos'
        }
        break

      default:
        reason = 'Acción no válida'
    }

    return NextResponse.json({
      hasPermission,
      reason,
      userType: userData.user_type,
      isOwner: userData.student_id?.toString() === studentId
    })

  } catch (error) {
    console.error('Error checking permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
