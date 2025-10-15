// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'

export async function GET() {
  try {
    const courses = await dbOperations.getAllCourses()
    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API POST /api/courses llamada') // Log de depuración
    const body = await request.json()
    console.log('Datos recibidos:', body) // Log de depuración
    const { name, description, subject, price, shared_class_price, duration, color, is_active } = body

    if (!name || !price || !duration || !color) {
      console.log('Faltan campos obligatorios:', { name, price, duration, color }) // Log de depuración
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    console.log('Creando curso en base de datos...') // Log de depuración
    const courseId = await dbOperations.createCourse({
      name,
      description,
      subject,
      price: Number(price),
      shared_class_price: shared_class_price ? Number(shared_class_price) : null,
      duration: Number(duration),
      color,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    })

    console.log('Curso creado con ID:', courseId) // Log de depuración
    return NextResponse.json({ id: courseId, message: 'Curso creado exitosamente' })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

