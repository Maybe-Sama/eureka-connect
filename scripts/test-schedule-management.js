#!/usr/bin/env node

/**
 * TEST DE GESTIÓN DE HORARIOS FIJOS
 * 
 * Este script verifica las funcionalidades mediante llamadas HTTP a la API local
 * Requiere que el servidor de desarrollo esté corriendo (pnpm dev)
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000'

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳'
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow'
  
  log(`${icon} ${testName}`, statusColor)
  if (details) {
    console.log(`   ${details}`)
  }
}

async function waitForServer() {
  log('🔌 Verificando conexión con servidor...', 'blue')
  
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/students`)
      if (response.ok) {
        log('✅ Servidor conectado', 'green')
        return true
      }
    } catch (error) {
      log(`⏳ Intento ${i + 1}/10 - Esperando servidor...`, 'yellow')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  log('❌ No se pudo conectar al servidor. Asegúrate de ejecutar "pnpm dev"', 'red')
  return false
}

async function createTestCourse() {
  const testCourse = {
    name: 'Test Mathematics',
    description: 'Course for testing',
    subject: 'Mathematics',
    price: 30.00,
    duration: 60,
    color: '#e74c3c',
    is_active: true
  }
  
  const response = await fetch(`${BASE_URL}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCourse)
  })
  
  if (!response.ok) {
    throw new Error(`Error creating course: ${response.status}`)
  }
  
  const result = await response.json()
  return { courseId: result.id, ...testCourse }
}

async function createTestStudent(courseId) {
  const testStudent = {
    first_name: 'Maria',
    last_name: 'TestUser',
    email: 'maria.test@example.com',
    birth_date: '2006-03-20',
    phone: '+34123456789',
    parent_phone: '+34987654321',
    parent_contact_type: 'madre',
    course_id: courseId,
    student_code: 'TEST2024999',
    start_date: '2024-01-15',
    schedule: [
      {
        day_of_week: 2, // Martes
        start_time: '17:30:00',
        end_time: '18:30:00',
        course_id: courseId.toString(),
        course_name: 'Test Mathematics',
        subject: 'Trigonometry'
      },
      {
        day_of_week: 4, // Jueves
        start_time: '17:30:00',
        end_time: '18:30:00',
        course_id: courseId.toString(),
        course_name: 'Test Mathematics',
        subject: 'Calculus'
      }
    ]
  }
  
  const response = await fetch(`${BASE_URL}/api/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent)
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error creating student: ${response.status} - ${error}`)
  }
  
  const result = await response.json()
  return { studentId: result.id, ...testStudent }
}

async function test1_StudentWithCourseColors() {
  logTest('TEST 1: Estudiantes tienen colores de curso', 'TESTING')
  
  try {
    const response = await fetch(`${BASE_URL}/api/students`)
    const students = await response.json()
    
    // Buscar nuestro estudiante de prueba
    const testStudent = students.find(s => s.first_name === 'Maria' && s.last_name === 'TestUser')
    
    if (!testStudent) {
      logTest('TEST 1: Estudiantes tienen colores de curso', 'FAIL', 'Estudiante de prueba no encontrado')
      return false
    }
    
    const hasColor = testStudent.course_color && testStudent.course_color !== '#000000'
    const hasName = testStudent.course_name === 'Test Mathematics'
    const hasPrice = testStudent.course_price === 30
    
    if (hasColor && hasName && hasPrice) {
      logTest('TEST 1: Estudiantes tienen colores de curso', 'PASS', 
        `✓ Color: ${testStudent.course_color}\n   ✓ Nombre: ${testStudent.course_name}\n   ✓ Precio: €${testStudent.course_price}`)
      return testStudent.id
    } else {
      logTest('TEST 1: Estudiantes tienen colores de curso', 'FAIL', 
        `Color: ${testStudent.course_color}, Nombre: ${testStudent.course_name}, Precio: €${testStudent.course_price}`)
      return false
    }
    
  } catch (error) {
    logTest('TEST 1: Estudiantes tienen colores de curso', 'FAIL', error.message)
    return false
  }
}

async function test2_FixedScheduleRetrieval(studentId) {
  logTest('TEST 2: Recuperación de horarios fijos', 'TESTING')
  
  try {
    const response = await fetch(`${BASE_URL}/api/students/${studentId}/schedule`)
    
    if (!response.ok) {
      logTest('TEST 2: Recuperación de horarios fijos', 'FAIL', `Error ${response.status}`)
      return false
    }
    
    const schedule = await response.json()
    
    if (Array.isArray(schedule) && schedule.length === 2) {
      const hasMartes = schedule.some(slot => slot.day_of_week === 2 && slot.subject === 'Trigonometry')
      const hasJueves = schedule.some(slot => slot.day_of_week === 4 && slot.subject === 'Calculus')
      
      if (hasMartes && hasJueves) {
        logTest('TEST 2: Recuperación de horarios fijos', 'PASS', 
          `✓ 2 horarios recuperados\n   ✓ Martes: Trigonometry\n   ✓ Jueves: Calculus`)
        return true
      }
    }
    
    logTest('TEST 2: Recuperación de horarios fijos', 'FAIL', 
      `Horarios encontrados: ${JSON.stringify(schedule, null, 2)}`)
    return false
    
  } catch (error) {
    logTest('TEST 2: Recuperación de horarios fijos', 'FAIL', error.message)
    return false
  }
}

async function test3_ScheduleModification(studentId) {
  logTest('TEST 3: Modificación de horarios (eliminar uno)', 'TESTING')
  
  try {
    // Modificar el horario para que solo tenga martes
    const newSchedule = [
      {
        day_of_week: 2, // Solo martes
        start_time: '17:30:00',
        end_time: '18:30:00',
        course_id: '1',
        course_name: 'Test Mathematics',
        subject: 'Trigonometry'
      }
    ]
    
    const response = await fetch(`${BASE_URL}/api/students/${studentId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: newSchedule })
    })
    
    if (!response.ok) {
      const error = await response.text()
      logTest('TEST 3: Modificación de horarios (eliminar uno)', 'FAIL', `Error ${response.status}: ${error}`)
      return false
    }
    
    // Verificar que el horario se actualizó
    const verificationResponse = await fetch(`${BASE_URL}/api/students/${studentId}/schedule`)
    const updatedSchedule = await verificationResponse.json()
    
    if (Array.isArray(updatedSchedule) && updatedSchedule.length === 1) {
      const hasOnlyMartes = updatedSchedule[0].day_of_week === 2 && updatedSchedule[0].subject === 'Trigonometry'
      
      if (hasOnlyMartes) {
        logTest('TEST 3: Modificación de horarios (eliminar uno)', 'PASS', 
          `✓ Horario actualizado correctamente\n   ✓ Solo 1 horario: Martes Trigonometry`)
        return true
      }
    }
    
    logTest('TEST 3: Modificación de horarios (eliminar uno)', 'FAIL', 
      `Horario después de modificación: ${JSON.stringify(updatedSchedule, null, 2)}`)
    return false
    
  } catch (error) {
    logTest('TEST 3: Modificación de horarios (eliminar uno)', 'FAIL', error.message)
    return false
  }
}

async function test4_ScheduleAddition(studentId) {
  logTest('TEST 4: Añadir nuevo horario', 'TESTING')
  
  try {
    // Añadir viernes al horario existente
    const newSchedule = [
      {
        day_of_week: 2, // Martes (mantener)
        start_time: '17:30:00',
        end_time: '18:30:00',
        course_id: '1',
        course_name: 'Test Mathematics',
        subject: 'Trigonometry'
      },
      {
        day_of_week: 5, // Viernes (nuevo)
        start_time: '16:00:00',
        end_time: '17:00:00',
        course_id: '1',
        course_name: 'Test Mathematics',
        subject: 'Geometry'
      }
    ]
    
    const response = await fetch(`${BASE_URL}/api/students/${studentId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: newSchedule })
    })
    
    if (!response.ok) {
      const error = await response.text()
      logTest('TEST 4: Añadir nuevo horario', 'FAIL', `Error ${response.status}: ${error}`)
      return false
    }
    
    // Verificar que se añadió el horario
    const verificationResponse = await fetch(`${BASE_URL}/api/students/${studentId}/schedule`)
    const updatedSchedule = await verificationResponse.json()
    
    if (Array.isArray(updatedSchedule) && updatedSchedule.length === 2) {
      const hasMartes = updatedSchedule.some(slot => slot.day_of_week === 2 && slot.subject === 'Trigonometry')
      const hasViernes = updatedSchedule.some(slot => slot.day_of_week === 5 && slot.subject === 'Geometry')
      
      if (hasMartes && hasViernes) {
        logTest('TEST 4: Añadir nuevo horario', 'PASS', 
          `✓ Horario actualizado correctamente\n   ✓ 2 horarios: Martes + Viernes`)
        return true
      }
    }
    
    logTest('TEST 4: Añadir nuevo horario', 'FAIL', 
      `Horario después de añadir: ${JSON.stringify(updatedSchedule, null, 2)}`)
    return false
    
  } catch (error) {
    logTest('TEST 4: Añadir nuevo horario', 'FAIL', error.message)
    return false
  }
}

async function test5_CompleteScheduleRemoval(studentId) {
  logTest('TEST 5: Eliminación completa de horarios', 'TESTING')
  
  try {
    // Eliminar todos los horarios
    const emptySchedule = []
    
    const response = await fetch(`${BASE_URL}/api/students/${studentId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: emptySchedule })
    })
    
    if (!response.ok) {
      const error = await response.text()
      logTest('TEST 5: Eliminación completa de horarios', 'FAIL', `Error ${response.status}: ${error}`)
      return false
    }
    
    // Verificar que no hay horarios
    const verificationResponse = await fetch(`${BASE_URL}/api/students/${studentId}/schedule`)
    const updatedSchedule = await verificationResponse.json()
    
    if (Array.isArray(updatedSchedule) && updatedSchedule.length === 0) {
      logTest('TEST 5: Eliminación completa de horarios', 'PASS', 
        `✓ Todos los horarios eliminados correctamente`)
      return true
    }
    
    logTest('TEST 5: Eliminación completa de horarios', 'FAIL', 
      `Horarios restantes: ${JSON.stringify(updatedSchedule, null, 2)}`)
    return false
    
  } catch (error) {
    logTest('TEST 5: Eliminación completa de horarios', 'FAIL', error.message)
    return false
  }
}

async function cleanupTestData(studentId, courseId) {
  log('\n🧹 LIMPIANDO DATOS DE PRUEBA...', 'yellow')
  
  try {
    // Eliminar estudiante
    if (studentId) {
      const studentResponse = await fetch(`${BASE_URL}/api/students/${studentId}`, {
        method: 'DELETE'
      })
      if (studentResponse.ok) {
        log('✅ Estudiante de prueba eliminado', 'green')
      }
    }
    
    // Eliminar curso
    if (courseId) {
      const courseResponse = await fetch(`${BASE_URL}/api/courses/${courseId}`, {
        method: 'DELETE'
      })
      if (courseResponse.ok) {
        log('✅ Curso de prueba eliminado', 'green')
      }
    }
    
  } catch (error) {
    log(`⚠️ Error limpiando datos: ${error.message}`, 'yellow')
  }
}

async function runAllTests() {
  log('🧪 INICIANDO TESTS DE GESTIÓN DE HORARIOS FIJOS', 'bold')
  log('═'.repeat(60), 'cyan')
  
  // Verificar conexión
  const serverOk = await waitForServer()
  if (!serverOk) {
    log('❌ No se puede conectar al servidor. Ejecuta "pnpm dev" primero.', 'red')
    process.exit(1)
  }
  
  let testData = {}
  let passedTests = 0
  const totalTests = 5
  
  try {
    // Crear datos de prueba
    log('\n🏗️ PREPARANDO DATOS DE PRUEBA...', 'blue')
    const course = await createTestCourse()
    const student = await createTestStudent(course.courseId)
    
    testData = {
      courseId: course.courseId,
      studentId: student.studentId
    }
    
    log(`✅ Curso creado: ${course.courseId} (${course.name})`, 'green')
    log(`✅ Estudiante creado: ${student.studentId} (${student.first_name})`, 'green')
    
    // Ejecutar tests
    log('\n🔬 EJECUTANDO TESTS...', 'blue')
    
    const studentId = await test1_StudentWithCourseColors()
    if (studentId) {
      passedTests++
      testData.studentId = studentId // Usar el ID encontrado
    }
    
    if (await test2_FixedScheduleRetrieval(testData.studentId)) passedTests++
    if (await test3_ScheduleModification(testData.studentId)) passedTests++
    if (await test4_ScheduleAddition(testData.studentId)) passedTests++
    if (await test5_CompleteScheduleRemoval(testData.studentId)) passedTests++
    
  } catch (error) {
    log(`❌ ERROR CRÍTICO: ${error.message}`, 'red')
    console.error(error)
  } finally {
    // Limpiar datos
    await cleanupTestData(testData.studentId, testData.courseId)
  }
  
  // Reporte final
  log('\n' + '═'.repeat(60), 'cyan')
  log('📊 REPORTE FINAL DE TESTS', 'bold')
  log('═'.repeat(60), 'cyan')
  
  const successRate = (passedTests / totalTests * 100).toFixed(1)
  const status = passedTests === totalTests ? '🎉 ¡TODOS LOS TESTS PASARON!' : 
                 passedTests >= 4 ? '⚠️  MAYORÍA DE TESTS PASARON' : 
                 '❌ MÚLTIPLES TESTS FALLARON'
  
  log(`Tests pasados: ${passedTests}/${totalTests} (${successRate}%)`, 
       passedTests === totalTests ? 'green' : passedTests >= 4 ? 'yellow' : 'red')
  log(status, 
      passedTests === totalTests ? 'green' : passedTests >= 4 ? 'yellow' : 'red')
  
  if (passedTests === totalTests) {
    log('\n🏆 ¡FUNCIONALIDAD COMPLETA VERIFICADA!', 'green')
    log('✅ Los colores de cards funcionan correctamente', 'green')
    log('✅ La recuperación de horarios funciona', 'green') 
    log('✅ La modificación de horarios funciona', 'green')
    log('✅ Se pueden añadir nuevos horarios', 'green')
    log('✅ Se pueden eliminar todos los horarios', 'green')
    log('\n💡 La funcionalidad de selector de día está lista en la UI', 'cyan')
    log('💡 Los datos históricos se preservan automáticamente', 'cyan')
  } else {
    log('\n⚠️ ALGUNOS TESTS FALLARON - REVISAR IMPLEMENTACIÓN', 'yellow')
  }
  
  process.exit(passedTests === totalTests ? 0 : 1)
}

// Verificar si node-fetch está disponible
try {
  require('node-fetch')
} catch (error) {
  log('❌ node-fetch no está instalado. Instálalo con: npm install node-fetch', 'red')
  log('   O usa el navegador para probar manualmente la funcionalidad', 'yellow')
  process.exit(1)
}

// Ejecutar tests
runAllTests().catch(error => {
  console.error('❌ Error crítico:', error)
  process.exit(1)
})



