/**
 * FIND: Buscar estudiante que muestra €12/h en lugar de €10/h
 * 
 * Este script busca específicamente el problema mencionado
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

async function findStudentWith12Euro() {
  console.log('🔍 Buscando estudiante con problema de €12/h en lugar de €10/h...\n')
  
  // 1. Buscar estudiantes con curso "1º BACH SOCIALES" y precio compartido
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
    .ilike('courses.name', '%1º%bach%sociales%')
    .eq('has_shared_pricing', true)
  
  if (studentsError) {
    console.error('❌ Error al buscar estudiantes:', studentsError)
    return
  }
  
  if (!students || students.length === 0) {
    console.log('ℹ️  No se encontraron estudiantes con curso "1º BACH SOCIALES" y precio compartido')
    
    // Buscar todos los estudiantes con precio compartido
    console.log('\n🔍 Buscando todos los estudiantes con precio compartido...')
    
    const { data: allSharedStudents, error: allSharedError } = await supabase
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
    
    if (allSharedError) {
      console.error('❌ Error al buscar todos los estudiantes:', allSharedError)
      return
    }
    
    if (allSharedStudents && allSharedStudents.length > 0) {
      console.log(`\n📋 Encontrados ${allSharedStudents.length} estudiantes con precio compartido:`)
      allSharedStudents.forEach(student => {
        console.log(`\n👤 ${student.first_name} ${student.last_name}`)
        console.log(`   Curso: ${student.courses?.name || 'Sin curso'}`)
        console.log(`   Precio normal: €${student.courses?.price || 'N/A'}`)
        console.log(`   Precio compartido: €${student.courses?.shared_class_price || 'N/A'}`)
        console.log(`   Precio esperado: €${student.has_shared_pricing && student.courses?.shared_class_price ? student.courses.shared_class_price : student.courses?.price || 'N/A'}`)
      })
    }
    
    return
  }
  
  console.log(`📋 Encontrados ${students.length} estudiante(s) con curso "1º BACH SOCIALES" y precio compartido:\n`)
  
  for (const student of students) {
    console.log(`\n👤 ${student.first_name} ${student.last_name}`)
    console.log(`   Curso: ${student.courses?.name}`)
    console.log(`   Precio normal: €${student.courses?.price}`)
    console.log(`   Precio compartido: €${student.courses?.shared_class_price}`)
    console.log(`   Tiene precio compartido: ${student.has_shared_pricing ? 'SÍ' : 'NO'}`)
    
    // Calcular precio esperado
    const expectedPrice = student.has_shared_pricing && student.courses?.shared_class_price
      ? student.courses.shared_class_price
      : student.courses?.price
    
    console.log(`   💰 Precio esperado: €${expectedPrice}/hora`)
    
    // Verificar si hay clases con precio incorrecto
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, date, price, duration, status')
      .eq('student_id', student.id)
      .order('date', { ascending: false })
      .limit(5)
    
    if (classesError) {
      console.log(`   ⚠️  Error al obtener clases: ${classesError.message}`)
      continue
    }
    
    if (!classes || classes.length === 0) {
      console.log(`   ℹ️  No tiene clases generadas`)
      continue
    }
    
    console.log(`   📚 ${classes.length} clases encontradas:`)
    
    let hasIncorrectPricing = false
    classes.forEach((cls, index) => {
      const actualPricePerHour = (cls.price / (cls.duration / 60)).toFixed(2)
      const isCorrect = Math.abs(parseFloat(actualPricePerHour) - expectedPrice) <= 0.01
      
      if (!isCorrect) {
        hasIncorrectPricing = true
      }
      
      console.log(`     ${index + 1}. ${cls.date} - €${cls.price} (${cls.duration}min) = €${actualPricePerHour}/h ${isCorrect ? '✅' : '❌'}`)
    })
    
    if (hasIncorrectPricing) {
      console.log(`   ⚠️  PROBLEMA ENCONTRADO: Este estudiante tiene clases con precios incorrectos`)
    } else {
      console.log(`   ✅ Todas las clases tienen precios correctos`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Búsqueda completada')
}

// Ejecutar
findStudentWith12Euro()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
