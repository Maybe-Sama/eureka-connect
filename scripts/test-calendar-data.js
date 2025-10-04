const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testCalendarData() {
  try {
    console.log('🔍 Probando datos del calendario...')

    // Obtener estudiantes
    const studentsResponse = await fetch(`${API_BASE}/students`)
    const students = studentsResponse.ok ? await studentsResponse.json() : []
    
    console.log(`\n📚 Estudiantes encontrados: ${students.length}`)
    
    // Procesar horarios fijos
    const fixedSchedulesData = []
    for (const student of students) {
      if (student.fixed_schedule) {
        try {
          const fixedSchedule = JSON.parse(student.fixed_schedule)
          console.log(`\n👤 ${student.first_name} ${student.last_name}:`)
          console.log(`   Horarios fijos: ${fixedSchedule.length}`)
          
          for (const slot of fixedSchedule) {
            console.log(`   - Día ${slot.day_of_week}: ${slot.start_time}-${slot.end_time} (${slot.subject || 'Sin asignatura'})`)
            
            fixedSchedulesData.push({
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              course_name: student.course_name,
              course_color: student.course_color,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              subject: slot.subject || null,
              is_scheduled: false
            })
          }
        } catch (error) {
          console.error(`   ❌ Error parsing fixed schedule:`, error)
        }
      }
    }
    
    console.log(`\n📅 Total horarios fijos procesados: ${fixedSchedulesData.length}`)
    
    // Obtener clases programadas
    const classesResponse = await fetch(`${API_BASE}/classes`)
    const classes = classesResponse.ok ? await classesResponse.json() : []
    
    console.log(`\n📚 Clases programadas encontradas: ${classes.length}`)
    classes.forEach(cls => {
      console.log(`- ${cls.student_name}: Día ${cls.day_of_week} ${cls.start_time}-${cls.end_time}`)
    })
    
    // Simular la lógica del calendario para verificar slots
    console.log(`\n🔍 Verificando slots de tiempo...`)
    
    const timeSlots = []
    for (let hour = 8; hour <= 20; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < 20) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }
    
    // Verificar algunos slots específicos
    const testSlots = [
      { day: 1, time: '16:00' }, // Lunes 16:00
      { day: 3, time: '16:00' }, // Miércoles 16:00
      { day: 2, time: '17:15' }, // Martes 17:15
      { day: 4, time: '17:15' }, // Jueves 17:15
    ]
    
    for (const testSlot of testSlots) {
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
      }
      
      const currentTimeMinutes = timeToMinutes(testSlot.time)
      
      // Buscar horario fijo
      const fixedSchedule = fixedSchedulesData.find(schedule => {
        if (schedule.day_of_week !== testSlot.day) return false
        
        const startMinutes = timeToMinutes(schedule.start_time)
        const endMinutes = timeToMinutes(schedule.end_time)
        
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes
      })
      
      if (fixedSchedule) {
        console.log(`✅ Slot ${testSlot.day} ${testSlot.time}: ${fixedSchedule.student_name} - ${fixedSchedule.subject}`)
      } else {
        console.log(`❌ Slot ${testSlot.day} ${testSlot.time}: Vacío`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testCalendarData()
