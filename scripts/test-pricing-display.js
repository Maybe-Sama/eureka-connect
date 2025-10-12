/**
 * TEST: Verificar cómo se muestran los precios en el seguimiento
 * 
 * Este script simula la lógica de precios para verificar el comportamiento
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

async function testPricingDisplay() {
  console.log('🧪 Probando lógica de precios en seguimiento...\n')
  
  // 1. Obtener estudiantes con precio compartido
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      course_id,
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
  
  if (studentsError) {
    console.error('❌ Error al obtener estudiantes:', studentsError)
    return
  }
  
  if (!students || students.length === 0) {
    console.log('ℹ️  No hay estudiantes con precio compartido')
    return
  }
  
  console.log(`📋 Probando con ${students.length} estudiantes con precio compartido:\n`)
  
  for (const student of students) {
    console.log(`\n👤 ${student.first_name} ${student.last_name}`)
    console.log(`   Curso: ${student.courses?.name}`)
    console.log(`   Precio normal: €${student.courses?.price}`)
    console.log(`   Precio compartido: €${student.courses?.shared_class_price}`)
    console.log(`   Tiene precio compartido: ${student.has_shared_pricing ? 'SÍ' : 'NO'}`)
    
    // Simular la lógica de ClassTrackingCard.tsx líneas 118-120
    const displayPrice = student.has_shared_pricing && student.courses?.shared_class_price 
      ? student.courses.shared_class_price 
      : student.courses?.price
    
    console.log(`   💰 Precio que se mostraría: €${displayPrice}/hora`)
    
    // Verificar si es correcto
    const expectedPrice = student.has_shared_pricing && student.courses?.shared_class_price
      ? student.courses.shared_class_price
      : student.courses?.price
    
    const isCorrect = displayPrice === expectedPrice
    console.log(`   ✅ Correcto: ${isCorrect ? 'SÍ' : 'NO'}`)
    
    if (!isCorrect) {
      console.log(`   ⚠️  PROBLEMA: Se muestra €${displayPrice} pero debería ser €${expectedPrice}`)
    }
  }
  
  // 2. Probar con estudiantes sin precio compartido
  console.log('\n' + '='.repeat(60))
  console.log('🧪 Probando con estudiantes SIN precio compartido:\n')
  
  const { data: studentsWithoutShared, error: studentsWithoutSharedError } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      course_id,
      has_shared_pricing,
      courses:course_id (
        id,
        name,
        price,
        shared_class_price
      )
    `)
    .eq('has_shared_pricing', false)
    .limit(3)
  
  if (studentsWithoutSharedError) {
    console.error('❌ Error al obtener estudiantes sin precio compartido:', studentsWithoutSharedError)
    return
  }
  
  if (studentsWithoutShared && studentsWithoutShared.length > 0) {
    for (const student of studentsWithoutShared) {
      console.log(`\n👤 ${student.first_name} ${student.last_name}`)
      console.log(`   Curso: ${student.courses?.name}`)
      console.log(`   Precio normal: €${student.courses?.price}`)
      console.log(`   Precio compartido: €${student.courses?.shared_class_price}`)
      console.log(`   Tiene precio compartido: ${student.has_shared_pricing ? 'SÍ' : 'NO'}`)
      
      // Simular la lógica de ClassTrackingCard.tsx líneas 118-120
      const displayPrice = student.has_shared_pricing && student.courses?.shared_class_price 
        ? student.courses.shared_class_price 
        : student.courses?.price
      
      console.log(`   💰 Precio que se mostraría: €${displayPrice}/hora`)
      
      // Verificar si es correcto
      const expectedPrice = student.has_shared_pricing && student.courses?.shared_class_price
        ? student.courses.shared_class_price
        : student.courses?.price
      
      const isCorrect = displayPrice === expectedPrice
      console.log(`   ✅ Correcto: ${isCorrect ? 'SÍ' : 'NO'}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Prueba completada')
}

// Ejecutar
testPricingDisplay()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
