#!/usr/bin/env node

/**
 * Script para verificar el estado de una clase específica
 * 
 * Uso: node scripts/check-class-status.js [classId]
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkClassStatus(classId) {
  console.log(`🔍 Verificando estado de la clase ID: ${classId}\n`)
  
  try {
    // Buscar la clase específica (sin relaciones para evitar conflictos)
    const { data: classData, error } = await supabase
      .from('classes')
      .select(`
        id,
        student_id,
        course_id,
        date,
        day_of_week,
        start_time,
        end_time,
        status
      `)
      .eq('id', classId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ La clase NO EXISTE en la base de datos - FUE ELIMINADA CORRECTAMENTE')
        return
      } else {
        console.error('❌ Error buscando la clase:', error)
        return
      }
    }
    
    if (classData) {
      console.log('⚠️ La clase AÚN EXISTE en la base de datos:')
      console.log(`   ID: ${classData.id}`)
      console.log(`   Student ID: ${classData.student_id}`)
      console.log(`   Course ID: ${classData.course_id}`)
      console.log(`   Fecha: ${classData.date}`)
      console.log(`   Día: ${classData.day_of_week}`)
      console.log(`   Hora: ${classData.start_time} - ${classData.end_time}`)
      console.log(`   Estado: ${classData.status}`)
      console.log('\n❌ La eliminación NO fue exitosa')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Obtener el ID de la clase desde los argumentos de línea de comandos
const classId = process.argv[2] || '2120'

checkClassStatus(parseInt(classId))
