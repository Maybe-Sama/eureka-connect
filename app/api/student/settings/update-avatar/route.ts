// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isCustomAvatar, getFileNameFromUrl } from '@/lib/avatar-utils'

export async function POST(request: NextRequest) {
  try {
    const { token, avatarUrl } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token de sesión requerido' }, { status: 401 })
    }

    if (!avatarUrl) {
      return NextResponse.json({ success: false, error: 'URL de avatar requerida' }, { status: 400 })
    }

    // Verificar que el usuario existe y es un estudiante
    const { data: userData, error: userError } = await supabaseAdmin
      .from('system_users')
      .select('id, student_id, user_type')
      .eq('id', token)
      .eq('user_type', 'student')
      .single()

    if (userError || !userData?.student_id) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado o no es estudiante' }, { status: 404 })
    }

    // Obtener el avatar actual del estudiante
    const { data: currentStudent, error: studentError } = await supabaseAdmin
      .from('students')
      .select('avatar_url')
      .eq('id', userData.student_id)
      .single()

    if (studentError) {
      console.error('Error fetching current student:', studentError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al obtener datos del estudiante: ' + studentError.message 
      }, { status: 500 })
    }

    // Si existe un avatar personalizado previo, eliminarlo del storage
    if (currentStudent?.avatar_url && isCustomAvatar(currentStudent.avatar_url)) {
      console.log('🗑️ Eliminando avatar personalizado previo:', currentStudent.avatar_url)
      
      const oldFileName = getFileNameFromUrl(currentStudent.avatar_url)
      if (oldFileName) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from('avatars')
          .remove([oldFileName])

        if (deleteError) {
          console.warn('⚠️ No se pudo eliminar el avatar anterior:', deleteError.message)
          // No fallar aquí, continuar con la actualización
        } else {
          console.log('✅ Avatar personalizado anterior eliminado correctamente')
        }
      }
    }

    // Actualizar en la base de datos con el nuevo avatar (predefinido)
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ avatar_url: avatarUrl })
      .eq('id', userData.student_id)

    if (updateError) {
      console.error('Error updating database:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al actualizar la base de datos: ' + updateError.message 
      }, { status: 500 })
    }

    console.log('✅ Avatar predefinido actualizado correctamente')

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar predefinido actualizado correctamente' 
    })

  } catch (error: any) {
    console.error('Error in update-avatar API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor: ' + error.message 
    }, { status: 500 })
  }
}
