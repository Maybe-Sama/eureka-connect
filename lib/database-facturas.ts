/**
 * Operaciones de base de datos para facturas RRSIF
 * Maneja el almacenamiento y recuperación de facturas
 */

import Database from 'better-sqlite3'
import { FacturaRRSIF, ClasePagada } from '@/types'

export class FacturasDatabase {
  private db: Database

  constructor(database: Database) {
    this.db = database
  }

  /**
   * Guarda una factura en la base de datos
   */
  async guardarFactura(factura: FacturaRRSIF): Promise<void> {
    const sql = `
      INSERT INTO facturas_rrsif (
        id, invoice_number, student_id, total, month, status, estado_factura,
        descripcion, created_at, updated_at,
        emisor_nif, emisor_nombre, emisor_direccion, emisor_codigo_postal,
        emisor_municipio, emisor_provincia, emisor_pais, emisor_telefono, emisor_email,
        receptor_nif, receptor_nombre, receptor_direccion, receptor_codigo_postal,
        receptor_municipio, receptor_provincia, receptor_pais, receptor_telefono, receptor_email, receptor_tipo_identificacion,
        serie, numero, fecha_expedicion, hash_registro, timestamp, estado_envio, url_verificacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      factura.id,
      factura.invoiceNumber,
      factura.student_id,
      factura.total,
      factura.month,
      factura.status,
      factura.estado_factura,
      factura.descripcion,
      factura.created_at,
      factura.updated_at,
      factura.datos_fiscales_emisor.nif,
      factura.datos_fiscales_emisor.nombre,
      factura.datos_fiscales_emisor.direccion,
      factura.datos_fiscales_emisor.codigoPostal,
      factura.datos_fiscales_emisor.municipio,
      factura.datos_fiscales_emisor.provincia,
      factura.datos_fiscales_emisor.pais,
      factura.datos_fiscales_emisor.telefono,
      factura.datos_fiscales_emisor.email,
      factura.datos_receptor.nif,
      factura.datos_receptor.nombre,
      factura.datos_receptor.direccion,
      factura.datos_receptor.codigoPostal,
      factura.datos_receptor.municipio,
      factura.datos_receptor.provincia,
      factura.datos_receptor.pais,
      factura.datos_receptor.telefono,
      factura.datos_receptor.email,
      factura.datos_receptor.tipoIdentificacion || 'DNI',
      factura.registro_facturacion.serie,
      factura.registro_facturacion.numero,
      factura.registro_facturacion.fecha_expedicion,
      factura.registro_facturacion.hash_registro,
      factura.registro_facturacion.timestamp,
      factura.registro_facturacion.estado_envio,
      factura.registro_facturacion.url_verificacion
    ]

    try {
      this.db.prepare(sql).run(params)
      console.log('Factura guardada con ID:', factura.id)
    } catch (err) {
      console.error('Error guardando factura:', err)
      throw err
    }
  }

  /**
   * Guarda las clases de una factura
   */
  async guardarClasesFactura(facturaId: string, clases: ClasePagada[]): Promise<void> {
    if (clases.length === 0) {
      return
    }

    const sql = `
      INSERT INTO factura_clases (
        factura_id, clase_id, fecha, hora_inicio, hora_fin,
        duracion, asignatura, precio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    const stmt = this.db.prepare(sql)

    try {
      for (const clase of clases) {
        stmt.run([
          facturaId,
          clase.id,
          clase.fecha,
          clase.hora_inicio,
          clase.hora_fin,
          clase.duracion,
          clase.asignatura,
          clase.precio
        ])
      }
    } catch (err) {
      console.error('Error guardando clases de factura:', err)
      throw err
    }
  }

  /**
   * Obtiene todas las facturas
   */
  async obtenerFacturas(): Promise<FacturaRRSIF[]> {
    const sql = `
      SELECT 
        f.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.email as student_email,
        s.phone as student_phone,
        s.address as student_address,
        s.city as student_city,
        s.province as student_province,
        s.postal_code as student_postal_code,
        s.country as student_country,
        s.nif as student_nif
      FROM facturas_rrsif f
      LEFT JOIN students s ON f.student_id = s.id
      ORDER BY f.created_at DESC
    `

    try {
      const rows = this.db.prepare(sql).all() as any[]
      const facturas = rows.map(row => this.mapearFilaAFactura(row))
      return facturas
    } catch (err) {
      console.error('Error obteniendo facturas:', err)
      throw err
    }
  }

  /**
   * Obtiene una factura por ID
   */
  async obtenerFacturaPorId(id: string): Promise<FacturaRRSIF | null> {
    const sql = `
      SELECT 
        f.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.email as student_email,
        s.phone as student_phone,
        s.address as student_address,
        s.city as student_city,
        s.province as student_province,
        s.postal_code as student_postal_code,
        s.country as student_country,
        s.nif as student_nif
      FROM facturas_rrsif f
      LEFT JOIN students s ON f.student_id = s.id
      WHERE f.id = ?
    `

    try {
      const row = this.db.prepare(sql).get(id) as any
      if (row) {
        return this.mapearFilaAFactura(row)
      }
      return null
    } catch (err) {
      console.error('Error obteniendo factura:', err)
      throw err
    }
  }

  /**
   * Obtiene las clases de una factura
   */
  async obtenerClasesFactura(facturaId: string): Promise<ClasePagada[]> {
    const sql = `
      SELECT * FROM factura_clases 
      WHERE factura_id = ?
      ORDER BY fecha, hora_inicio
    `

    try {
      const rows = this.db.prepare(sql).all(facturaId) as any[]
      const clases = rows.map(row => ({
        id: row.clase_id,
        fecha: row.fecha,
        hora_inicio: row.hora_inicio,
        hora_fin: row.hora_fin,
        duracion: row.duracion,
        asignatura: row.asignatura,
        precio: row.precio,
        payment_status: 'paid' as const,
        payment_date: row.fecha,
        studentId: '', // Se llenará desde la factura
        student: {} as any, // Se llenará desde la factura
        courseId: '',
        course: {} as any
      }))
      return clases
    } catch (err) {
      console.error('Error obteniendo clases de factura:', err)
      throw err
    }
  }

  /**
   * Actualiza el estado de una factura
   */
  async actualizarEstadoFactura(id: string, estado: string): Promise<void> {
    const sql = `
      UPDATE facturas_rrsif 
      SET estado_factura = ?, updated_at = datetime('now')
      WHERE id = ?
    `

    try {
      this.db.prepare(sql).run(estado, id)
    } catch (err) {
      console.error('Error actualizando estado de factura:', err)
      throw err
    }
  }

  /**
   * Elimina una factura
   */
  async eliminarFactura(id: string): Promise<void> {
    const sql = 'DELETE FROM facturas_rrsif WHERE id = ?'

    try {
      this.db.prepare(sql).run(id)
    } catch (err) {
      console.error('Error eliminando factura:', err)
      throw err
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto FacturaRRSIF
   */
  private mapearFilaAFactura(row: any): FacturaRRSIF {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      student_id: row.student_id,
      student: {
        id: row.student_id,
        firstName: row.student_first_name || 'Estudiante',
        lastName: row.student_last_name || 'Sin apellido',
        email: row.student_email || '',
        phone: row.student_phone || '',
        address: row.student_address || '',
        city: row.student_city || '',
        province: row.student_province || '',
        postalCode: row.student_postal_code || '',
        country: row.student_country || 'España',
        nif: row.student_nif || '',
        birthDate: '',
        courseId: '1',
        studentCode: `STU-${row.student_id}`,
        receptorNombre: '',
        receptorApellidos: '',
        receptorEmail: '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      receptor: {
        nif: row.receptor_nif,
        nombre: row.receptor_nombre,
        direccion: row.receptor_direccion,
        codigoPostal: row.receptor_codigo_postal,
        municipio: row.receptor_municipio,
        provincia: row.receptor_provincia,
        pais: row.receptor_pais,
        telefono: row.receptor_telefono,
        email: row.receptor_email,
        tipoIdentificacion: row.receptor_tipo_identificacion || 'DNI'
      },
      classes: [], // Se cargará por separado
      total: row.total,
      month: row.month,
      status: row.status,
      estado_factura: row.estado_factura,
      descripcion: row.descripcion,
      datos_fiscales_emisor: {
        nif: row.emisor_nif,
        nombre: row.emisor_nombre,
        direccion: row.emisor_direccion,
        codigoPostal: row.emisor_codigo_postal,
        municipio: row.emisor_municipio,
        provincia: row.emisor_provincia,
        pais: row.emisor_pais,
        telefono: row.emisor_telefono,
        email: row.emisor_email
      },
      datos_receptor: {
        nif: row.receptor_nif,
        nombre: row.receptor_nombre,
        direccion: row.receptor_direccion,
        codigoPostal: row.receptor_codigo_postal,
        municipio: row.receptor_municipio,
        provincia: row.receptor_provincia,
        pais: row.receptor_pais,
        telefono: row.receptor_telefono,
        email: row.receptor_email
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      registro_facturacion: {
        serie: row.serie,
        numero: row.numero,
        fecha_expedicion: row.fecha_expedicion,
        hash_registro: row.hash_registro,
        timestamp: row.timestamp,
        estado_envio: row.estado_envio,
        url_verificacion: row.url_verificacion
      }
    }
  }
}
