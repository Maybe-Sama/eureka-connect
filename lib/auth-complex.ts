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

// Autenticar profesor
export async function authenticateTeacher(email: string, password: string): Promise<AuthResult> {
  try {
    // Verificar credenciales del .env
    const teacherEmail = process.env.TEACHER_EMAIL || 'profesor@eureka.com'
    const teacherPassword = process.env.TEACHER_PASSWORD || 'profesor123'
    
    if (email !== teacherEmail || password !== teacherPassword) {
      return { success: false, error: 'Credenciales inválidas' }
    }

    // Crear usuario profesor directamente (sin verificar si existe)
    const hashedPassword = hashPassword(password)
    const { data: newUser, error: createError } = await supabase
      .from('system_users')
      .insert({
        email: email,
        password_hash: hashedPassword,
        user_type: 'teacher'
      })
      .select('id')
      .single()

    if (createError) {
      // Si ya existe, buscar el usuario existente
      const { data: existingUser, error: userError } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', email)
        .eq('user_type', 'teacher')
        .single()

      if (userError || !existingUser) {
        return { success: false, error: 'Error al acceder al usuario profesor' }
      }

      // Crear sesión con usuario existente
      const sessionToken = generateSessionToken()
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: existingUser.id,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })

      if (sessionError) {
        return { success: false, error: 'Error al crear sesión' }
      }

      return {
        success: true,
        user: {
          id: existingUser.id,
          email: email,
          userType: 'teacher'
        },
        token: sessionToken
      }
    }

    // Crear sesión con nuevo usuario
    const sessionToken = generateSessionToken()
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: newUser.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

    if (sessionError) {
      return { success: false, error: 'Error al crear sesión' }
    }

    return {
      success: true,
      user: {
        id: newUser.id,
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

// Autenticar estudiante
export async function authenticateStudent(studentCode: string, password: string): Promise<AuthResult> {
  try {
    const hashedPassword = hashPassword(password)
    
    // Buscar estudiante por código
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, first_name, last_name, email, password_hash')
      .eq('student_code', studentCode)
      .single()

    if (studentError || !student) {
      return { success: false, error: 'Código de estudiante no válido' }
    }

    // Verificar contraseña
    if (student.password_hash !== hashedPassword) {
      return { success: false, error: 'Contraseña incorrecta' }
    }

    // Buscar o crear usuario del sistema
    let { data: systemUser, error: userError } = await supabase
      .from('system_users')
      .select('id, email, user_type, student_id')
      .eq('student_id', student.id)
      .single()

    if (userError || !systemUser) {
      // Crear usuario del sistema si no existe
      const { data: newUser, error: createError } = await supabase
        .rpc('create_student_user', {
          student_code: studentCode,
          student_password: hashedPassword
        })
        .single()

      if (createError || !newUser) {
        return { success: false, error: 'Error al crear usuario' }
      }

      systemUser = { id: newUser, email: student.email, user_type: 'student', student_id: student.id }
    }

    // Crear sesión
    const sessionToken = generateSessionToken()
    const { error: sessionError } = await supabase
      .rpc('create_user_session', {
        user_uuid: systemUser.id,
        session_token: sessionToken,
        expires_in_hours: 24
      })

    if (sessionError) {
      return { success: false, error: 'Error al crear sesión' }
    }

    return {
      success: true,
      user: {
        id: systemUser.id,
        email: systemUser.email,
        userType: 'student',
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`
      },
      token: sessionToken
    }
  } catch (error) {
    console.error('Error authenticating student:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Validar sesión
export async function validateSession(token: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase
      .rpc('validate_session', { token })
      .single()

    if (error || !data) {
      return { success: false, error: 'Sesión inválida o expirada' }
    }

    return {
      success: true,
      user: {
        id: data.user_id,
        email: data.email,
        userType: data.user_type as 'teacher' | 'student',
        studentId: data.student_id,
        studentName: data.student_name
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

// Registrar estudiante
export async function registerStudent(studentCode: string, password: string, confirmPassword: string): Promise<AuthResult> {
  if (password !== confirmPassword) {
    return { success: false, error: 'Las contraseñas no coinciden' }
  }

  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  try {
    const hashedPassword = hashPassword(password)
    
    const { data, error } = await supabase
      .rpc('create_student_user', {
        student_code: studentCode,
        student_password: hashedPassword
      })
      .single()

    if (error || !data) {
      return { success: false, error: 'Error al registrar usuario' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error registering student:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
