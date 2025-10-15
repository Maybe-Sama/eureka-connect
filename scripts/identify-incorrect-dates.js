#!/usr/bin/env node

/**
 * Script para identificar clases con fechas incorrectas
 * 
 * Este script encuentra clases donde el day_of_week no coincide con la fecha real.
 * Por ejemplo: day_of_week: 4 (miércoles) pero date: '2025-10-16' (jueves)
 * 
 * Uso: node scripts/identify-incorrect-dates.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function getDayOfWeekFromDate(dateString) {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return dayOfWeek === 0 ? 7 : dayOfWeek // Convert to 1-7 format (Monday-Sunday)
}

async function identifyIncorrectDates() {
  console.log('🔍 Buscando clases con fechas incorrectas...\n')
  
  try {
    // Obtener todas las clases
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        student_id,
        date,
        day_of_week,
        start_time,
        end_time,
        students!inner(name)
      `)
      .order('date', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching classes:', error)
      return
    }
    
    if (!classes || classes.length === 0) {
      console.log('ℹ️ No se encontraron clases')
      return
    }
    
    console.log(`📊 Total de clases: ${classes.length}\n`)
    
    const incorrectClasses = []
    
    // Verificar cada clase
    for (const cls of classes) {
      const actualDayOfWeek = getDayOfWeekFromDate(cls.date)
      
      if (cls.day_of_week !== actualDayOfWeek) {
        incorrectClasses.push({
          id: cls.id,
          student_name: cls.students?.name || 'Unknown',
          date: cls.date,
          stored_day_of_week: cls.day_of_week,
          actual_day_of_week: actualDayOfWeek,
          start_time: cls.start_time,
          end_time: cls.end_time
        })
      }
    }
    
    if (incorrectClasses.length === 0) {
      console.log('✅ ¡Perfecto! Todas las clases tienen fechas correctas.')
      return
    }
    
    console.log(`❌ Se encontraron ${incorrectClasses.length} clases con fechas incorrectas:\n`)
    
    // Agrupar por estudiante para facilitar la corrección
    const groupedByStudent = {}
    incorrectClasses.forEach(cls => {
      if (!groupedByStudent[cls.student_name]) {
        groupedByStudent[cls.student_name] = []
      }
      groupedByStudent[cls.student_name].push(cls)
    })
    
    // Mostrar por estudiante
    Object.keys(groupedByStudent).forEach(studentName => {
      console.log(`👤 ${studentName}:`)
      groupedByStudent[studentName].forEach(cls => {
        const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        console.log(`   ID: ${cls.id} | ${cls.date} | ${dayNames[cls.stored_day_of_week]} → ${dayNames[cls.actual_day_of_week]} | ${cls.start_time}-${cls.end_time}`)
      })
      console.log('')
    })
    
    // Generar queries SQL para corrección
    console.log('🔧 Queries SQL para corregir las fechas:\n')
    
    incorrectClasses.forEach(cls => {
      const actualDayOfWeek = getDayOfWeekFromDate(cls.date)
      console.log(`UPDATE classes SET day_of_week = ${actualDayOfWeek} WHERE id = ${cls.id}; -- ${cls.student_name} | ${cls.date}`)
    })
    
    console.log('\n💡 Puedes ejecutar estos queries en tu base de datos para corregir las fechas.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar el script
identifyIncorrectDates()
