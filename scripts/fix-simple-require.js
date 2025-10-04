/**
 * Script de Corrección Simplificado del Sistema de Seguimiento de Clases
 * Regenera clases faltantes usando directamente Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    })
  }
}

// Cargar variables de entorno
loadEnvFile()

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

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

// Función para generar clases desde fecha de inicio
function generateClassesFromStartDate(fixedSchedule, startDate, endDate, studentId, courseId, coursePrice) {
  const classes = []
  
  for (const timeSlot of fixedSchedule) {
    let currentDate = getNextOccurrenceFromDate(timeSlot.day_of_week, startDate)
    
    while (currentDate <= endDate) {
      const duration = calculateDuration(timeSlot.start_time, timeSlot.end_time)
      const price = (duration / 60) * coursePrice
      
      classes.push({
        student_id: studentId,
        course_id: courseId,
        day_of_week: timeSlot.day_of_week,
        date: currentDate,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time,
        duration: duration,
        price: parseFloat(price.toFixed(2)),
        status: 'scheduled',
        payment_status: 'unpaid',
        payment_notes: '',
        is_recurring: true,
        subject: timeSlot.subject || '',
        notes: `Generado automáticamente desde horario fijo`
      })
      
      // Move to next week
      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 7)
      currentDate = nextDate.toISOString().split('T')[0]
    }
  }
  
  return classes
}

// Helper functions
function getNextOccurrenceFromDate(dayOfWeek, fromDate) {
  const startDate = new Date(fromDate)
  const currentDay = startDate.getDay()
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
  const targetDate = new Date(startDate)
  targetDate.setDate(startDate.getDate() + daysUntilTarget)
  return targetDate.toISOString().split('T')[0]
}

function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  return (end.getTime() - start.getTime()) / (1000 * 60)
}

async function fixClassTrackingIssues() {
  try {
    log('\n🔧 INICIANDO CORRECCIÓN DEL SISTEMA DE SEGUIMIENTO DE CLASES', 'cyan')
    log('=' .repeat(80), 'cyan')
    
    // Obtener todos los alumnos
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        email,
        course_id,
        start_date,
        fixed_schedule,
        courses(name, price, color)
      `)
    
    if (studentsError) {
      log(`❌ Error obteniendo alumnos: ${studentsError.message}`, 'red')
      return
    }
    
    log(`\n📊 Total de alumnos a procesar: ${students?.length || 0}`, 'blue')
    
    const results = {
      fixed: [],
      skipped: [],
      errors: []
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    for (const student of students || []) {
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
        const { data: existingClasses, error: classesError } = await supabase
          .from('classes')
          .select('date, start_time, end_time')
          .eq('student_id', student.id)
        
        if (classesError) {
          log(`  ❌ ERROR: ${classesError.message}`, 'red')
          results.errors.push({
            id: student.id,
            name: studentName,
            error: classesError.message
          })
          continue
        }
        
        log(`  📚 Clases existentes: ${existingClasses?.length || 0}`, 'blue')
        
        // Obtener precio del curso
        const coursePrice = student.courses?.price || 0
        if (coursePrice <= 0) {
          log(`  ⚠️  ADVERTENCIA: Precio del curso no válido: ${coursePrice}`, 'yellow')
        }
        
        // Generar todas las clases que deberían existir
        const generatedClasses = generateClassesFromStartDate(
          parsedSchedule,
          student.start_date,
          today,
          student.id,
          student.course_id,
          coursePrice
        )
        
        log(`  🔄 Clases que deberían existir: ${generatedClasses.length}`, 'blue')
        
        // Crear un Set de clases existentes para comparación rápida
        const existingClassKeys = new Set(
          (existingClasses || []).map(cls => `${cls.date}-${cls.start_time}-${cls.end_time}`)
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
            const { error: insertError } = await supabase
              .from('classes')
              .insert(classData)
            
            if (insertError) {
              log(`    ⚠️  Error al crear clase del ${classData.date}: ${insertError.message}`, 'yellow')
            } else {
              createdCount++
            }
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
