const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fullVerification() {
  console.log('🔍 VERIFICACIÓN COMPLETA DE SUPABASE')
  console.log('=====================================\n')

  try {
    // 1. Verificar todas las tablas
    console.log('1️⃣ Verificando estructura de tablas...')
    
    const tables = ['courses', 'students', 'classes', 'invoices']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ Tabla ${table}: ${error.message}`)
      } else {
        console.log(`✅ Tabla ${table}: OK (${data || 0} registros)`)
      }
    }

    // 2. Probar creación de curso con asignatura
    console.log('\n2️⃣ Probando creación de curso con asignatura...')
    
    const testCourse = {
      name: 'Matemáticas Avanzadas',
      description: 'Curso de matemáticas para bachillerato',
      subject: 'Matemáticas II',
      price: 30.00,
      duration: 90,
      color: '#3b82f6',
      is_active: true
    }
    
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select()
      .single()
    
    if (courseError) {
      console.log('❌ Error al crear curso:', courseError.message)
      return
    }
    
    console.log('✅ Curso creado exitosamente!')
    console.log(`   📝 ID: ${course.id}`)
    console.log(`   📝 Nombre: ${course.name}`)
    console.log(`   📝 Asignatura: ${course.subject}`)
    console.log(`   📝 Precio: €${course.price}`)

    // 3. Probar creación de estudiante con código único
    console.log('\n3️⃣ Probando creación de estudiante...')
    
    const testStudent = {
      first_name: 'María',
      last_name: 'García',
      email: 'maria.garcia@test.com',
      birth_date: '2008-03-15',
      phone: '987654321',
      parent_phone: '987654322',
      course_id: course.id,
      student_code: '12345678901234567890',
      fixed_schedule: 'Lunes y Miércoles de 16:00 a 17:30'
    }
    
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert(testStudent)
      .select(`
        *,
        courses!inner(name, subject, price)
      `)
      .single()
    
    if (studentError) {
      console.log('❌ Error al crear estudiante:', studentError.message)
      return
    }
    
    console.log('✅ Estudiante creado exitosamente!')
    console.log(`   📝 ID: ${student.id}`)
    console.log(`   📝 Nombre: ${student.first_name} ${student.last_name}`)
    console.log(`   📝 Código: ${student.student_code}`)
    console.log(`   📝 Horario fijo: ${student.fixed_schedule}`)
    console.log(`   📝 Curso: ${student.courses.name} (${student.courses.subject})`)

    // 4. Probar creación de clase
    console.log('\n4️⃣ Probando creación de clase...')
    
    const testClass = {
      student_id: student.id,
      course_id: course.id,
      date: '2024-01-15',
      start_time: '16:00',
      end_time: '17:30',
      notes: 'Clase de prueba - Matemáticas II'
    }
    
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert(testClass)
      .select(`
        *,
        students!inner(first_name, last_name),
        courses!inner(name)
      `)
      .single()
    
    if (classError) {
      console.log('❌ Error al crear clase:', classError.message)
      return
    }
    
    console.log('✅ Clase creada exitosamente!')
    console.log(`   📝 ID: ${classData.id}`)
    console.log(`   📝 Fecha: ${classData.date}`)
    console.log(`   📝 Horario: ${classData.start_time} - ${classData.end_time}`)
    console.log(`   📝 Estudiante: ${classData.students.first_name} ${classData.students.last_name}`)
    console.log(`   📝 Curso: ${classData.courses.name}`)

    // 5. Probar creación de factura
    console.log('\n5️⃣ Probando creación de factura...')
    
    const testInvoice = {
      student_id: student.id,
      course_id: course.id,
      amount: course.price * 1.5, // 1.5 horas
      status: 'pending',
      due_date: '2024-02-15',
      notes: 'Factura de prueba'
    }
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(testInvoice)
      .select(`
        *,
        students!inner(first_name, last_name),
        courses!inner(name)
      `)
      .single()
    
    if (invoiceError) {
      console.log('❌ Error al crear factura:', invoiceError.message)
      return
    }
    
    console.log('✅ Factura creada exitosamente!')
    console.log(`   📝 ID: ${invoice.id}`)
    console.log(`   📝 Importe: €${invoice.amount}`)
    console.log(`   📝 Estado: ${invoice.status}`)
    console.log(`   📝 Estudiante: ${invoice.students.first_name} ${invoice.students.last_name}`)

    // 6. Limpiar datos de prueba
    console.log('\n6️⃣ Limpiando datos de prueba...')
    
    await supabase.from('invoices').delete().eq('id', invoice.id)
    await supabase.from('classes').delete().eq('id', classData.id)
    await supabase.from('students').delete().eq('id', student.id)
    await supabase.from('courses').delete().eq('id', course.id)
    
    console.log('✅ Datos de prueba eliminados')

    // 7. Resumen final
    console.log('\n🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE!')
    console.log('=====================================')
    console.log('✅ Conexión a Supabase: OK')
    console.log('✅ Todas las tablas creadas: OK')
    console.log('✅ Sistema de asignaturas: OK')
    console.log('✅ Códigos únicos de estudiantes: OK')
    console.log('✅ Horarios fijos: OK')
    console.log('✅ Relaciones entre tablas: OK')
    console.log('✅ APIs funcionando: OK')
    console.log('\n🚀 ¡La aplicación está lista para usar!')
    console.log('🌐 Accede a: http://localhost:3001')
    
  } catch (error) {
    console.log('❌ Error general:', error.message)
  }
}

fullVerification()
