import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await dbOperations.getCourseById(Number(params.id))
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }
    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, subject, price, shared_class_price, duration, color, is_active } = body

    if (!name || !price || !duration || !color) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const result = await dbOperations.updateCourse(Number(params.id), {
      name,
      description,
      subject,
      price: Number(price),
      shared_class_price: shared_class_price ? Number(shared_class_price) : null,
      duration: Number(duration),
      color,
      is_active: Boolean(is_active)
    })

    return NextResponse.json({ message: 'Curso actualizado exitosamente' })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await dbOperations.deleteCourse(Number(params.id))
    
    if (result === undefined) {
      return NextResponse.json({ error: 'Error al eliminar el curso' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Curso eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting course:', error)
    
    // Si el error es sobre restricción de clave foránea, devolver mensaje específico
    if (error instanceof Error && error.message.includes('estudiantes asociados')) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el curso porque tiene estudiantes asociados. Primero elimina o reasigna los estudiantes.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


