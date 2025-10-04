import { supabase } from './supabase-simple'

// Type aliases for better readability
type Course = any
type Student = any
type Class = any

export const dbOperations = {
  // Courses
  async getAllCourses(): Promise<Course[]> {
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

  async getCourseById(id: number): Promise<Course | null> {
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

  async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { data, error } = await supabase
      .from('courses')
      .insert(course as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      throw error
    }

    return (data as any)?.id || 0
  },

  async updateCourse(id: number, course: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .update(course as any)
      .eq('id', id)

    if (error) {
      console.error('Error updating course:', error)
      throw error
    }
  },

  async deleteCourse(id: number): Promise<void> {
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
  async getAllStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        courses:course_id (
          id,
          name,
          price,
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
      course_name: (student as any).courses?.name || 'Curso no encontrado',
      course_price: (student as any).courses?.price || 0,
      course_color: (student as any).courses?.color || '#000000'
    }))
  },

  async getStudentById(id: number): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        courses:course_id (
          id,
          name,
          price,
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
      ...(data as any),
      course_name: (data as any).courses?.name || 'Curso no encontrado',
      course_price: (data as any).courses?.price || 0,
      course_color: (data as any).courses?.color || '#000000'
    }
  },

  async createStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { data, error } = await supabase
      .from('students')
      .insert(student as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      throw error
    }

    console.log('Database: Student created successfully with ID:', (data as any)?.id)
    return (data as any)?.id || 0
  },

  async updateStudent(id: number, student: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update(student as any)
      .eq('id', id)

    if (error) {
      console.error('Error updating student:', error)
      throw error
    }
  },

  async deleteStudent(id: number): Promise<void> {
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
  async getAllClasses(): Promise<Class[]> {
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
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
      throw error
    }

    return (data || []).map((cls: any) => ({
      ...cls,
      student_name: `${(cls as any).students?.first_name || ''} ${(cls as any).students?.last_name || ''}`.trim(),
      course_name: (cls as any).courses?.name || 'Curso no encontrado'
    }))
  },

  async getClassById(id: number): Promise<Class | null> {
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
      ...(data as any),
      student_name: `${(data as any).students?.first_name || ''} ${(data as any).students?.last_name || ''}`.trim(),
      course_name: (data as any).courses?.name || 'Curso no encontrado'
    }
  },

  async createClass(cls: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { data, error } = await supabase
      .from('classes')
      .insert(cls as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      throw error
    }

    return (data as any)?.id || 0
  },

  async updateClass(id: number, cls: Partial<Omit<Class, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .update(cls as any)
      .eq('id', id)

    if (error) {
      console.error('Error updating class:', error)
      throw error
    }
  },

  async deleteClass(id: number): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting class:', error)
      throw error
    }
  },

  // Invoices
  async getAllInvoices(): Promise<any[]> {
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
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }

    return (data || []).map((invoice: any) => ({
      ...invoice,
      student_name: `${(invoice as any).students?.first_name || ''} ${(invoice as any).students?.last_name || ''}`.trim(),
      course_name: (invoice as any).courses?.name || 'Curso no encontrado'
    }))
  },

  async getInvoiceById(id: number): Promise<any | null> {
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
      ...(data as any),
      student_name: `${(data as any).students?.first_name || ''} ${(data as any).students?.last_name || ''}`.trim(),
      course_name: (data as any).courses?.name || 'Curso no encontrado'
    }
  },

  async createInvoice(invoice: any): Promise<number> {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      throw error
    }

    return (data as any)?.id || 0
  },

  async updateInvoice(id: number, invoice: any): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update(invoice as any)
      .eq('id', id)

    if (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
  },

  async deleteInvoice(id: number): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  },

  // Class tracking
  async generateStudentMonthlyTracking(studentId: number, month: string): Promise<any[]> {
    try {
      // Get student data
      const student = await this.getStudentById(studentId)
      if (!student) {
        throw new Error('Student not found')
      }

      // Get classes for the month
      const startDate = new Date(month + '-01')
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

      const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')

      if (error) {
        console.error('Error fetching classes for tracking:', error)
        throw error
      }

      // Generate tracking data
      const trackingData = []
      
      if (student.fixed_schedule) {
        try {
          const fixedSchedule = JSON.parse(student.fixed_schedule)
          
          for (const schedule of fixedSchedule) {
            const currentDate = new Date(startDate)
            
            while (currentDate <= endDate) {
              const dayOfWeek = currentDate.getDay()
              
              if (dayOfWeek === schedule.day_of_week) {
                // Check if there's already a class for this date
                const existingClass = classes?.find(cls => 
                  (cls as any).date === currentDate.toISOString().split('T')[0] &&
                  (cls as any).student_id === studentId
                )
                
                let classId = 0
                let classDate = currentDate.toISOString().split('T')[0]
                
                if (existingClass) {
                  classId = (existingClass as any).id
                  classDate = (existingClass as any).date
                } else {
                  // Create new class
                  const newClass = {
                    student_id: studentId,
                    student_name: `${student.first_name} ${student.last_name}`,
                    course_name: (student as any).courses?.name || 'Curso no encontrado',
                    course_color: (student as any).courses?.color || '#000000',
                    day_of_week: schedule.day_of_week,
                    start_time: schedule.start_time,
                    end_time: schedule.end_time,
                    subject: schedule.subject,
                    date: currentDate.toISOString().split('T')[0],
                    price: (student as any).courses?.price || 0,
                    is_recurring: true
                  }
                  
                  try {
                    classId = await this.createClass(newClass)
                  } catch (error) {
                    console.error(`Error creating class for student ${studentId}:`, error)
                  }
                }
                
                trackingData.push({
                  id: classId,
                  student_id: studentId,
                  student_name: `${student.first_name} ${student.last_name}`,
                  course_name: (student as any).courses?.name || 'Curso no encontrado',
                  course_color: (student as any).courses?.color || '#000000',
                  day_of_week: schedule.day_of_week,
                  start_time: schedule.start_time,
                  end_time: schedule.end_time,
                  subject: schedule.subject,
                  date: classDate,
                  price: (student as any).courses?.price || 0,
                  is_recurring: true
                })
              }
              
              currentDate.setDate(currentDate.getDate() + 1)
            }
          }
        } catch (error) {
          console.error(`Error parsing fixed schedule for student ${studentId}:`, error)
        }
      }

      return trackingData
    } catch (error) {
      console.error('Error generating student monthly tracking:', error)
      throw error
    }
  },

  // Helper function to transform class data
  transformClassData(cls: any): any {
    return {
      id: cls.id,
      student_id: cls.student_id,
      student_name: `${(cls as any).students?.first_name || ''} ${(cls as any).students?.last_name || ''}`.trim(),
      course_name: (cls as any).courses?.name || 'Curso no encontrado',
      course_color: (cls as any).courses?.color || '#000000',
      day_of_week: cls.day_of_week,
      start_time: cls.start_time,
      end_time: cls.end_time,
      duration: cls.duration,
      subject: cls.subject,
      date: cls.date,
      price: cls.price,
      is_recurring: cls.is_recurring
    }
  }
}
