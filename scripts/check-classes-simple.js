/**
 * CHECK: Verificar precios de clases (versión simple)
 * 
 * Este script busca clases con precios incorrectos usando consultas separadas
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkClassesSimple() {
  console.log('🔍 Verificando precios de clases (versión simple)...\n')
  
  // 1. Obtener todas las clases
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, student_id, course_id, date, price, duration, status, payment_status')
    .order('date', { ascending: false })
    .limit(100)
  
  if (classesError) {
    console.error('❌ Error al obtener clases:', classesError)
    return
  }
  
  if (!classes || classes.length === 0) {
    console.log('ℹ️  No hay clases en la base de datos')
    return
  }
  
  console.log(`📚 Encontradas ${classes.length} clases (mostrando las últimas 100):\n`)
  
  let incorrectPricingCount = 0
  let studentsWithSharedPricing = new Set()
  
  for (const cls of classes) {
    // Obtener información del estudiante
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, first_name, last_name, has_shared_pricing')
      .eq('id', cls.student_id)
      .single()
    
    if (studentError || !student) {
      console.log(`⚠️  Clase ${cls.id}: No se pudo obtener información del estudiante`)
      continue
    }
    
    // Obtener información del curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name, price, shared_class_price')
      .eq('id', cls.course_id)
      .single()
    
    if (courseError || !course) {
      console.log(`⚠️  Clase ${cls.id}: No se pudo obtener información del curso`)
      continue
    }
    
    // Calcular precio esperado
    const expectedPricePerHour = student.has_shared_pricing && course.shared_class_price
      ? course.shared_class_price
      : course.price
    
    const actualPricePerHour = (cls.price / (cls.duration / 60)).toFixed(2)
    const isCorrect = Math.abs(parseFloat(actualPricePerHour) - expectedPricePerHour) <= 0.01
    
    if (!isCorrect) {
      incorrectPricingCount++
      if (student.has_shared_pricing) {
        studentsWithSharedPricing.add(`${student.first_name} ${student.last_name}`)
      }
    }
    
    // Mostrar solo clases con precios incorrectos o de estudiantes con precio compartido
    if (!isCorrect || student.has_shared_pricing) {
      console.log(`\n📝 Clase ${cls.id} - ${cls.date}`)
      console.log(`   👤 ${student.first_name} ${student.last_name} (${course.name})`)
      console.log(`   💰 Precio actual: €${cls.price} (${cls.duration}min) = €${actualPricePerHour}/h`)
      console.log(`   🎯 Precio esperado: €${expectedPricePerHour}/h`)
      console.log(`   📊 Precio compartido: ${student.has_shared_pricing ? 'SÍ' : 'NO'}`)
      console.log(`   ✅ Correcto: ${isCorrect ? 'SÍ' : 'NO'}`)
      console.log(`   📋 Estado: ${cls.status} | Pago: ${cls.payment_status}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`📊 RESUMEN:`)
  console.log(`   Total clases verificadas: ${classes.length}`)
  console.log(`   Clases con precio incorrecto: ${incorrectPricingCount}`)
  console.log(`   Estudiantes con precio compartido afectados: ${studentsWithSharedPricing.size}`)
  
  if (studentsWithSharedPricing.size > 0) {
    console.log(`\n👥 Estudiantes con precio compartido que tienen clases incorrectas:`)
    Array.from(studentsWithSharedPricing).forEach(name => {
      console.log(`   - ${name}`)
    })
  }
  
  if (incorrectPricingCount > 0) {
    console.log(`\n🔧 Para corregir estos precios, ejecuta:`)
    console.log(`   node scripts/fix-shared-pricing-classes.js`)
  } else {
    console.log(`\n✅ Todas las clases tienen precios correctos`)
  }
}

// Ejecutar
checkClassesSimple()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
