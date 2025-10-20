import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'
import { generateClassesFromStartDate } from '@/lib/class-generation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await dbOperations.getStudentById(Number(params.id))
    if (!student) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }
    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('🔍 API UPDATE - Body recibido:', JSON.stringify(body, null, 2))
    
    const { 
      first_name, last_name, email, birth_date, phone, parent_phone, parent_contact_type, 
      course_id, schedule, fixed_schedule, start_date, has_shared_pricing,
      // Fiscal data fields
      dni, nif, address, postal_code, city, province, country,
      // Receptor data fields
      receptor_nombre, receptor_apellidos, receptor_email,
      // Digital board link field
      digital_board_link
    } = body
    
    console.log('🔍 API UPDATE - digital_board_link extraído:', digital_board_link)

    // Si solo se está actualizando el fixed_schedule, no validar campos obligatorios
    if (fixed_schedule && !first_name && !last_name && !email && !birth_date && !phone && !course_id) {
      const result = await dbOperations.updateStudent(Number(params.id), {
        fixed_schedule
      })
      return NextResponse.json({ message: 'Horario fijo actualizado exitosamente' })
    }

    if (!first_name || !last_name || !email || !birth_date || !phone || !course_id || !start_date) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // ========================================
    // VALIDATION: Start Date Format and Logic
    // ========================================
    // Validate that start_date follows YYYY-MM-DD format and is not in the future
    // This prevents invalid date formats and ensures students can't start classes in the future
    
    // Check if start_date is in YYYY-MM-DD format using regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(start_date)) {
      return NextResponse.json({ 
        error: 'La fecha de inicio debe estar en formato YYYY-MM-DD (ej: 2024-01-15)' 
      }, { status: 400 })
    }

    // Parse the date and validate it's a valid date
    const startDateObj = new Date(start_date)
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({ 
        error: 'Formato de fecha de inicio inválido. Use YYYY-MM-DD' 
      }, { status: 400 })
    }

    // Validate that start_date is not in the future
    // Students cannot start classes in the future - only today or in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
    if (startDateObj > today) {
      return NextResponse.json({ 
        error: 'La fecha de inicio no puede ser en el futuro' 
      }, { status: 400 })
    }

    // ========================================
    // VALIDATION: Fixed Schedule (Optional)
    // ========================================
    // Validate fixed_schedule if provided - this is optional but if provided must be valid
    // Format: JSON array with objects containing day_of_week, start_time, end_time
    // Example: [{"day_of_week": 1, "start_time": "09:00", "end_time": "11:00"}]
    
    if (fixed_schedule) {
      try {
        // Parse JSON if it's a string, otherwise use as-is
        const parsedSchedule = typeof fixed_schedule === 'string' 
          ? JSON.parse(fixed_schedule) 
          : fixed_schedule
        
        // Validate that it's an array
        if (!Array.isArray(parsedSchedule)) {
          return NextResponse.json({ 
            error: 'El horario fijo debe ser un array JSON con objetos que contengan day_of_week, start_time y end_time' 
          }, { status: 400 })
        }

        // Validate that the array is not empty
        if (parsedSchedule.length === 0) {
          return NextResponse.json({ 
            error: 'El horario fijo no puede estar vacío' 
          }, { status: 400 })
        }

        // Validate each time slot with comprehensive checks
        for (let i = 0; i < parsedSchedule.length; i++) {
          const slot = parsedSchedule[i]
          
          // Check if slot is an object
          if (typeof slot !== 'object' || slot === null) {
            return NextResponse.json({ 
              error: `El elemento ${i + 1} del horario fijo debe ser un objeto` 
            }, { status: 400 })
          }

          // Validate day_of_week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          if (typeof slot.day_of_week !== 'number' || slot.day_of_week < 0 || slot.day_of_week > 6) {
            return NextResponse.json({ 
              error: `day_of_week inválido en el elemento ${i + 1} del horario fijo. Debe ser un número entre 0 (domingo) y 6 (sábado)` 
            }, { status: 400 })
          }

          // Validate start_time and end_time presence
          if (!slot.start_time || !slot.end_time) {
            return NextResponse.json({ 
              error: `start_time y end_time son requeridos en el elemento ${i + 1} del horario fijo` 
            }, { status: 400 })
          }

          // Validate time format (HH:MM) - 24-hour format
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
          if (!timeRegex.test(slot.start_time)) {
            return NextResponse.json({ 
              error: `start_time inválido en el elemento ${i + 1} del horario fijo. Debe estar en formato HH:MM (ej: 09:30)` 
            }, { status: 400 })
          }
          if (!timeRegex.test(slot.end_time)) {
            return NextResponse.json({ 
              error: `end_time inválido en el elemento ${i + 1} del horario fijo. Debe estar en formato HH:MM (ej: 11:30)` 
            }, { status: 400 })
          }

          // Validate that end_time is after start_time
          // This prevents invalid time ranges where end time is before or equal to start time
          const startMinutes = timeToMinutes(slot.start_time)
          const endMinutes = timeToMinutes(slot.end_time)
          if (endMinutes <= startMinutes) {
            return NextResponse.json({ 
              error: `end_time debe ser posterior a start_time en el elemento ${i + 1} del horario fijo` 
            }, { status: 400 })
          }
        }
      } catch (error) {
        return NextResponse.json({ 
          error: 'Error al parsear el horario fijo. Asegúrese de que sea un JSON válido' 
        }, { status: 400 })
      }
    }

    // Update student information
    const updateData = {
      first_name,
      last_name,
      email,
      birth_date,
      phone,
      parent_phone,
      parent_contact_type,
      course_id: Number(course_id),
      fixed_schedule,
      start_date,
      has_shared_pricing: has_shared_pricing !== undefined ? has_shared_pricing : false,
      // Fiscal data fields
      dni,
      nif,
      address,
      postal_code,
      city,
      province,
      country,
      // Receptor data fields
      receptor_nombre,
      receptor_apellidos,
      receptor_email,
      // Digital board link field
      digital_board_link
    }
    
    console.log('🔍 API UPDATE - Datos a actualizar:', JSON.stringify(updateData, null, 2))
    
    const result = await dbOperations.updateStudent(Number(params.id), updateData)

    // ========================================
    // AUTOMATIC CLASS GENERATION (UPDATE) - WITH DATA PROTECTION
    // ========================================
    // Only regenerate classes when the fixed_schedule actually changes
    // This prevents unnecessary class regeneration for simple data updates

    // Get current student data to compare schedules
    const currentStudent = await dbOperations.getStudentById(Number(params.id))
    const currentSchedule = currentStudent?.fixed_schedule

    // Check if the schedule actually changed
    const scheduleChanged = JSON.stringify(currentSchedule) !== JSON.stringify(fixed_schedule)

    if (scheduleChanged) {
      console.log(`🔄 Schedule changed for student ${params.id} - checking for data protection...`)

      let scheduleToProcess = schedule

      // If no schedule but fixed_schedule is provided, parse it
      if (!scheduleToProcess && fixed_schedule) {
        try {
          scheduleToProcess = typeof fixed_schedule === 'string'
            ? JSON.parse(fixed_schedule)
            : fixed_schedule
        } catch (error) {
          console.error('Error parsing fixed_schedule:', error)
        }
      }

      // Update classes if we have a valid schedule
      if (scheduleToProcess && Array.isArray(scheduleToProcess) && scheduleToProcess.length > 0) {
        try {
          // Get all existing classes for this student
          const allClasses = await dbOperations.getAllClasses()
          const existingClasses = allClasses.filter(cls => cls.student_id === Number(params.id))
          
          // Check for classes with critical data that cannot be lost (only FUTURE classes)
          const today = new Date().toISOString().split('T')[0]
          const futureClassesWithCriticalData = existingClasses.filter(cls => 
            cls.date >= today && (  // Solo verificar clases futuras
              cls.payment_status === 'paid' ||           // ❌ Clase ya pagada
              cls.status === 'completed' ||              // ❌ Clase ya completada
              cls.subject ||                             // ❌ Tiene asignatura asignada
              cls.notes ||                               // ❌ Tiene notas
              cls.payment_notes ||                       // ❌ Tiene notas de pago
              cls.status_invoice === 1                   // ❌ Ya está facturada
            )
          )

          if (futureClassesWithCriticalData.length > 0) {
            console.log(`🚨 DATA PROTECTION: ${futureClassesWithCriticalData.length} clases FUTURAS tienen datos críticos - NO se regenerarán`)
            console.log('Clases futuras con datos críticos:', futureClassesWithCriticalData.map(c => ({
              id: c.id,
              date: c.date,
              payment_status: c.payment_status,
              status: c.status,
              subject: c.subject,
              has_notes: !!(c.notes || c.payment_notes),
              is_invoiced: c.status_invoice === 1
            })))
            
            return NextResponse.json({ 
              message: 'Alumno actualizado exitosamente. No se regeneraron clases futuras para preservar datos críticos.',
              warning: `${futureClassesWithCriticalData.length} clases futuras tienen datos importantes y no se modificaron`,
              protected_classes: futureClassesWithCriticalData.length
            })
          }

          // If no critical data, proceed with safe regeneration
          console.log(`✅ No critical data found - proceeding with safe class regeneration for student ${params.id}`)
          
          // Delete existing future recurring classes for this student (preserve historical data)
          const existingRecurringClasses = allClasses.filter(cls =>
            cls.student_id === Number(params.id) &&
            cls.is_recurring === true &&
            cls.date >= today // Solo eliminar clases de hoy en adelante
          )

          console.log(`Deleting ${existingRecurringClasses.length} future recurring classes for student ${params.id} (from ${today} onwards)`)
          console.log('Preserving historical classes before:', today)
          for (const cls of existingRecurringClasses) {
            await dbOperations.deleteClass(cls.id)
          }

          // Generate new classes for the next 7 days only
          const futureEndDate = new Date()
          futureEndDate.setDate(futureEndDate.getDate() + 7) // Solo 7 días siguientes
          const endDate = futureEndDate.toISOString().split('T')[0]

          const generatedClasses = await generateClassesFromStartDate(
            Number(params.id),
            Number(course_id),
            scheduleToProcess,
            today, // Empezar desde hoy
            endDate // Hasta 7 días después
          )

          // Create all generated classes
          if (generatedClasses.length > 0) {
            for (const classData of generatedClasses) {
              await dbOperations.createClass(classData)
            }
            console.log(`✅ Student ${params.id}: Created ${generatedClasses.length} classes for next 7 days`)
            console.log(`📅 Classes created from ${today} to ${endDate}`)
          } else {
            console.log(`⚠️ No classes generated for student ${params.id} - Check schedule and date range`)
            console.log(`📅 Date range: ${today} to ${endDate}`)
          }
        } catch (error) {
          console.error(`❌ Error updating classes for student ${params.id}:`, error)
          // Don't fail the student update if class generation fails
          // The student information is already updated successfully
        }
      } else {
        console.log(`No valid schedule provided for student ${params.id} - skipping class update`)
      }
    } else {
      console.log(`No schedule changes detected for student ${params.id} - skipping class regeneration`)
    }

    return NextResponse.json({ message: 'Alumno actualizado exitosamente' })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Helper functions
function timeToMinutes(time: string): number {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function getNextOccurrence(dayOfWeek: number): string {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Convert dayOfWeek from 0-6 format to 1-7 format (1=Monday, 7=Sunday)
  let targetDay = dayOfWeek
  if (dayOfWeek === 0) {
    targetDay = 7 // Sunday
  }
  
  // Convert current day to 1-7 format
  const currentDayConverted = currentDay === 0 ? 7 : currentDay
  
  let daysToAdd = targetDay - currentDayConverted
  if (daysToAdd <= 0) daysToAdd += 7
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysToAdd)
  
  return nextDate.toISOString().split('T')[0]
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await dbOperations.deleteStudent(Number(params.id))
    return NextResponse.json({ message: 'Alumno eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
