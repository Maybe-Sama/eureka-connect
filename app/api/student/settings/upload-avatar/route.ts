import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isCustomAvatar, getFileNameFromUrl, generateCustomAvatarFileName } from '@/lib/avatar-utils'

export async function POST(request: NextRequest) {
  try {
    const { token, file, fileName } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token de sesión requerido' }, { status: 401 })
    }

    if (!file || !fileName) {
      return NextResponse.json({ success: false, error: 'Archivo y nombre requeridos' }, { status: 400 })
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
          // No fallar aquí, continuar con la subida del nuevo avatar
        } else {
          console.log('✅ Avatar anterior eliminado correctamente')
        }
      }
    }

    // Convertir base64 a buffer
    const fileBuffer = Buffer.from(file.split(',')[1], 'base64')
    const fileType = file.split(';')[0].split(':')[1]

    // Subir archivo usando el cliente admin (bypasa RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, fileBuffer, {
        contentType: fileType,
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al subir el archivo: ' + uploadError.message 
      }, { status: 500 })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Actualizar en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ avatar_url: publicUrl })
      .eq('id', userData.student_id)

    if (updateError) {
      console.error('Error updating database:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al actualizar la base de datos: ' + updateError.message 
      }, { status: 500 })
    }

    console.log('✅ Avatar personalizado subido y actualizado correctamente')

    return NextResponse.json({ 
      success: true, 
      avatarUrl: publicUrl,
      message: 'Avatar personalizado actualizado correctamente'
    })

  } catch (error: any) {
    console.error('Error in upload-avatar API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor: ' + error.message 
    }, { status: 500 })
  }
}
