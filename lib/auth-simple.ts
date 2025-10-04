import { supabase } from './supabase'
import crypto from 'crypto'

export interface User {
  id: string
  email: string
  userType: 'teacher' | 'student'
  studentId?: number
  studentName?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

// Generar token de sesión seguro
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Crear hash de contraseña (simple para desarrollo)
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Autenticar profesor (versión simple)
export async function authenticateTeacher(email: string, password: string): Promise<AuthResult> {
  try {
    // Verificar credenciales del .env
    const teacherEmail = process.env.TEACHER_EMAIL || 'profesor@eureka.com'
    const teacherPassword = process.env.TEACHER_PASSWORD || 'profesor123'
    
    if (email !== teacherEmail || password !== teacherPassword) {
      return { success: false, error: 'Credenciales inválidas' }
    }

    // Crear usuario profesor si no existe
    const hashedPassword = hashPassword(password)
    
    // Intentar insertar usuario (ignorar si ya existe)
    const { error: insertError } = await supabase
      .from('system_users')
      .upsert({
        email: email,
        password_hash: hashedPassword,
        user_type: 'teacher'
      }, {
        onConflict: 'email'
      })

    if (insertError) {
      console.error('Error upserting teacher user:', insertError)
      return { success: false, error: 'Error al crear usuario profesor' }
    }

    // Obtener el usuario
    const { data: user, error: userError } = await supabase
      .from('system_users')
      .select('id')
      .eq('email', email)
      .eq('user_type', 'teacher')
      .single()

    if (userError || !user) {
      return { success: false, error: 'Error al obtener usuario profesor' }
    }

    // Crear sesión
    const sessionToken = generateSessionToken()
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return { success: false, error: 'Error al crear sesión' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: email,
        userType: 'teacher'
      },
      token: sessionToken
    }
  } catch (error) {
    console.error('Error authenticating teacher:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Validar sesión (versión simple)
export async function validateSession(token: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        id,
        expires_at,
        system_users!inner (
          id,
          email,
          user_type,
          student_id
        )
      `)
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return { success: false, error: 'Sesión inválida o expirada' }
    }

    return {
      success: true,
      user: {
        id: data.system_users.id,
        email: data.system_users.email,
        userType: data.system_users.user_type as 'teacher' | 'student',
        studentId: data.system_users.student_id
      }
    }
  } catch (error) {
    console.error('Error validating session:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Cerrar sesión
export async function logout(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', token)

    return !error
  } catch (error) {
    console.error('Error logging out:', error)
    return false
  }
}
