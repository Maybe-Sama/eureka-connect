'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StudentDashboard() {
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()
  const [studentData, setStudentData] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !isStudent) {
      router.push('/login')
    }
  }, [loading, isStudent, router])

  useEffect(() => {
    if (isStudent && user?.studentId) {
      loadStudentData()
    }
  }, [isStudent, user?.studentId])

  const loadStudentData = async () => {
    try {
      // Cargar datos del estudiante
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', user?.studentId)
        .single()

      if (studentError) {
        console.error('Error loading student:', studentError)
        return
      }

      setStudentData(student)

      // Cargar clases del estudiante
      const { data: studentClasses, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('student_id', user?.studentId)
        .order('date', { ascending: false })
        .limit(10)

      if (classesError) {
        console.error('Error loading classes:', classesError)
        return
      }

      setClasses(studentClasses || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isStudent) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Bienvenido, {user?.studentName}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/logout')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Información Personal
                </h3>
                {studentData && (
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {studentData.first_name} {studentData.last_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{studentData.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                      <dd className="mt-1 text-sm text-gray-900">{studentData.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Código de Estudiante</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{studentData.student_code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(studentData.start_date).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo de Contacto</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">
                        {studentData.parent_contact_type}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>

            {/* Próximas Clases */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Próximas Clases
                </h3>
                {classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.slice(0, 5).map((cls, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(cls.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cls.start_time} - {cls.end_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cls.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : cls.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cls.status === 'completed' ? 'Completada' : 
                             cls.status === 'cancelled' ? 'Cancelada' : 'Programada'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay clases programadas</p>
                )}
              </div>
            </div>

            {/* Horario Fijo */}
            {studentData?.fixed_schedule && (
              <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Mi Horario Fijo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {JSON.parse(studentData.fixed_schedule).map((schedule: any, index: number) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              {schedule.subject}
                            </p>
                            <p className="text-xs text-blue-700">
                              {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][schedule.day_of_week]}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-900">
                              {schedule.start_time}
                            </p>
                            <p className="text-xs text-blue-700">
                              {schedule.end_time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
