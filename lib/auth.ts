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

    // Generar token de sesión simple (sin base de datos por ahora)
    const sessionToken = generateSessionToken()

    // Simular usuario profesor
    const userId = 'teacher_' + Date.now()

    return {
      success: true,
      user: {
        id: userId,
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
    // Por ahora, validar que el token existe en localStorage
    // En una implementación real, esto se validaría contra la base de datos
    if (!token || token.length < 10) {
      return { success: false, error: 'Sesión inválida' }
    }

    // Simular validación exitosa
    // En el futuro, aquí se consultaría la base de datos
    return {
      success: true,
      user: {
        id: 'teacher_session',
        email: process.env.TEACHER_EMAIL || 'profesor@eureka.com',
        userType: 'teacher' as const
      }
    }
  } catch (error) {
    console.error('Error validating session:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Autenticar estudiante
export async function authenticateStudent(studentCode: string, password: string): Promise<AuthResult> {
  try {
    // Buscar estudiante por código
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, student_code, password_hash')
      .eq('student_code', studentCode)
      .single()

    if (studentError || !student) {
      return { success: false, error: 'Código de estudiante inválido' }
    }

    // Verificar contraseña
    const hashedPassword = hashPassword(password)
    if (student.password_hash !== hashedPassword) {
      return { success: false, error: 'Contraseña incorrecta' }
    }

    // Crear o actualizar usuario en system_users
    const { error: upsertError } = await supabase
      .from('system_users')
      .upsert({
        email: `student_${studentCode}@eureka.com`, // Email temporal para estudiantes
        password_hash: hashedPassword,
        user_type: 'student',
        student_id: student.id
      }, {
        onConflict: 'student_id'
      })

    if (upsertError) {
      console.error('Error upserting student user:', upsertError)
      return { success: false, error: 'Error al crear usuario estudiante' }
    }

    // Obtener el usuario del sistema
    const { data: user, error: userError } = await supabase
      .from('system_users')
      .select('id')
      .eq('student_id', student.id)
      .eq('user_type', 'student')
      .single()

    if (userError || !user) {
      return { success: false, error: 'Error al obtener usuario estudiante' }
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
        email: `student_${studentCode}@eureka.com`,
        userType: 'student',
        studentId: student.id,
        studentName: student.name
      },
      token: sessionToken
    }
  } catch (error) {
    console.error('Error authenticating student:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Cerrar sesión
export async function logout(token: string): Promise<boolean> {
  try {
    // Por ahora, solo retornar true ya que no hay base de datos
    // En el futuro, aquí se eliminaría la sesión de la base de datos
    return true
  } catch (error) {
    console.error('Error logging out:', error)
    return false
  }
}
