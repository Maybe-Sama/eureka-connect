const fetch = require('node-fetch')

async function testStudentCreationAPI() {
  console.log('🧪 Probando endpoint de creación de estudiante...')
  
  const testStudent = {
    first_name: 'Test',
    last_name: 'Student',
    email: 'test-api@example.com',
    birth_date: '2000-01-01',
    phone: '123456789',
    parent_phone: '987654321',
    parent_contact_type: 'padre',
    course_id: 5, // Using existing course ID
    student_code: 'TESTAPI1234567890123',
    fixed_schedule: null,
    start_date: '2024-01-01',
    schedule: []
  }
  
  try {
    console.log('📝 Enviando datos:', testStudent)
    
    const response = await fetch('http://localhost:3000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testStudent)
    })
    
    console.log('📊 Respuesta del servidor:')
    console.log('  Status:', response.status)
    console.log('  Status Text:', response.statusText)
    
    const responseData = await response.text()
    console.log('  Body:', responseData)
    
    if (response.ok) {
      console.log('✅ Estudiante creado exitosamente via API')
      
      // Parse the response to get the student ID for cleanup
      try {
        const data = JSON.parse(responseData)
        if (data.id) {
          console.log('🧹 Limpiando estudiante de prueba...')
          const deleteResponse = await fetch(`http://localhost:3000/api/students/${data.id}`, {
            method: 'DELETE'
          })
          
          if (deleteResponse.ok) {
            console.log('✅ Estudiante de prueba eliminado')
          } else {
            console.log('⚠️  No se pudo eliminar el estudiante de prueba')
          }
        }
      } catch (parseError) {
        console.log('⚠️  No se pudo parsear la respuesta para limpieza')
      }
    } else {
      console.log('❌ Error creando estudiante via API')
    }
    
  } catch (error) {
    console.error('❌ Excepción en la prueba:', error)
  }
}

async function main() {
  console.log('🚀 Iniciando prueba del endpoint API...\n')
  
  // Wait a bit for the server to be ready
  console.log('⏳ Esperando que el servidor esté listo...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  await testStudentCreationAPI()
}

main().catch(console.error)
