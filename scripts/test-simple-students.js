/**
 * Script para probar la carga de estudiantes de forma simple
 */

const BASE_URL = 'http://localhost:3000'

async function testSimpleStudents() {
  try {
    console.log('🧪 Probando carga de estudiantes...')
    
    // Probar endpoint de estudiantes
    console.log('\n1. Probando GET /api/students...')
    const response = await fetch(`${BASE_URL}/api/students`)
    
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error en API:', errorText)
      return
    }
    
    const students = await response.json()
    console.log(`✅ Cargados ${students.length} estudiantes`)
    
    if (students.length > 0) {
      console.log('\n📋 Primer estudiante:')
      const firstStudent = students[0]
      console.log('  - ID:', firstStudent.id)
      console.log('  - Nombre:', firstStudent.first_name, firstStudent.last_name)
      console.log('  - Email:', firstStudent.email)
      console.log('  - Curso:', firstStudent.course_name)
      console.log('  - Receptor:', firstStudent.receptor_nombre || 'NO DEFINIDO')
    }
    
    // Probar endpoint de cursos
    console.log('\n2. Probando GET /api/courses...')
    const coursesResponse = await fetch(`${BASE_URL}/api/courses`)
    
    if (coursesResponse.ok) {
      const courses = await coursesResponse.json()
      console.log(`✅ Cargados ${courses.length} cursos`)
    } else {
      console.error('❌ Error cargando cursos:', coursesResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testSimpleStudents()
}

module.exports = { testSimpleStudents }




