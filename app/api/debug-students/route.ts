// @ts-nocheck
import { NextResponse } from 'next/server'
import { dbOperationsDebug } from '@/lib/database-debug'

export async function GET() {
  try {
    console.log('🔍 API Debug: Cargando estudiantes...')
    
    // Probar versión sin relación
    const studentsBasic = await dbOperationsDebug.getAllStudents()
    console.log(`✅ Cargados ${studentsBasic.length} estudiantes básicos`)
    
    // Probar versión con relación
    const studentsWithCourses = await dbOperationsDebug.getAllStudentsWithCourses()
    console.log(`✅ Cargados ${studentsWithCourses.length} estudiantes con cursos`)
    
    return NextResponse.json({
      success: true,
      basic: studentsBasic,
      withCourses: studentsWithCourses,
      counts: {
        basic: studentsBasic.length,
        withCourses: studentsWithCourses.length
      }
    })
  } catch (error) {
    console.error('❌ Error en API debug:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}




