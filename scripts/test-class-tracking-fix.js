/**
 * Script de Prueba Rápida del Sistema de Seguimiento de Clases
 * Verifica que todas las correcciones funcionen correctamente
 */

// Importar usando dynamic import para módulos ES6
let dbOperations, generateClassesFromStartDate

async function loadModules() {
  try {
    const databaseModule = await import('../lib/database.js')
    const classGenerationModule = await import('../lib/class-generation.js')
    
    dbOperations = databaseModule.dbOperations
    generateClassesFromStartDate = classGenerationModule.generateClassesFromStartDate
  } catch (error) {
    console.error('Error loading modules:', error)
    process.exit(1)
  }
}

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testClassTrackingFix() {
  try {
    // Cargar módulos primero
    await loadModules()
    
    log('\n🧪 INICIANDO PRUEBAS DEL SISTEMA CORREGIDO', 'cyan')
    log('=' .repeat(80), 'cyan')
    
    const tests = {
      passed: 0,
      failed: 0,
      total: 0
    }
    
    // Test 1: Validación de entrada inválida
    log('\n📝 Test 1: Validación de entrada inválida', 'blue')
    tests.total++
    try {
      const result = await generateClassesFromStartDate(null, null, [], '', '')
      if (result.length === 0) {
        log('  ✅ PASÓ: Rechaza entradas inválidas correctamente', 'green')
        tests.passed++
      } else {
        log('  ❌ FALLÓ: Debería rechazar entradas inválidas', 'red')
        tests.failed++
      }
    } catch (error) {
      log('  ❌ FALLÓ: ' + error.message, 'red')
      tests.failed++
    }
    
    // Test 2: Validación de fixed_schedule vacío
    log('\n📝 Test 2: Validación de horario vacío', 'blue')
    tests.total++
    try {
      const result = await generateClassesFromStartDate(1, 1, [], '2024-01-01', '2024-01-31')
      if (result.length === 0) {
        log('  ✅ PASÓ: Rechaza horarios vacíos correctamente', 'green')
        tests.passed++
      } else {
        log('  ❌ FALLÓ: Debería rechazar horarios vacíos', 'red')
        tests.failed++
      }
    } catch (error) {
      log('  ❌ FALLÓ: ' + error.message, 'red')
      tests.failed++
    }
    
    // Test 3: Validación de day_of_week inválido
    log('\n📝 Test 3: Validación de day_of_week inválido', 'blue')
    tests.total++
    try {
      const invalidSchedule = [
        { day_of_week: 10, start_time: '10:00', end_time: '11:00' }
      ]
      const result = await generateClassesFromStartDate(1, 1, invalidSchedule, '2024-01-01', '2024-01-31')
      if (result.length === 0) {
        log('  ✅ PASÓ: Rechaza day_of_week inválido correctamente', 'green')
        tests.passed++
      } else {
        log('  ❌ FALLÓ: Debería rechazar day_of_week inválido', 'red')
        tests.failed++
      }
    } catch (error) {
      log('  ❌ FALLÓ: ' + error.message, 'red')
      tests.failed++
    }
    
    // Test 4: Validación de fechas inválidas
    log('\n📝 Test 4: Validación de rango de fechas inválido', 'blue')
    tests.total++
    try {
      const validSchedule = [
        { day_of_week: 1, start_time: '10:00', end_time: '11:00' }
      ]
      const result = await generateClassesFromStartDate(1, 1, validSchedule, '2024-12-31', '2024-01-01')
      if (result.length === 0) {
        log('  ✅ PASÓ: Rechaza rangos de fecha inválidos correctamente', 'green')
        tests.passed++
      } else {
        log('  ❌ FALLÓ: Debería rechazar rangos inválidos', 'red')
        tests.failed++
      }
    } catch (error) {
      log('  ❌ FALLÓ: ' + error.message, 'red')
      tests.failed++
    }
    
    // Test 5: Obtener alumnos de la base de datos
    log('\n📝 Test 5: Conectividad con base de datos', 'blue')
    tests.total++
    try {
      const students = await dbOperations.getAllStudents()
      if (students && Array.isArray(students)) {
        log(`  ✅ PASÓ: Obtenidos ${students.length} alumnos de la base de datos`, 'green')
        tests.passed++
      } else {
        log('  ❌ FALLÓ: No se pudieron obtener alumnos', 'red')
        tests.failed++
      }
    } catch (error) {
      log('  ❌ FALLÓ: ' + error.message, 'red')
      tests.failed++
    }
    
    // Test 6: Verificar alumnos con datos válidos
    log('\n📝 Test 6: Verificar alumnos con datos válidos', 'blue')
    tests.total++
    try {
      const students = await dbOperations.getAllStudents()
      const validStudents = students.filter(s => s.start_date && s.fixed_schedule)
      
      if (validStudents.length > 0) {
        log(`  ✅ PASÓ: Encontrados ${validStudents.length} alumnos con datos válidos`, 'green')
        
        // Mostrar un ejemplo
        const example = validStudents[0]
        log(`     Ejemplo: ${example.first_name} ${example.last_name}`, 'white')
        log(`     - start_date: ${example.start_date}`, 'white')
        
        try {
          const schedule = JSON.parse(example.fixed_schedule)
          log(`     - fixed_schedule: ${schedule.length} slots`, 'white')
        } catch (e) {
          log(`     - fixed_schedule: Error parseando`, 'yellow')
        }
        
        tests.passed++
      } else {
        log('  ⚠️  ADVERTENCIA: No hay alumnos con datos válidos', 'yellow')
        tests.passed++
      }
    } catch (error) {
      log('  ❌ FALLÓ: ' + error.message, 'red')
      tests.failed++
    }
    
    // Test 7: Verificar que los cursos tienen precio
    log('\n📝 Test 7: Verificar precios de cursos', 'blue')
    tests.total++
    try {
      const courses = await dbOperations.getAllCourses()
      const coursesWithPrice = courses.filter(c => c.price && c.price > 0)
      
      if (coursesWithPrice.length > 0) {
        log(`  ✅ PASÓ: ${coursesWithPrice.length} cursos con precio válido`, 'green')
        tests.passed++
      } else {
        log('  ❌ FALLÓ: No hay cursos con precio válido', 'red')
        tests.failed++
      }
    } catch (error) {
      log('  ❌ FALLÓ: ' + error.message, 'red')
      tests.failed++
    }
    
    // Resumen
    log('\n' + '='.repeat(80), 'cyan')
    log('📊 RESUMEN DE PRUEBAS', 'cyan')
    log('='.repeat(80), 'cyan')
    
    log(`\n✅ Pruebas pasadas: ${tests.passed}/${tests.total}`, 'green')
    log(`❌ Pruebas falladas: ${tests.failed}/${tests.total}`, tests.failed > 0 ? 'red' : 'white')
    
    const percentage = Math.round((tests.passed / tests.total) * 100)
    log(`\n📈 Porcentaje de éxito: ${percentage}%`, percentage === 100 ? 'green' : 'yellow')
    
    if (tests.failed === 0) {
      log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!', 'green')
      log('El sistema está funcionando correctamente.\n', 'green')
    } else {
      log('\n⚠️  Algunas pruebas fallaron. Revisar logs arriba.\n', 'yellow')
    }
    
    return tests.failed === 0
    
  } catch (error) {
    log(`\n❌ ERROR FATAL: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Ejecutar pruebas
testClassTrackingFix()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

