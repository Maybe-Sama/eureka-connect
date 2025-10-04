/**
 * Script de Diagnóstico Completo del Sistema de Seguimiento de Clases
 * Identifica problemas en start_date, fixed_schedule y generación de clases
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

async function diagnoseClassTracking() {
  try {
    // Cargar módulos primero
    await loadModules()
    
    log('\n🔍 INICIANDO DIAGNÓSTICO DEL SISTEMA DE SEGUIMIENTO DE CLASES', 'cyan')
    log('=' .repeat(80), 'cyan')
    
    const students = await dbOperations.getAllStudents()
    log(`\n📊 Total de alumnos en el sistema: ${students.length}`, 'blue')
    
    const issues = {
      missingStartDate: [],
      missingFixedSchedule: [],
      invalidFixedSchedule: [],
      emptyFixedSchedule: [],
      futureStartDate: [],
      missingClasses: [],
      classCountMismatch: [],
      workingCorrectly: []
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    for (const student of students) {
      const studentName = `${student.first_name} ${student.last_name}`
      const studentInfo = {
        id: student.id,
        name: studentName,
        details: ''
      }
      
      log(`\n${'─'.repeat(80)}`, 'white')
      log(`🎓 Analizando: ${studentName} (ID: ${student.id})`, 'cyan')
      
      // 1. Verificar start_date
      if (!student.start_date) {
        log('  ❌ start_date: FALTA', 'red')
        studentInfo.details = 'Falta fecha de inicio'
        issues.missingStartDate.push(studentInfo)
        continue
      } else {
        log(`  ✅ start_date: ${student.start_date}`, 'green')
        
        // Verificar si la fecha de inicio es futura
        if (student.start_date > today) {
          log(`  ⚠️  ADVERTENCIA: La fecha de inicio es futura`, 'yellow')
          studentInfo.details = `Fecha de inicio futura: ${student.start_date}`
          issues.futureStartDate.push(studentInfo)
        }
      }
      
      // 2. Verificar fixed_schedule
      if (!student.fixed_schedule) {
        log('  ❌ fixed_schedule: FALTA', 'red')
        studentInfo.details = 'Falta horario fijo'
        issues.missingFixedSchedule.push(studentInfo)
        continue
      }
      
      let parsedSchedule = null
      try {
        parsedSchedule = typeof student.fixed_schedule === 'string' 
          ? JSON.parse(student.fixed_schedule) 
          : student.fixed_schedule
        
        if (!Array.isArray(parsedSchedule)) {
          log('  ❌ fixed_schedule: NO ES UN ARRAY', 'red')
          studentInfo.details = 'Horario fijo no es un array'
          issues.invalidFixedSchedule.push(studentInfo)
          continue
        }
        
        if (parsedSchedule.length === 0) {
          log('  ⚠️  fixed_schedule: VACÍO', 'yellow')
          studentInfo.details = 'Horario fijo vacío'
          issues.emptyFixedSchedule.push(studentInfo)
          continue
        }
        
        log(`  ✅ fixed_schedule: Válido (${parsedSchedule.length} slots)`, 'green')
        
        // Mostrar detalles del horario
        parsedSchedule.forEach((slot, index) => {
          const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
          const dayName = days[slot.day_of_week] || 'Desconocido'
          log(`     • Slot ${index + 1}: ${dayName} ${slot.start_time}-${slot.end_time}${slot.subject ? ` (${slot.subject})` : ''}`, 'white')
        })
        
      } catch (error) {
        log(`  ❌ Error al parsear fixed_schedule: ${error.message}`, 'red')
        studentInfo.details = `Error parseando horario: ${error.message}`
        issues.invalidFixedSchedule.push(studentInfo)
        continue
      }
      
      // 3. Contar clases existentes en la base de datos
      const existingClasses = await dbOperations.getClassesByStudentId(student.id)
      log(`  📚 Clases en base de datos: ${existingClasses.length}`, 'blue')
      
      // 4. Calcular cuántas clases DEBERÍAN existir
      try {
        const generatedClasses = await generateClassesFromStartDate(
          student.id,
          student.course_id,
          parsedSchedule,
          student.start_date,
          today
        )
        
        log(`  🔄 Clases que deberían existir: ${generatedClasses.length}`, 'blue')
        
        // Comparar
        const difference = generatedClasses.length - existingClasses.length
        
        if (difference > 0) {
          log(`  ⚠️  FALTANTES: ${difference} clases`, 'yellow')
          studentInfo.details = `Faltan ${difference} clases`
          studentInfo.expected = generatedClasses.length
          studentInfo.actual = existingClasses.length
          studentInfo.missing = difference
          issues.missingClasses.push(studentInfo)
        } else if (difference < 0) {
          log(`  ⚠️  EXCEDENTES: ${Math.abs(difference)} clases de más`, 'yellow')
          studentInfo.details = `${Math.abs(difference)} clases de más`
          studentInfo.expected = generatedClasses.length
          studentInfo.actual = existingClasses.length
          issues.classCountMismatch.push(studentInfo)
        } else {
          log(`  ✅ PERFECTO: Todas las clases están generadas`, 'green')
          studentInfo.details = 'Funcionando correctamente'
          studentInfo.classCount = existingClasses.length
          issues.workingCorrectly.push(studentInfo)
        }
        
        // 5. Verificar rango de fechas de las clases
        if (existingClasses.length > 0) {
          const classDates = existingClasses.map(c => c.date).sort()
          const firstClassDate = classDates[0]
          const lastClassDate = classDates[classDates.length - 1]
          
          log(`  📅 Primera clase: ${firstClassDate}`, 'white')
          log(`  📅 Última clase: ${lastClassDate}`, 'white')
          
          // Verificar si la primera clase coincide con start_date o después
          if (firstClassDate !== student.start_date && firstClassDate < student.start_date) {
            log(`  ⚠️  ADVERTENCIA: Hay clases antes de start_date`, 'yellow')
          }
          
          // Verificar si la última clase es cercana a hoy
          const daysDifference = Math.floor((new Date(today) - new Date(lastClassDate)) / (1000 * 60 * 60 * 24))
          if (daysDifference > 14) {
            log(`  ⚠️  ADVERTENCIA: Última clase fue hace ${daysDifference} días`, 'yellow')
          }
        }
        
      } catch (error) {
        log(`  ❌ Error al generar clases: ${error.message}`, 'red')
        studentInfo.details = `Error generando clases: ${error.message}`
        issues.classCountMismatch.push(studentInfo)
      }
    }
    
    // RESUMEN FINAL
    log('\n' + '='.repeat(80), 'cyan')
    log('📊 RESUMEN DEL DIAGNÓSTICO', 'cyan')
    log('='.repeat(80), 'cyan')
    
    log(`\n✅ Alumnos funcionando correctamente: ${issues.workingCorrectly.length}`, 'green')
    if (issues.workingCorrectly.length > 0) {
      issues.workingCorrectly.forEach(s => {
        log(`   • ${s.name} (${s.classCount} clases)`, 'white')
      })
    }
    
    log(`\n⚠️  Alumnos con clases faltantes: ${issues.missingClasses.length}`, 'yellow')
    if (issues.missingClasses.length > 0) {
      issues.missingClasses.forEach(s => {
        log(`   • ${s.name} - Faltan ${s.missing} clases (tiene ${s.actual}, debería tener ${s.expected})`, 'white')
      })
    }
    
    log(`\n❌ Alumnos sin start_date: ${issues.missingStartDate.length}`, 'red')
    if (issues.missingStartDate.length > 0) {
      issues.missingStartDate.forEach(s => {
        log(`   • ${s.name}`, 'white')
      })
    }
    
    log(`\n❌ Alumnos sin fixed_schedule: ${issues.missingFixedSchedule.length}`, 'red')
    if (issues.missingFixedSchedule.length > 0) {
      issues.missingFixedSchedule.forEach(s => {
        log(`   • ${s.name}`, 'white')
      })
    }
    
    log(`\n❌ Alumnos con fixed_schedule inválido: ${issues.invalidFixedSchedule.length}`, 'red')
    if (issues.invalidFixedSchedule.length > 0) {
      issues.invalidFixedSchedule.forEach(s => {
        log(`   • ${s.name} - ${s.details}`, 'white')
      })
    }
    
    log(`\n⚠️  Alumnos con fixed_schedule vacío: ${issues.emptyFixedSchedule.length}`, 'yellow')
    if (issues.emptyFixedSchedule.length > 0) {
      issues.emptyFixedSchedule.forEach(s => {
        log(`   • ${s.name}`, 'white')
      })
    }
    
    log(`\n⚠️  Alumnos con fecha de inicio futura: ${issues.futureStartDate.length}`, 'yellow')
    if (issues.futureStartDate.length > 0) {
      issues.futureStartDate.forEach(s => {
        log(`   • ${s.name} - ${s.details}`, 'white')
      })
    }
    
    log(`\n⚠️  Alumnos con descuadre de clases: ${issues.classCountMismatch.length}`, 'yellow')
    if (issues.classCountMismatch.length > 0) {
      issues.classCountMismatch.forEach(s => {
        log(`   • ${s.name} - ${s.details}`, 'white')
      })
    }
    
    // RECOMENDACIONES
    log('\n' + '='.repeat(80), 'cyan')
    log('💡 RECOMENDACIONES', 'cyan')
    log('='.repeat(80), 'cyan')
    
    if (issues.missingClasses.length > 0) {
      log('\n1. Ejecutar script de corrección para generar clases faltantes:', 'yellow')
      log('   node scripts/fix-class-tracking-issues.js', 'white')
    }
    
    if (issues.missingStartDate.length > 0 || issues.missingFixedSchedule.length > 0) {
      log('\n2. Completar datos de alumnos sin start_date o fixed_schedule:', 'yellow')
      log('   • Ir a /students y editar los alumnos listados arriba', 'white')
      log('   • Asegurarse de que tengan fecha de inicio y horario fijo', 'white')
    }
    
    if (issues.invalidFixedSchedule.length > 0) {
      log('\n3. Corregir horarios fijos inválidos:', 'yellow')
      log('   • Revisar los alumnos con errores de parsing', 'white')
      log('   • Volver a configurar su horario fijo desde el formulario', 'white')
    }
    
    log('\n✅ Diagnóstico completado\n', 'green')
    
    return issues
    
  } catch (error) {
    log(`\n❌ ERROR FATAL: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Ejecutar diagnóstico
diagnoseClassTracking()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

