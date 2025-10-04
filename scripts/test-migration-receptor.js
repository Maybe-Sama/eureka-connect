/**
 * Script para probar la migración de campos del receptor
 */

const BASE_URL = 'http://localhost:3000'

async function testReceptorFieldsMigration() {
  try {
    console.log('=== TEST: Migración de campos del receptor ===\n')
    
    // Crear un estudiante de prueba con datos del receptor
    const testStudent = {
      first_name: 'Test',
      last_name: 'Receptor',
      email: 'test.receptor@example.com',
      birth_date: '2000-01-01',
      phone: '+34123456789',
      parent_phone: '+34987654321',
      parent_contact_type: 'madre',
      course_id: 1,
      student_code: 'TEST-RECEPTOR-001',
      start_date: '2024-01-01',
      // Datos fiscales
      dni: '12345678A',
      nif: '12345678A',
      address: 'Calle Test 123',
      postal_code: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'España',
      // Datos del receptor
      receptor_nombre: 'María',
      receptor_apellidos: 'García López',
      receptor_email: 'maria.garcia@example.com',
      schedule: []
    }
    
    console.log('📝 Creando estudiante de prueba con datos del receptor...')
    console.log('Datos del receptor:', {
      receptor_nombre: testStudent.receptor_nombre,
      receptor_apellidos: testStudent.receptor_apellidos,
      receptor_email: testStudent.receptor_email
    })
    
    const response = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStudent)
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error creando estudiante:', response.status, error)
      return
    }
    
    const result = await response.json()
    console.log('✅ Estudiante creado con ID:', result.id)
    
    // Verificar que se guardaron los datos del receptor
    console.log('\n🔍 Verificando datos del receptor...')
    const getResponse = await fetch(`${BASE_URL}/api/students/${result.id}`)
    
    if (!getResponse.ok) {
      console.error('❌ Error obteniendo estudiante:', getResponse.status)
      return
    }
    
    const student = await getResponse.json()
    console.log('📋 Datos del receptor guardados:')
    console.log('  - receptor_nombre:', student.receptor_nombre)
    console.log('  - receptor_apellidos:', student.receptor_apellidos)
    console.log('  - receptor_email:', student.receptor_email)
    
    if (student.receptor_nombre && student.receptor_apellidos && student.receptor_email) {
      console.log('✅ ¡Los datos del receptor se guardaron correctamente!')
    } else {
      console.log('❌ Los datos del receptor NO se guardaron correctamente')
    }
    
    // Limpiar - eliminar el estudiante de prueba
    console.log('\n🧹 Limpiando estudiante de prueba...')
    const deleteResponse = await fetch(`${BASE_URL}/api/students/${result.id}`, {
      method: 'DELETE'
    })
    
    if (deleteResponse.ok) {
      console.log('✅ Estudiante de prueba eliminado')
    } else {
      console.log('⚠️  No se pudo eliminar el estudiante de prueba')
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testReceptorFieldsMigration()
}

module.exports = { testReceptorFieldsMigration }




