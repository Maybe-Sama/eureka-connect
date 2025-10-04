const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function fixCarmenClassesDays() {
  try {
    console.log('🔧 Corrigiendo días de las clases de Carmen López...')

    // Obtener las clases de Carmen
    const classesResponse = await fetch(`${API_BASE}/classes`)
    const classes = classesResponse.ok ? await classesResponse.json() : []
    
    const carmenClasses = classes.filter(cls => 
      cls.student_name === 'Carmen López' && 
      cls.start_time === '19:00:00' && 
      cls.end_time === '20:30:00'
    )

    console.log(`📅 Encontradas ${carmenClasses.length} clases de Carmen para corregir:`)
    carmenClasses.forEach(cls => {
      console.log(`   - ID: ${cls.id}, Día actual: ${cls.day_of_week}, Fecha: ${cls.date}`)
    })

    // Corregir los días de la semana
    for (let i = 0; i < carmenClasses.length; i++) {
      const cls = carmenClasses[i]
      const correctDay = i === 0 ? 2 : 4 // Primera clase: Martes (2), Segunda clase: Jueves (4)
      
      console.log(`🔧 Corrigiendo clase ID ${cls.id}: Día ${cls.day_of_week} → Día ${correctDay}`)
      
      const updateResponse = await fetch(`${API_BASE}/classes/${cls.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_of_week: correctDay
        })
      })

      if (updateResponse.ok) {
        console.log(`   ✅ Clase ID ${cls.id} actualizada correctamente`)
      } else {
        const error = await updateResponse.json()
        console.error(`   ❌ Error actualizando clase ID ${cls.id}:`, error)
      }
    }

    console.log('🎉 ¡Días de las clases de Carmen corregidos!')
    console.log('📅 Ahora aparecerá correctamente en Martes y Jueves')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixCarmenClassesDays()
