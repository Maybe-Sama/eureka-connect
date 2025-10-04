const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabase() {
  console.log('🔍 Verificando conexión con Supabase...')
  
  try {
    // 1. Verificar conexión básica
    console.log('\n1. Verificando conexión...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('courses')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError.message)
      return
    }
    console.log('✅ Conexión exitosa')
    
    // 2. Verificar estructura de la tabla courses
    console.log('\n2. Verificando estructura de la tabla courses...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)
    
    if (coursesError) {
      console.error('❌ Error al consultar courses:', coursesError.message)
      return
    }
    console.log('✅ Tabla courses accesible')
    
    // 3. Verificar estructura de la tabla students
    console.log('\n3. Verificando estructura de la tabla students...')
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1)
    
    if (studentsError) {
      console.error('❌ Error al consultar students:', studentsError.message)
      return
    }
    console.log('✅ Tabla students accesible')
    
    // 4. Verificar estructura de la tabla classes
    console.log('\n4. Verificando estructura de la tabla classes...')
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .limit(1)
    
    if (classesError) {
      console.error('❌ Error al consultar classes:', classesError.message)
      return
    }
    console.log('✅ Tabla classes accesible')
    
    // 5. Verificar estructura de la tabla invoices
    console.log('\n5. Verificando estructura de la tabla invoices...')
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1)
    
    if (invoicesError) {
      console.error('❌ Error al consultar invoices:', invoicesError.message)
      return
    }
    console.log('✅ Tabla invoices accesible')
    
    // 6. Probar crear un curso de prueba
    console.log('\n6. Probando creación de curso...')
    const testCourse = {
      name: 'Curso de Prueba',
      description: 'Curso para verificar la funcionalidad',
      subject: 'Matemáticas',
      price: 25.50,
      duration: 60,
      color: '#6366f1',
      is_active: true
    }
    
    const { data: newCourse, error: createError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error al crear curso:', createError.message)
      return
    }
    console.log('✅ Curso creado exitosamente:', newCourse.name)
    
    // 7. Probar crear un estudiante de prueba
    console.log('\n7. Probando creación de estudiante...')
    const testStudent = {
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan.perez@test.com',
      birth_date: '2010-05-15',
      phone: '123456789',
      course_id: newCourse.id,
      student_code: '12345678901234567890',
      fixed_schedule: 'Lunes y Miércoles de 16:00 a 17:00'
    }
    
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert(testStudent)
      .select()
      .single()
    
    if (studentError) {
      console.error('❌ Error al crear estudiante:', studentError.message)
      return
    }
    console.log('✅ Estudiante creado exitosamente:', `${newStudent.first_name} ${newStudent.last_name}`)
    
    // 8. Limpiar datos de prueba
    console.log('\n8. Limpiando datos de prueba...')
    await supabase.from('students').delete().eq('id', newStudent.id)
    await supabase.from('courses').delete().eq('id', newCourse.id)
    console.log('✅ Datos de prueba eliminados')
    
    console.log('\n🎉 ¡Verificación completada exitosamente!')
    console.log('✅ Todas las tablas están funcionando correctamente')
    console.log('✅ La aplicación está lista para usar')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

verifyDatabase()
