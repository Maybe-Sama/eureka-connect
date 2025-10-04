import { NextRequest, NextResponse } from 'next/server'
import { generarPDFFactura } from '@/lib/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    // Crear una factura de prueba
    const facturaPrueba = {
      id: 'test-factura-1',
      invoiceNumber: 'FAC-0001',
      student_id: '1',
      student: {
        id: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@email.com',
        phone: '+34 91 123 45 67',
        address: 'Calle Test 123',
        city: 'Madrid',
        province: 'Madrid',
        postalCode: '28001',
        country: 'España',
        nif: '12345678A',
        birthDate: '1990-01-01',
        courseId: '1',
        studentCode: 'STU-001',
        receptorNombre: 'Juan',
        receptorApellidos: 'Pérez',
        receptorEmail: 'juan@email.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      receptor: {
        nif: '12345678A',
        nombre: 'Juan Pérez',
        direccion: 'Calle Test 123',
        codigoPostal: '28001',
        municipio: 'Madrid',
        provincia: 'Madrid',
        pais: 'España',
        telefono: '+34 91 123 45 67',
        email: 'juan@email.com'
      },
      classes: [{
        id: '1',
        fecha: '2024-01-15',
        hora_inicio: '10:00',
        hora_fin: '11:00',
        duracion: 60,
        asignatura: 'Matemáticas',
        precio: 25.00,
        payment_status: 'paid' as const,
        payment_date: '2024-01-15',
        studentId: '1',
        student: {} as any,
        courseId: '1',
        course: {} as any
      }],
      total: 25.00,
      month: 'enero',
      status: 'generated',
      estado_factura: 'provisional',
      descripcion: 'Clase de prueba',
      datos_fiscales_emisor: {
        nif: '87654321B',
        nombre: 'EURELA CONNECT S.L.',
        direccion: 'Calle Principal 123',
        codigoPostal: '28001',
        municipio: 'Madrid',
        provincia: 'Madrid',
        pais: 'España',
        telefono: '+34 91 123 45 67',
        email: 'info@eurela-connect.com'
      },
      datos_receptor: {
        nif: '12345678A',
        nombre: 'Juan Pérez',
        direccion: 'Calle Test 123',
        codigoPostal: '28001',
        municipio: 'Madrid',
        provincia: 'Madrid',
        pais: 'España',
        telefono: '+34 91 123 45 67',
        email: 'juan@email.com'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      registro_facturacion: {
        serie: 'FAC',
        numero: '0001',
        fecha_expedicion: new Date().toISOString(),
        hash_registro: 'hash-test-123',
        timestamp: new Date().toISOString(),
        estado_envio: 'pendiente',
        url_verificacion: 'https://verifactu.aeat.es/verifactu/hash-test-123'
      }
    }

    console.log('Generando PDF de prueba...')
    
    // Generar PDF
    const pdfDoc = await generarPDFFactura(facturaPrueba as any)
    const pdfBuffer = pdfDoc.output('arraybuffer')
    
    console.log('PDF generado exitosamente, tamaño:', pdfBuffer.byteLength, 'bytes')

    return NextResponse.json({
      success: true,
      message: 'PDF generado exitosamente',
      size: pdfBuffer.byteLength
    })

  } catch (error) {
    console.error('Error generando PDF de prueba:', error)
    return NextResponse.json(
      { 
        error: 'Error generando PDF',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}










