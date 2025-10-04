const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Configuración de la base de datos SQLite local
const dbPath = path.join(__dirname, '..', 'database', 'crm.db')
const db = new sqlite3.Database(dbPath)

async function deleteIncorrectClasses() {
  return new Promise((resolve, reject) => {
    console.log('🗑️ Eliminando clases incorrectas de Carmen López...')

    // IDs de las clases incorrectas (Día 1 - Domingo)
    const incorrectClassIds = [207, 205, 206, 208]

    console.log(`📅 Eliminando ${incorrectClassIds.length} clases incorrectas:`)
    incorrectClassIds.forEach(id => {
      console.log(`   - Clase ID: ${id}`)
    })

    let completed = 0
    const total = incorrectClassIds.length

    if (total === 0) {
      console.log('✅ No hay clases incorrectas que eliminar')
      resolve()
      return
    }

    // Eliminar cada clase incorrecta
    incorrectClassIds.forEach(classId => {
      db.run(
        'DELETE FROM classes WHERE id = ?',
        [classId],
        function(err) {
          if (err) {
            console.error(`❌ Error eliminando clase ${classId}:`, err)
          } else {
            console.log(`✅ Clase ${classId} eliminada correctamente`)
          }
          
          completed++
          if (completed === total) {
            console.log('\n🎉 ¡Clases incorrectas eliminadas exitosamente!')
            console.log('📅 Carmen López ahora solo tiene clases en Martes y Jueves')
            resolve()
          }
        }
      )
    })
  })
}

deleteIncorrectClasses()
  .then(() => {
    console.log('✅ Script completado')
    db.close()
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error)
    db.close()
  })
