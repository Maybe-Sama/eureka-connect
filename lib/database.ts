import { supabaseAdmin as supabase } from './supabase-server'

export const dbOperations = {
  // Courses
  async getAllCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching courses:', error)
      throw error
    }

    return data || []
  },

  async getCourseById(id: number) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching course:', error)
      return null
    }

    return data
  },

  async createCourse(course: any) {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      throw error
    }

    return data?.id || 0
  },

  async updateCourse(id: number, course: any) {
    const { error } = await supabase
      .from('courses')
      .update(course)
      .eq('id', id)

    if (error) {
      console.error('Error updating course:', error)
      throw error
    }
  },

  async deleteCourse(id: number) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting course:', error)
      throw error
    }
  },

  // Students
  async getAllStudents() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        courses:course_id (
          id,
          name,
          price,
          shared_class_price,
          color
        )
      `)
      .order('first_name')

    if (error) {
      console.error('Error fetching students:', error)
      throw error
    }

    return (data || []).map((student: any) => ({
      ...student,
      course_name: student.courses?.name || 'Curso no encontrado',
      course_price: student.courses?.price || 0,
      course_shared_price: student.courses?.shared_class_price || null,
      course_color: student.courses?.color || '#6366f1' // Color por defecto si no hay curso
    }))
  },

  async getStudentById(id: number) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        courses:course_id (
          id,
          name,
          price,
          shared_class_price,
          color
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching student:', error)
      return null
    }

    if (!data) return null

    return {
      ...data,
      course_name: data.courses?.name || 'Curso no encontrado',
      course_price: data.courses?.price || 0,
      course_shared_price: data.courses?.shared_class_price || null,
      course_color: data.courses?.color || '#000000'
    }
  },

  async createStudent(student: any) {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      throw error
    }

    console.log('Database: Student created successfully with ID:', data?.id)
    return data?.id || 0
  },

  async updateStudent(id: number, student: any) {
    const { error } = await supabase
      .from('students')
      .update(student)
      .eq('id', id)

    if (error) {
      console.error('Error updating student:', error)
      throw error
    }
  },

  async deleteStudent(id: number) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting student:', error)
      throw error
    }
  },

  // Classes
  async getAllClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        students!classes_student_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          province,
          postal_code,
          country,
          dni,
          nif,
          birth_date,
          course_id,
          student_code,
          has_shared_pricing,
          receptor_nombre,
          receptor_apellidos,
          receptor_email,
          created_at,
          updated_at
        ),
        courses:course_id (
          id,
          name,
          description,
          price,
          shared_class_price,
          duration,
          color,
          is_active,
          created_at,
          updated_at
        )
      `)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
      throw error
    }

    // Mapear los datos para incluir student_name y course_name
    const mappedData = (data || []).map(cls => ({
      ...cls,
      student_name: cls.students ? `${cls.students.first_name} ${cls.students.last_name}` : null,
      course_name: cls.courses?.name || null,
      course_color: cls.courses?.color || null
    }))

    return mappedData
  },

  async getClassById(id: number) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        students:student_id (
          id,
          first_name,
          last_name
        ),
        courses:course_id (
          id,
          name,
          color
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching class:', error)
      return null
    }

    if (!data) return null

    return {
      ...data,
      student_name: `${data.students?.first_name || ''} ${data.students?.last_name || ''}`.trim(),
      course_name: data.courses?.name || 'Curso no encontrado'
    }
  },

  async createClass(cls: any) {
    const { data, error } = await supabase
      .from('classes')
      .insert(cls)
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      throw error
    }

    return data?.id || 0
  },

  async updateClass(id: number, cls: any) {
    const { error } = await supabase
      .from('classes')
      .update(cls)
      .eq('id', id)

    if (error) {
      console.error('Error updating class:', error)
      throw error
    }
  },

  async deleteClass(id: number) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting class:', error)
      throw error
    }
  },

  // Funciones para manejar status_invoice
  async markClassesAsInvoiced(classIds: number[]) {
    const { error } = await supabase
      .from('classes')
      .update({ status_invoice: true })
      .in('id', classIds)

    if (error) {
      console.error('Error marking classes as invoiced:', error)
      throw error
    }
  },

  async unmarkClassesAsInvoiced(classIds: number[]) {
    const { error } = await supabase
      .from('classes')
      .update({ status_invoice: false })
      .in('id', classIds)

    if (error) {
      console.error('Error unmarking classes as invoiced:', error)
      throw error
    }
  },

  async getClassesForInvoice() {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        students!classes_student_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          province,
          postal_code,
          country,
          dni,
          nif,
          birth_date,
          course_id,
          student_code,
          has_shared_pricing,
          receptor_nombre,
          receptor_apellidos,
          receptor_email,
          created_at,
          updated_at
        ),
        courses:course_id (
          id,
          name,
          description,
          price,
          shared_class_price,
          duration,
          color,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('status_invoice', false)
      .in('payment_status', ['paid'])
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching classes for invoice:', error)
      throw error
    }

    return data || []
  },

  // Invoices
  async getAllInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }

    return data || []
  },

  async getInvoiceById(id: number) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        students:student_id (
          id,
          first_name,
          last_name
        ),
        courses:course_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return null
    }

    if (!data) return null

    return {
      ...data,
      student_name: `${data.students?.first_name || ''} ${data.students?.last_name || ''}`.trim(),
      course_name: data.courses?.name || 'Curso no encontrado'
    }
  },

  async createInvoice(invoice: any) {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      throw error
    }

    return data?.id || 0
  },

  async updateInvoice(id: number, invoice: any) {
    const { error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)

    if (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
  },

  async deleteInvoice(id: number) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  }
}
