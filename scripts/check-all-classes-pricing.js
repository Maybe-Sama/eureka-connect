/**
 * CHECK: Verificar precios de todas las clases existentes
 * 
 * Este script busca todas las clases que podrían tener precios incorrectos
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

async function checkAllClassesPricing() {
  console.log('🔍 Verificando precios de todas las clases existentes...\n')
  
  // 1. Obtener todas las clases con información de estudiante y curso
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      student_id,
      course_id,
      date,
      price,
      duration,
      status,
      payment_status,
      students:student_id (
        id,
        first_name,
        last_name,
        has_shared_pricing
      ),
      courses:course_id (
        id,
        name,
        price,
        shared_class_price
      )
    `)
    .order('date', { ascending: false })
    .limit(50) // Solo las últimas 50 clases
  
  if (classesError) {
    console.error('❌ Error al obtener clases:', classesError)
    return
  }
  
  if (!classes || classes.length === 0) {
    console.log('ℹ️  No hay clases en la base de datos')
    return
  }
  
  console.log(`📚 Encontradas ${classes.length} clases (mostrando las últimas 50):\n`)
  
  let incorrectPricingCount = 0
  let studentsWithSharedPricing = new Set()
  
  for (const cls of classes) {
    const student = cls.students
    const course = cls.courses
    
    if (!student || !course) {
      console.log(`⚠️  Clase ${cls.id}: Datos de estudiante o curso faltantes`)
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
checkAllClassesPricing()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
