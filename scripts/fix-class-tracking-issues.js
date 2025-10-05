/**
 * SOURCE OF TRUTH: Class Tracking Correction Script
 * 
 * This is the PRIMARY script for correcting class tracking issues.
 * All other correction scripts should use this pattern.
 * 
 * Features:
 * - Uses official generateClassesFromStartDate function
 * - Proper database integration
 * - Comprehensive validation
 * - Error handling
 * - Detailed logging
 * 
 * Used by:
 * - Manual maintenance
 * - Automated correction
 * - System recovery
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

async function fixClassTrackingIssues() {
  try {
    // Cargar módulos primero
    await loadModules()
    
    log('\n🔧 INICIANDO CORRECCIÓN DEL SISTEMA DE SEGUIMIENTO DE CLASES', 'cyan')
    log('=' .repeat(80), 'cyan')
    
    const students = await dbOperations.getAllStudents()
    log(`\n📊 Total de alumnos a procesar: ${students.length}`, 'blue')
    
    const results = {
      fixed: [],
      skipped: [],
      errors: []
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    for (const student of students) {
      const studentName = `${student.first_name} ${student.last_name}`
      
      log(`\n${'─'.repeat(80)}`, 'white')
      log(`🎓 Procesando: ${studentName} (ID: ${student.id})`, 'cyan')
      
      // Validar que tenga los datos necesarios
      if (!student.start_date) {
        log('  ⏭️  OMITIDO: No tiene start_date', 'yellow')
        results.skipped.push({
          id: student.id,
          name: studentName,
          reason: 'Sin start_date'
        })
        continue
      }
      
      if (!student.fixed_schedule) {
        log('  ⏭️  OMITIDO: No tiene fixed_schedule', 'yellow')
        results.skipped.push({
          id: student.id,
          name: studentName,
          reason: 'Sin fixed_schedule'
        })
        continue
      }
      
      // Validar que start_date no sea futura
      if (student.start_date > today) {
        log('  ⏭️  OMITIDO: La fecha de inicio es futura', 'yellow')
        results.skipped.push({
          id: student.id,
          name: studentName,
          reason: 'Fecha de inicio futura'
        })
        continue
      }
      
      // Parsear fixed_schedule
      let parsedSchedule = null
      try {
        parsedSchedule = typeof student.fixed_schedule === 'string' 
          ? JSON.parse(student.fixed_schedule) 
          : student.fixed_schedule
        
        if (!Array.isArray(parsedSchedule) || parsedSchedule.length === 0) {
          log('  ⏭️  OMITIDO: Horario fijo vacío o inválido', 'yellow')
          results.skipped.push({
            id: student.id,
            name: studentName,
            reason: 'Horario fijo vacío o inválido'
          })
          continue
        }
      } catch (error) {
        log(`  ❌ ERROR: No se pudo parsear fixed_schedule - ${error.message}`, 'red')
        results.errors.push({
          id: student.id,
          name: studentName,
          error: `Error parseando horario: ${error.message}`
        })
        continue
      }
      
      try {
        // Obtener clases existentes
        const existingClasses = await dbOperations.getClassesByStudentId(student.id)
        log(`  📚 Clases existentes: ${existingClasses.length}`, 'blue')
        
        // Generar todas las clases que deberían existir
        const generatedClasses = await generateClassesFromStartDate(
          student.id,
          student.course_id,
          parsedSchedule,
          student.start_date,
          today
        )
        
        log(`  🔄 Clases que deberían existir: ${generatedClasses.length}`, 'blue')
        
        // Crear un Set de clases existentes para comparación rápida
        const existingClassKeys = new Set(
          existingClasses.map(cls => `${cls.date}-${cls.start_time}-${cls.end_time}`)
        )
        
        // Filtrar solo las clases nuevas (que no existen)
        const newClasses = generatedClasses.filter(genClass => 
          !existingClassKeys.has(`${genClass.date}-${genClass.start_time}-${genClass.end_time}`)
        )
        
        if (newClasses.length === 0) {
          log(`  ✅ PERFECTO: No hay clases faltantes`, 'green')
          results.fixed.push({
            id: student.id,
            name: studentName,
            classesCreated: 0,
            message: 'Ya estaba correcto'
          })
          continue
        }
        
        log(`  ➕ Creando ${newClasses.length} clases faltantes...`, 'yellow')
        
        // Insertar las clases nuevas
        let createdCount = 0
        for (const classData of newClasses) {
          try {
            await dbOperations.createClass(classData)
            createdCount++
          } catch (error) {
            log(`    ⚠️  Error al crear clase del ${classData.date}: ${error.message}`, 'yellow')
          }
        }
        
        log(`  ✅ CORREGIDO: ${createdCount} clases creadas`, 'green')
        
        results.fixed.push({
          id: student.id,
          name: studentName,
          classesCreated: createdCount,
          message: `${createdCount} clases creadas`
        })
        
      } catch (error) {
        log(`  ❌ ERROR: ${error.message}`, 'red')
        results.errors.push({
          id: student.id,
          name: studentName,
          error: error.message
        })
      }
    }
    
    // RESUMEN FINAL
    log('\n' + '='.repeat(80), 'cyan')
    log('📊 RESUMEN DE LA CORRECCIÓN', 'cyan')
    log('='.repeat(80), 'cyan')
    
    const totalFixed = results.fixed.filter(r => r.classesCreated > 0).length
    const totalClassesCreated = results.fixed.reduce((sum, r) => sum + r.classesCreated, 0)
    
    log(`\n✅ Alumnos corregidos: ${totalFixed}`, 'green')
    log(`✅ Total de clases creadas: ${totalClassesCreated}`, 'green')
    
    if (results.fixed.length > 0) {
      log('\nDetalle de correcciones:', 'white')
      results.fixed.forEach(r => {
        if (r.classesCreated > 0) {
          log(`  • ${r.name}: ${r.classesCreated} clases creadas`, 'white')
        }
      })
    }
    
    log(`\n⏭️  Alumnos omitidos: ${results.skipped.length}`, 'yellow')
    if (results.skipped.length > 0) {
      log('\nMotivos:', 'white')
      results.skipped.forEach(r => {
        log(`  • ${r.name}: ${r.reason}`, 'white')
      })
    }
    
    log(`\n❌ Errores: ${results.errors.length}`, 'red')
    if (results.errors.length > 0) {
      log('\nDetalles:', 'white')
      results.errors.forEach(r => {
        log(`  • ${r.name}: ${r.error}`, 'white')
      })
    }
    
    log('\n✅ Corrección completada', 'green')
    log('\n💡 Próximos pasos:', 'cyan')
    log('  1. Verificar en el frontend: http://localhost:3000/class-tracking', 'white')
    log('  2. Hacer clic en "Ver Clases" de cada alumno para verificar', 'white')
    log('  3. Si hay problemas, revisar los logs arriba\n', 'white')
    
    return results
    
  } catch (error) {
    log(`\n❌ ERROR FATAL: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Ejecutar corrección
fixClassTrackingIssues()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

