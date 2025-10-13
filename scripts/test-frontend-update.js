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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testFrontendUpdate() {
  try {
    console.log('🔍 Simulando actualización desde el frontend...')
    
    // Obtener un estudiante existente
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, digital_board_link')
      .limit(1)

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No se encontraron estudiantes en la base de datos')
      return
    }

    const student = students[0]
    console.log('📋 Estudiante encontrado:', {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      current_digital_board_link: student.digital_board_link
    })

    // Simular la actualización que hace el frontend
    const updateData = {
      first_name: student.first_name,
      last_name: student.last_name,
      email: 'test@example.com', // Necesario para la validación
      birth_date: '2000-01-01', // Necesario para la validación
      phone: '123456789', // Necesario para la validación
      course_id: 5, // Necesario para la validación
      start_date: '2024-01-01', // Necesario para la validación
      digital_board_link: 'https://frontend-test.com/board'
    }

    console.log('🔄 Actualizando estudiante con datos:', updateData)

    const { data: updateResult, error: updateError } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', student.id)
      .select()

    if (updateError) {
      console.error('❌ Error al actualizar:', updateError)
      return
    }

    console.log('✅ Estudiante actualizado correctamente')
    console.log('🔗 Nuevo enlace guardado:', updateResult[0].digital_board_link)

    // Verificar que se guardó correctamente
    const { data: verifyData, error: verifyError } = await supabase
      .from('students')
      .select('digital_board_link')
      .eq('id', student.id)
      .single()

    if (verifyError) {
      console.error('❌ Error al verificar:', verifyError)
      return
    }

    console.log('✅ Verificación exitosa. Enlace final:', verifyData.digital_board_link)

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testFrontendUpdate()
