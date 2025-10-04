import { supabase } from './supabase'

export const dbOperationsDebug = {
  // Versión simplificada para diagnosticar
  async getAllStudents() {
    try {
      console.log('🔍 Intentando cargar estudiantes...')
      
      // Primero probar sin relación
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('first_name')

      if (error) {
        console.error('❌ Error en consulta básica:', error)
        throw error
      }

      console.log(`✅ Cargados ${data?.length || 0} estudiantes sin relación`)
      
      // Mapear datos básicos
      return (data || []).map((student: any) => ({
        ...student,
        course_name: 'Curso por defecto',
        course_price: 0,
        course_color: '#6366f1'
      }))
      
    } catch (error) {
      console.error('❌ Error en getAllStudents:', error)
      throw error
    }
  },

  // Versión con relación para probar
  async getAllStudentsWithCourses() {
    try {
      console.log('🔍 Intentando cargar estudiantes con cursos...')
      
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
        console.error('❌ Error en consulta con relación:', error)
        throw error
      }

      console.log(`✅ Cargados ${data?.length || 0} estudiantes con relación`)
      
      return (data || []).map((student: any) => ({
        ...student,
        course_name: student.courses?.name || 'Curso no encontrado',
        course_price: student.courses?.price || 0,
        course_color: student.courses?.color || '#6366f1'
      }))
      
    } catch (error) {
      console.error('❌ Error en getAllStudentsWithCourses:', error)
      throw error
    }
  }
}




