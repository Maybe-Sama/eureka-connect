const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDigitalBoardLinkField() {
  try {
    console.log('🔍 Verificando campo digital_board_link en la tabla students...')
    
    // Verificar si la columna existe intentando hacer una consulta SELECT
    console.log('🔍 Probando si el campo digital_board_link existe...')
    
    const { data: testData, error: testError } = await supabase
      .from('students')
      .select('digital_board_link')
      .limit(1)

    if (testError) {
      if (testError.message.includes('digital_board_link')) {
        console.log('❌ Campo digital_board_link NO existe en la tabla students')
        console.log('🔧 Necesitas ejecutar la migración SQL')
        return
      } else {
        console.error('❌ Error al verificar campo:', testError)
        return
      }
    }

    console.log('✅ Campo digital_board_link existe en la tabla students')

    // Primero obtener un curso existente
    console.log('\n🔍 Obteniendo un curso existente...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .limit(1)

    if (coursesError || !courses || courses.length === 0) {
      console.error('❌ No se encontraron cursos en la base de datos')
      return
    }

    const courseId = courses[0].id
    console.log('✅ Curso encontrado con ID:', courseId)

    // Probar insertar un estudiante con digital_board_link
    console.log('\n🧪 Probando inserción de estudiante con digital_board_link...')
    
    const testStudent = {
      first_name: 'Test',
      last_name: 'Student',
      email: 'test@example.com',
      birth_date: '2000-01-01',
      phone: '123456789',
      course_id: courseId,
      student_code: 'TEST123456',
      start_date: '2024-01-01',
      digital_board_link: 'https://example.com/board'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('students')
      .insert(testStudent)
      .select()

    if (insertError) {
      console.error('❌ Error al insertar estudiante:', insertError)
      return
    }

    console.log('✅ Estudiante insertado correctamente con digital_board_link')
    console.log('📋 ID del estudiante:', insertData[0].id)
    console.log('🔗 Enlace guardado:', insertData[0].digital_board_link)

    // Probar actualizar el campo
    console.log('\n🔄 Probando actualización del campo digital_board_link...')
    
    const newLink = 'https://updated-example.com/board'
    const { error: updateError } = await supabase
      .from('students')
      .update({ digital_board_link: newLink })
      .eq('id', insertData[0].id)

    if (updateError) {
      console.error('❌ Error al actualizar digital_board_link:', updateError)
      return
    }

    console.log('✅ Campo digital_board_link actualizado correctamente')

    // Verificar la actualización
    const { data: updatedData, error: selectError } = await supabase
      .from('students')
      .select('digital_board_link')
      .eq('id', insertData[0].id)
      .single()

    if (selectError) {
      console.error('❌ Error al verificar actualización:', selectError)
      return
    }

    console.log('✅ Verificación exitosa. Nuevo enlace:', updatedData.digital_board_link)

    // Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', insertData[0].id)

    if (deleteError) {
      console.error('⚠️ Error al limpiar datos de prueba:', deleteError)
    } else {
      console.log('✅ Datos de prueba eliminados')
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron! El campo digital_board_link funciona correctamente.')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testDigitalBoardLinkField()
