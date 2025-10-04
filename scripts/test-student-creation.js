const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStudentCreation() {
  console.log('🧪 Probando creación de estudiante...')
  
  const testStudent = {
    first_name: 'Test',
    last_name: 'Student',
    email: 'test@example.com',
    birth_date: '2000-01-01',
    phone: '123456789',
    parent_phone: '987654321',
    parent_contact_type: 'padre',
    course_id: 5, // Using existing course ID from the test
    student_code: 'TEST1234567890123456',
    fixed_schedule: null,
    start_date: '2024-01-01'
  }
  
  try {
    console.log('📝 Datos del estudiante de prueba:', testStudent)
    
    const { data, error } = await supabase
      .from('students')
      .insert(testStudent)
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ Error creando estudiante:', error)
      console.error('Detalles del error:', JSON.stringify(error, null, 2))
      return false
    }
    
    console.log('✅ Estudiante creado exitosamente con ID:', data.id)
    
    // Clean up - delete the test student
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', data.id)
    
    if (deleteError) {
      console.log('⚠️  No se pudo eliminar el estudiante de prueba:', deleteError)
    } else {
      console.log('🧹 Estudiante de prueba eliminado')
    }
    
    return true
  } catch (error) {
    console.error('❌ Excepción creando estudiante:', error)
    return false
  }
}

async function checkCourses() {
  console.log('🔍 Verificando que existan cursos...')
  
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name')
      .eq('is_active', true)
      .limit(5)
    
    if (error) {
      console.error('❌ Error obteniendo cursos:', error)
      return false
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No hay cursos activos en la base de datos')
      return false
    }
    
    console.log('✅ Cursos encontrados:', data.map(c => `${c.id}: ${c.name}`).join(', '))
    return true
  } catch (error) {
    console.error('❌ Excepción obteniendo cursos:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de creación de estudiante...\n')
  
  const coursesOk = await checkCourses()
  if (!coursesOk) {
    console.log('\n❌ No se pueden crear estudiantes sin cursos activos')
    return
  }
  
  console.log('')
  const studentOk = await testStudentCreation()
  
  if (studentOk) {
    console.log('\n🎉 ¡Las pruebas pasaron! El problema puede estar en el frontend.')
  } else {
    console.log('\n⚠️  Las pruebas fallaron. Revisa los errores arriba.')
  }
}

main().catch(console.error)
