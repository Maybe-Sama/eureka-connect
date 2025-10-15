/**
 * SERVER-ONLY MODULE
 * 
 * WARNING: This module should NEVER be imported in client-side code!
 * Use /lib/auth-client.ts for client-side authentication instead.
 * 
 * Use ONLY in:
 * - API routes (app/api/route.ts files)
 * - Server Components
 * - Server Actions
 */

// Detect if running in browser
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY ERROR: auth-complex.ts is being imported in client-side code! ' +
    'Use /lib/auth-client.ts instead, which calls API routes.'
  )
}

import { supabaseAdmin } from './supabase-server'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

export interface User {
  id: string
  email: string
  userType: 'teacher' | 'student'
  studentId?: number
  studentName?: string
  courseName?: string
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

// Crear hash de contraseña con bcrypt (seguro para producción)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // Balance entre seguridad y rendimiento
  return await bcrypt.hash(password, saltRounds)
}

// Verificar contraseña con soporte para hashes antiguos (SHA-256) y nuevos (bcrypt)
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Si el hash tiene 64 caracteres, es SHA-256 (legacy)
  if (hash.length === 64 && /^[a-f0-9]+$/.test(hash)) {
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
    return sha256Hash === hash
  }
  
  // Si no, es bcrypt (nuevo sistema)
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

// Helper: Normalizar código de estudiante (quitar guiones, espacios, etc.)
function normalizeStudentCode(code: string): string {
  return code.replace(/[-\s]/g, '').trim().toUpperCase()
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

    // Primero buscar si el usuario ya existe
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('system_users')
      .select('id, password_hash')
      .eq('email', email)
      .eq('user_type', 'teacher')
      .single()

    let userId: string

    if (userError || !existingUser) {
      // Si no existe, crear el usuario con bcrypt
      const hashedPassword = await hashPassword(password)
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('system_users')
        .insert({
          email: email,
          password_hash: hashedPassword,
          user_type: 'teacher'
        })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('Error creating teacher user:', createError)
        return { success: false, error: 'Error al crear usuario profesor' }
      }

      userId = newUser.id
    } else {
      // Usuario existe - verificar si necesita migración de hash
      const needsMigration = existingUser.password_hash.length === 64
      
      if (needsMigration) {
        // Migrar hash de SHA-256 a bcrypt
        const newHash = await hashPassword(password)
        await supabaseAdmin
          .from('system_users')
          .update({ password_hash: newHash })
          .eq('id', existingUser.id)
      }
      
      userId = existingUser.id
    }

    // Crear sesión
    const sessionToken = generateSessionToken()
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: userId,
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

// Autenticar estudiante (por código o email)
export async function authenticateStudent(identifier: string, password: string): Promise<AuthResult> {
  try {
    const normalizedIdentifier = identifier.trim().toLowerCase()
    
    let systemUser: any
    let student: any
    
    // Determinar si es email o código de estudiante
    if (normalizedIdentifier.includes('@')) {
      // Es un email - buscar directamente en system_users
      const { data: userData, error: userError } = await supabaseAdmin
        .from('system_users')
        .select('id, email, password_hash, user_type, student_id')
        .eq('email', normalizedIdentifier)
        .eq('user_type', 'student')
        .maybeSingle()

      if (userError) {
        return { success: false, error: 'Error de base de datos.' }
      }

      if (!userData) {
        return { success: false, error: 'Código de estudiante o email no encontrado.' }
      }

      systemUser = userData

      // Obtener datos del estudiante
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          id, 
          first_name, 
          last_name,
          course_id,
          courses!inner(name)
        `)
        .eq('id', systemUser.student_id)
        .maybeSingle()

      if (studentError || !studentData) {
        return { success: false, error: 'Datos del estudiante no encontrados.' }
      }

      student = studentData
    } else {
      // Es un código de estudiante - usar lógica existente
      const normalizedCode = normalizeStudentCode(identifier)
      
      // Buscar estudiante por código con información del curso
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          id, 
          first_name, 
          last_name,
          course_id,
          courses!inner(name)
        `)
        .eq('student_code', normalizedCode)
        .maybeSingle()

      if (studentError || !studentData) {
        return { success: false, error: 'Código de estudiante o email no encontrado.' }
      }

      student = studentData

      // Buscar usuario del sistema asociado
      const { data: userData, error: userError } = await supabaseAdmin
        .from('system_users')
        .select('id, email, password_hash, user_type, student_id')
        .eq('student_id', student.id)
        .eq('user_type', 'student')
        .maybeSingle()

      if (userError || !userData) {
        return { success: false, error: 'Usuario no registrado. Por favor completa tu registro.' }
      }

      systemUser = userData
    }

    // Verificar contraseña usando la nueva función con soporte para SHA-256 y bcrypt
    const isPasswordValid = await verifyPassword(password, systemUser.password_hash)
    if (!isPasswordValid) {
      return { success: false, error: 'Contraseña incorrecta.' }
    }
    
    // Si el hash es SHA-256 (legacy), migrarlo a bcrypt
    if (systemUser.password_hash.length === 64) {
      const newHash = await hashPassword(password)
      await supabaseAdmin
        .from('system_users')
        .update({ password_hash: newHash })
        .eq('id', systemUser.id)
    }

    // Crear sesión
    const sessionToken = generateSessionToken()
    const { error: sessionError } = await supabaseAdmin
      .rpc('create_user_session', {
        user_uuid: systemUser.id,
        session_token: sessionToken,
        expires_in_hours: 24
      })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return { success: false, error: 'Error al crear sesión' }
    }

    return {
      success: true,
      user: {
        id: systemUser.id,
        email: systemUser.email,
        userType: 'student',
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        courseName: student.courses?.name
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
    // Buscar sesión activa
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('session_token', token)
      .single()

    if (sessionError || !session) {
      return { success: false, error: 'Sesión no encontrada' }
    }

    // Verificar si la sesión ha expirado
    if (new Date(session.expires_at) < new Date()) {
      // Eliminar sesión expirada
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('session_token', token)
      
      return { success: false, error: 'Sesión expirada' }
    }

    // Obtener datos del usuario
    const { data: user, error: userError } = await supabaseAdmin
      .from('system_users')
      .select('id, email, user_type, student_id')
      .eq('id', session.user_id)
      .single()

    if (userError || !user) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Si es estudiante, obtener nombre del estudiante y curso
    let studentName: string | undefined
    let courseName: string | undefined
    if (user.user_type === 'student' && user.student_id) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select(`
          first_name, 
          last_name,
          courses!inner(name)
        `)
        .eq('id', user.student_id)
        .single()
      
      if (student) {
        studentName = `${student.first_name} ${student.last_name}`
        courseName = student.courses?.name
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type as 'teacher' | 'student',
        studentId: user.student_id,
        studentName,
        courseName
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
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('session_token', token)

    return !error
  } catch (error) {
    console.error('Error logging out:', error)
    return false
  }
}

// Verificar código de estudiante antes del registro
export interface CodeVerificationResult {
  success: boolean
  error?: string
  studentName?: string
}

export async function verifyStudentCode(studentCode: string): Promise<CodeVerificationResult> {
  try {
    // Verificar que el código no esté vacío
    if (!studentCode || studentCode.trim().length === 0) {
      return { success: false, error: 'El código de estudiante es requerido' }
    }

    const normalizedCode = normalizeStudentCode(studentCode)

    // Buscar estudiante por código
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('student_code', normalizedCode)
      .maybeSingle()

    if (studentError) {
      console.error('Error querying student:', studentError)
      return { success: false, error: 'Error al verificar el código' }
    }

    if (!student) {
      return { success: false, error: 'Código inválido' }
    }

    // Verificar si el código ya está registrado en system_users
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('system_users')
      .select('id')
      .eq('student_id', student.id)
      .eq('user_type', 'student')
      .maybeSingle()

    if (userError) {
      console.error('Error checking existing user:', userError)
      return { success: false, error: 'Error al verificar el registro' }
    }

    // Si hay un usuario existente, significa que ya está registrado
    if (existingUser) {
      return { success: false, error: 'Este código ya ha sido registrado' }
    }

    // Código válido y disponible
    return {
      success: true,
      studentName: `${student.first_name} ${student.last_name}`
    }
  } catch (error) {
    console.error('Error verifying student code:', error)
    return { success: false, error: 'Error interno del servidor' }
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
    const hashedPassword = await hashPassword(password)
    const normalizedCode = normalizeStudentCode(studentCode)
    
    const { data, error } = await supabaseAdmin
      .rpc('create_student_user', {
        student_code: normalizedCode,
        student_password: hashedPassword
      })
      .single()

    if (error) {
      // Proporcionar mensajes de error más específicos
      if (error.message?.includes('not found') || error.code === 'PGRST202') {
        return { success: false, error: 'Código de estudiante no encontrado o ya registrado' }
      }
      return { success: false, error: error.message || 'Error al registrar usuario' }
    }

    if (!data) {
      return { success: false, error: 'No se pudo completar el registro' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error registering student:', error)
    return { success: false, error: error.message || 'Error interno del servidor' }
  }
}
