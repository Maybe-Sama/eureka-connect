import { NextRequest, NextResponse } from 'next/server'
import { generarPDFFactura } from '@/lib/pdf-generator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facturaId = searchParams.get('id')

    if (!facturaId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // En un entorno real, aquí se obtendría la factura de la base de datos
    // Por ahora, simulamos una factura de prueba
    const facturaData = {
      id: facturaId,
      invoiceNumber: `FAC-${facturaId.slice(-4)}`,
      student_id: 'test-student',
      student: {
        id: 'test-student',
        firstName: 'Estudiante',
        lastName: 'Test',
        email: 'test@email.com'
      },
      receptor: {
        nif: '12345678A',
        nombre: 'Estudiante Test',
        direccion: 'Calle Test 123',
        codigoPostal: '28001',
        municipio: 'Madrid',
        provincia: 'Madrid',
        pais: 'España',
        telefono: '600123456',
        email: 'test@email.com'
      },
      classes: [{
        id: 'clase-1',
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '10:00',
        hora_fin: '11:00',
        duracion: 60,
        asignatura: 'Clase particular',
        precio: 15.00
      }],
      total: 15.00,
      month: new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      }),
      status: 'generated',
      estado_factura: 'provisional',
      descripcion: 'Clase particular - 1 clase',
      datos_fiscales_emisor: {
        nif: '12345678B',
        nombre: 'EUREKA CORP',
        direccion: 'Calle Empresa 123',
        codigoPostal: '28001',
        municipio: 'Madrid',
        provincia: 'Madrid',
        pais: 'España',
        telefono: '910123456',
        email: 'info@eurekacorp.com'
      },
      datos_receptor: {
        nif: '12345678A',
        nombre: 'Estudiante Test',
        direccion: 'Calle Test 123',
        codigoPostal: '28001',
        municipio: 'Madrid',
        provincia: 'Madrid',
        pais: 'España',
        telefono: '600123456',
        email: 'test@email.com'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      descripcion: 'Clase particular - 1 clase',
      registro_facturacion: {
        serie: 'FAC',
        numero: facturaId.slice(-4),
        fecha_expedicion: new Date().toISOString(),
        fecha_operacion: new Date().toISOString(),
        hash_registro: `hash-${Date.now()}`,
        timestamp: new Date().toISOString(),
        estado_envio: 'pendiente',
        url_verificacion: `https://verifactu.aeat.es/verifactu/hash-${Date.now()}`,
        base_imponible: 12.40,
        importe_total: 15.00,
        desglose_iva: [{
          tipo: 21,
          cuota: 2.60,
          base: 12.40
        }]
      }
    }

    // Generar PDF
    const pdfDoc = await generarPDFFactura(facturaData as any)
    const pdfBuffer = pdfDoc.output('arraybuffer')

    // Devolver PDF como respuesta
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${facturaData.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { 
        error: 'Error generando PDF',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
