/**
 * FIX: Regenerar clases de alumnos con precio compartido
 * 
 * Este script encuentra alumnos con has_shared_pricing=true
 * y regenera sus clases para que usen el precio compartido correcto.
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

async function fixSharedPricingClasses() {
  console.log('🔧 Corrigiendo clases con precio compartido...\n')
  
  // 1. Obtener estudiantes con precio compartido
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      course_id,
      start_date,
      fixed_schedule,
      has_shared_pricing,
      courses:course_id (
        id,
        name,
        price,
        shared_class_price
      )
    `)
    .eq('has_shared_pricing', true)
  
  if (studentsError) {
    console.error('❌ Error al obtener estudiantes:', studentsError)
    return
  }
  
  if (!students || students.length === 0) {
    console.log('ℹ️  No hay estudiantes con precio compartido')
    return
  }
  
  console.log(`📋 Encontrados ${students.length} estudiante(s) con precio compartido:\n`)
  
  for (const student of students) {
    console.log(`\n👤 ${student.first_name} ${student.last_name}`)
    console.log(`   Curso: ${student.courses?.name}`)
    console.log(`   Precio normal: €${student.courses?.price}`)
    console.log(`   Precio compartido: €${student.courses?.shared_class_price}`)
    
    // Obtener clases actuales
    const { data: currentClasses } = await supabase
      .from('classes')
      .select('id, date, price, duration')
      .eq('student_id', student.id)
      .order('date', { ascending: true })
    
    if (!currentClasses || currentClasses.length === 0) {
      console.log('   ⚠️  No tiene clases generadas')
      continue
    }
    
    // Verificar si las clases tienen precio incorrecto
    const expectedPricePerHour = student.courses?.shared_class_price || student.courses?.price
    const classesWithWrongPrice = currentClasses.filter(cls => {
      const actualPricePerHour = (cls.price / (cls.duration / 60)).toFixed(2)
      return Math.abs(parseFloat(actualPricePerHour) - expectedPricePerHour) > 0.01
    })
    
    if (classesWithWrongPrice.length === 0) {
      console.log(`   ✅ Todas las clases (${currentClasses.length}) ya tienen el precio correcto`)
      continue
    }
    
    console.log(`   ⚠️  ${classesWithWrongPrice.length} de ${currentClasses.length} clases con precio incorrecto`)
    console.log(`   🔄 Corrigiendo precios...`)
    
    // Actualizar precio de cada clase incorrecta
    let fixed = 0
    for (const cls of classesWithWrongPrice) {
      const correctPrice = (cls.duration / 60) * expectedPricePerHour
      
      const { error: updateError } = await supabase
        .from('classes')
        .update({ price: parseFloat(correctPrice.toFixed(2)) })
        .eq('id', cls.id)
      
      if (updateError) {
        console.error(`   ❌ Error actualizando clase ${cls.id}:`, updateError.message)
      } else {
        fixed++
      }
    }
    
    console.log(`   ✅ ${fixed} clases corregidas`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Proceso completado')
  console.log('\nVerifica los cambios en "Seguimiento de Clases"')
}

// Ejecutar
fixSharedPricingClasses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

