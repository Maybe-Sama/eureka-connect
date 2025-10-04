import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'

export async function GET() {
  try {
    const classes = await dbOperations.getAllClasses()
    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, course_id, start_time, end_time, duration, date, price, notes, subject } = body

    if (!student_id || !course_id || !start_time || !end_time || !duration || !date) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Calcular precio si no se proporciona
    let calculatedPrice = Number(price) || 0
    if (calculatedPrice === 0) {
      const course = await dbOperations.getCourseById(Number(course_id))
      if (course) {
        calculatedPrice = (Number(duration) / 60) * course.price
      }
    }

    const classId = await dbOperations.createClass({
      student_id: Number(student_id),
      course_id: Number(course_id),
      start_time,
      end_time,
      duration: Number(duration),
      day_of_week: Number(body.day_of_week) || 1, // Use provided day_of_week or default to 1
      date,
      subject: subject || null,
      is_recurring: body.is_recurring || false, // Default to false for scheduled classes
      price: calculatedPrice,
      notes
    })

    return NextResponse.json({ id: classId, message: 'Clase creada exitosamente' })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')
    
    if (!ids) {
      return NextResponse.json({ error: 'IDs de clases requeridos' }, { status: 400 })
    }

    const classIds = ids.split(',').map(id => Number(id.trim()))
    
    // Eliminar cada clase
    for (const classId of classIds) {
      const success = await dbOperations.deleteClass(classId)
      if (success === undefined) {
        console.error(`Error deleting class ${classId}`)
      }
    }

    return NextResponse.json({ message: `${classIds.length} clases eliminadas exitosamente` })
  } catch (error) {
    console.error('Error deleting classes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

