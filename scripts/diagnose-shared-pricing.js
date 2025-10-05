/**
 * DIAGNÓSTICO: Sistema de Precios Compartidos
 * 
 * Este script verifica que todo esté correctamente configurado
 * para el sistema de precios compartidos.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidas en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseSharedPricing() {
  console.log('🔍 DIAGNÓSTICO: Sistema de Precios Compartidos\n')
  console.log('=' .repeat(60))
  
  let allOk = true

  // ========================================
  // 1. Verificar columnas en tabla courses
  // ========================================
  console.log('\n1️⃣ Verificando tabla COURSES...')
  
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, name, price, shared_class_price')
    .limit(5)
  
  if (coursesError) {
    console.log('❌ ERROR al consultar tabla courses:')
    console.log('   ', coursesError.message)
    if (coursesError.message.includes('shared_class_price')) {
      console.log('\n⚠️  La columna "shared_class_price" NO EXISTE en la tabla courses')
      console.log('   → Debes ejecutar el script: database/add-shared-pricing-fields.sql')
      allOk = false
    }
  } else {
    console.log('✅ Tabla courses accesible')
    console.log(`   Total cursos consultados: ${courses?.length || 0}`)
    
    if (courses && courses.length > 0) {
      console.log('\n   Ejemplo de datos:')
      courses.slice(0, 3).forEach(course => {
        console.log(`   - ${course.name}:`)
        console.log(`     Precio normal: €${course.price}`)
        console.log(`     Precio compartido: ${course.shared_class_price ? `€${course.shared_class_price}` : 'No configurado'}`)
      })
      
      const withSharedPrice = courses.filter(c => c.shared_class_price != null)
      console.log(`\n   📊 ${withSharedPrice.length} de ${courses.length} cursos tienen precio compartido configurado`)
    }
  }

  // ========================================
  // 2. Verificar columnas en tabla students
  // ========================================
  console.log('\n2️⃣ Verificando tabla STUDENTS...')
  
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, first_name, last_name, course_id, has_shared_pricing')
    .limit(10)
  
  if (studentsError) {
    console.log('❌ ERROR al consultar tabla students:')
    console.log('   ', studentsError.message)
    if (studentsError.message.includes('has_shared_pricing')) {
      console.log('\n⚠️  La columna "has_shared_pricing" NO EXISTE en la tabla students')
      console.log('   → Debes ejecutar el script: database/add-shared-pricing-fields.sql')
      allOk = false
    }
  } else {
    console.log('✅ Tabla students accesible')
    console.log(`   Total estudiantes consultados: ${students?.length || 0}`)
    
    if (students && students.length > 0) {
      const withSharedPricing = students.filter(s => s.has_shared_pricing === true)
      console.log(`\n   📊 ${withSharedPricing.length} de ${students.length} estudiantes tienen precio compartido activado`)
      
      if (withSharedPricing.length > 0) {
        console.log('\n   Estudiantes con precio compartido:')
        withSharedPricing.slice(0, 5).forEach(student => {
          console.log(`   - ${student.first_name} ${student.last_name} (ID: ${student.id})`)
        })
      }
    }
  }

  // ========================================
  // 3. Verificar relación students-courses
  // ========================================
  console.log('\n3️⃣ Verificando relación STUDENTS ↔ COURSES...')
  
  const { data: studentsWithCourses, error: relationError } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      has_shared_pricing,
      courses:course_id (
        id,
        name,
        price,
        shared_class_price
      )
    `)
    .eq('has_shared_pricing', true)
    .limit(5)
  
  if (relationError) {
    console.log('❌ ERROR al consultar relación:')
    console.log('   ', relationError.message)
    allOk = false
  } else {
    console.log('✅ Relación funciona correctamente')
    
    if (studentsWithCourses && studentsWithCourses.length > 0) {
      console.log('\n   Detalles de estudiantes con precio compartido:')
      studentsWithCourses.forEach(student => {
        const course = student.courses
        const effectivePrice = course?.shared_class_price || course?.price || 0
        console.log(`\n   ${student.first_name} ${student.last_name}:`)
        console.log(`     Curso: ${course?.name}`)
        console.log(`     Precio normal del curso: €${course?.price}`)
        console.log(`     Precio compartido del curso: ${course?.shared_class_price ? `€${course.shared_class_price}` : 'NO CONFIGURADO ⚠️'}`)
        console.log(`     Precio efectivo: €${effectivePrice}`)
        
        if (!course?.shared_class_price) {
          console.log(`     ⚠️  PROBLEMA: El alumno tiene precio compartido pero el curso no lo tiene configurado`)
        }
      })
    } else {
      console.log('\n   ℹ️  No hay estudiantes con precio compartido activado todavía')
    }
  }

  // ========================================
  // 4. Verificar clases generadas
  // ========================================
  console.log('\n4️⃣ Verificando CLASES de estudiantes con precio compartido...')
  
  if (studentsWithCourses && studentsWithCourses.length > 0) {
    const studentId = studentsWithCourses[0].id
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, date, price, start_time, end_time, duration')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(5)
    
    if (classesError) {
      console.log('❌ ERROR al consultar clases:')
      console.log('   ', classesError.message)
      allOk = false
    } else {
      console.log(`✅ Clases accesibles (${classes?.length || 0} encontradas)`)
      
      if (classes && classes.length > 0) {
        const student = studentsWithCourses[0]
        const course = student.courses
        const expectedPrice = course?.shared_class_price || course?.price
        
        console.log(`\n   Clases de: ${student.first_name} ${student.last_name}`)
        console.log(`   Precio esperado: €${expectedPrice}/hora`)
        
        let pricesOk = 0
        let pricesWrong = 0
        
        classes.forEach((cls, index) => {
          const hourlyRate = (cls.price / (cls.duration / 60)).toFixed(2)
          const isCorrect = Math.abs(parseFloat(hourlyRate) - expectedPrice) < 0.01
          
          if (index < 3) {
            console.log(`\n   Clase ${cls.date}:`)
            console.log(`     Duración: ${cls.duration} min`)
            console.log(`     Precio guardado: €${cls.price}`)
            console.log(`     Tarifa por hora: €${hourlyRate}/hora`)
            console.log(`     ${isCorrect ? '✅' : '❌'} ${isCorrect ? 'Correcto' : 'INCORRECTO - Precio antiguo'}`)
          }
          
          if (isCorrect) pricesOk++
          else pricesWrong++
        })
        
        console.log(`\n   📊 Resumen: ${pricesOk} correctas, ${pricesWrong} con precio antiguo`)
        
        if (pricesWrong > 0) {
          console.log('\n   ⚠️  ACCIÓN REQUERIDA:')
          console.log('   Las clases existentes tienen precios antiguos.')
          console.log('   Edita el alumno en la UI para regenerar sus clases.')
        }
      }
    }
  }

  // ========================================
  // RESUMEN FINAL
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:\n')
  
  if (allOk) {
    console.log('✅ La base de datos está configurada correctamente')
    console.log('✅ Las columnas existen y son accesibles')
    console.log('✅ Las relaciones funcionan correctamente')
    
    if (studentsWithCourses && studentsWithCourses.length > 0) {
      const studentsWithoutCoursePrice = studentsWithCourses.filter(
        s => s.has_shared_pricing && !s.courses?.shared_class_price
      )
      
      if (studentsWithoutCoursePrice.length > 0) {
        console.log('\n⚠️  ADVERTENCIA:')
        console.log(`   ${studentsWithoutCoursePrice.length} estudiante(s) tienen precio compartido`)
        console.log('   pero su curso no tiene configurado el precio compartido.')
        console.log('\n   Acción recomendada:')
        console.log('   1. Ve a "Gestión de Cursos"')
        console.log('   2. Edita cada curso y añade el "Precio Clase Compartida"')
        console.log('   3. Guarda los cambios')
      }
    }
  } else {
    console.log('❌ HAY PROBLEMAS CON LA CONFIGURACIÓN')
    console.log('\n📝 PASOS PARA SOLUCIONAR:')
    console.log('\n1. Ejecuta el script SQL en Supabase:')
    console.log('   - Abre: https://supabase.com/dashboard')
    console.log('   - Ve a: SQL Editor')
    console.log('   - Copia y pega: database/add-shared-pricing-fields.sql')
    console.log('   - Haz clic en "Run"')
    console.log('\n2. Ejecuta este diagnóstico de nuevo:')
    console.log('   node scripts/diagnose-shared-pricing.js')
  }
  
  console.log('\n' + '='.repeat(60))
}

// Ejecutar diagnóstico
diagnoseSharedPricing()
  .then(() => {
    console.log('\n✅ Diagnóstico completado\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Error durante el diagnóstico:', error)
    process.exit(1)
  })

