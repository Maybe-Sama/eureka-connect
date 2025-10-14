'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  BookOpen,
  Clock,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  User,
  Monitor,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { SimpleWeeklyScheduleSelector } from '@/components/students/SimpleWeeklyScheduleSelector'
import { toast } from 'sonner'
import { generateStudentCode, formatStudentCode, parseFixedSchedule } from '@/lib/utils'

interface TimeSlot {
  day_of_week: number
  start_time: string
  end_time: string
  course_id: string
  course_name: string
  price?: number
}

interface Course {
  id: number
  name: string
  price: number
  shared_class_price?: number
  color: string
  is_active: boolean
}

interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  birth_date: string
  phone: string
  parent_phone?: string
  parent_contact_type?: 'padre' | 'madre' | 'tutor'
  course_id: number
  course_name: string
  course_price: number
  course_shared_price?: number
  course_color: string
  student_code: string
  fixed_schedule?: string
  start_date: string
  has_shared_pricing?: boolean
  // Campos fiscales para facturación RRSIF
  dni?: string
  nif?: string
  address?: string
  postal_code?: string
  city?: string
  province?: string
  country?: string
  // Campos del receptor (padre/madre/tutor)
  receptor_nombre?: string
  receptor_apellidos?: string
  receptor_email?: string
  // Campo para enlace a pizarra digital
  digital_board_link?: string
  created_at: string
  updated_at: string
}

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCourse, setFilterCourse] = useState('')

  // Fetch data from database
  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch students
      const studentsResponse = await fetch('/api/students')
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData)
      }

      // Fetch courses
      const coursesResponse = await fetch('/api/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        console.log('Courses loaded:', coursesData)
        setCourses(coursesData)
      } else {
        console.error('Error loading courses:', coursesResponse.status, coursesResponse.statusText)
      }

      // Fetch classes
      const classesResponse = await fetch('/api/classes')
      if (classesResponse.ok) {
        const classesData = await classesResponse.json()
        setAllClasses(classesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'course_name' | 'course_price' | 'course_color'> & { schedule: TimeSlot[] }) => {
    try {
      const requestData = {
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        email: studentData.email,
        birth_date: studentData.birth_date,
        phone: studentData.phone,
        parent_phone: studentData.parent_phone,
        parent_contact_type: studentData.parent_contact_type,
        course_id: studentData.course_id,
        student_code: studentData.student_code,
        fixed_schedule: studentData.fixed_schedule,
        start_date: studentData.start_date,
        has_shared_pricing: studentData.has_shared_pricing,
        schedule: studentData.schedule,
        // Datos fiscales
        dni: studentData.dni,
        nif: studentData.nif,
        address: studentData.address,
        postal_code: studentData.postal_code,
        city: studentData.city,
        province: studentData.province,
        country: studentData.country,
        // Datos del receptor
        receptor_nombre: studentData.receptorNombre,
        receptor_apellidos: studentData.receptorApellidos,
        receptor_email: studentData.receptorEmail,
        // Enlace a pizarra digital
        digital_board_link: studentData.digital_board_link
      }
      
      console.log('Sending student data:', requestData)
      
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        toast.success('Alumno creado exitosamente')
        setIsAddModalOpen(false)
        fetchData() // Refresh the data
      } else {
        const error = await response.json()
        console.error('Error creating student:', error)
        toast.error(error.error || 'Error al crear el alumno')
      }
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error('Error al crear el alumno')
    }
  }

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este alumno?')) return

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Alumno eliminado exitosamente')
        fetchData() // Refresh the data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar el alumno')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('Error al eliminar el alumno')
    }
  }

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setIsViewEditModalOpen(true)
  }

  const handleUpdateStudent = async (updatedStudent: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'course_name' | 'course_price' | 'course_color'> & { schedule: TimeSlot[] }) => {
    if (!selectedStudent) return

    try {
      // Update student basic info
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedStudent,
          has_shared_pricing: updatedStudent.has_shared_pricing
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar el alumno')
        return
      }

      // Update student schedule
      if (updatedStudent.schedule && updatedStudent.schedule.length > 0) {
        const scheduleResponse = await fetch(`/api/students/${selectedStudent.id}/schedule`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ schedule: updatedStudent.schedule }),
        })

        if (!scheduleResponse.ok) {
          const error = await scheduleResponse.json()
          toast.error(error.error || 'Error al actualizar el horario')
          return
        }
      }

      toast.success('Alumno actualizado exitosamente')
      setIsViewEditModalOpen(false)
      setSelectedStudent(null)
      fetchData() // Refresh the data
    } catch (error) {
      console.error('Error updating student:', error)
      toast.error('Error al actualizar el alumno')
    }
  }

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = !filterCourse || student.course_id.toString() === filterCourse
    return matchesSearch && matchesCourse
  })

  // Calculate statistics
  const totalStudents = students.length
  
  const monthlyIncome = students.reduce((sum, student) => {
    return sum + calculateStudentMonthlyIncome(student, allClasses)
  }, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Users size={32} className="mr-3 text-primary" />
            Gestión de Alumnos
          </h1>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Añadir Alumno
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-effect rounded-lg p-4 text-center">
            <Users size={24} className="text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-sm text-foreground-muted">Total de Alumnos</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <BookOpen size={24} className="text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{courses.length}</p>
            <p className="text-sm text-foreground-muted">Cursos Disponibles</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">€{monthlyIncome.toFixed(2)}</p>
            <p className="text-sm text-foreground-muted">Ingresos del Mes</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={20} />
            <input
              type="text"
              placeholder="Buscar alumnos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-foreground-muted" size={20} />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los cursos</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
                  {filteredStudents.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onDelete={() => handleDeleteStudent(student.id)}
            onView={handleViewStudent}
            allClasses={allClasses}
          />
        ))}
        </div>

        {/* Add Student Modal */}
        <AddStudentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddStudent}
          courses={courses}
          allClasses={allClasses}
        />

        {/* View/Edit Student Modal */}
        {selectedStudent && (
          <ViewEditStudentModal
            isOpen={isViewEditModalOpen}
            onClose={() => {
              setIsViewEditModalOpen(false)
              setSelectedStudent(null)
            }}
            onSave={handleUpdateStudent}
            student={selectedStudent}
            courses={courses}
            allClasses={allClasses}
          />
        )}
      </motion.div>
    </div>
  )
}

interface StudentCardProps {
  student: Student
  onDelete: () => void
  onView: (student: Student) => void
  allClasses: any[]
}

// Helper function to calculate monthly income for a specific student
const calculateStudentMonthlyIncome = (student: Student, allClasses: any[]) => {
  // Determine which price to use
  const pricePerHour = student.has_shared_pricing && student.course_shared_price 
    ? student.course_shared_price 
    : student.course_price || 0
  
  // If student has a fixed schedule, calculate based on that
  if (student.fixed_schedule) {
    try {
      const fixedSchedule = typeof student.fixed_schedule === 'string' 
        ? JSON.parse(student.fixed_schedule) 
        : student.fixed_schedule
      
      if (fixedSchedule && fixedSchedule.length > 0) {
        // Calculate total hours per week from fixed schedule
        const weeklyHours = fixedSchedule.reduce((total: number, slot: any) => {
          const startTime = slot.start_time
          const endTime = slot.end_time
          
          // Calculate duration in minutes, then convert to hours
          const start = new Date(`2000-01-01T${startTime}`)
          const end = new Date(`2000-01-01T${endTime}`)
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
          
          return total + (durationMinutes / 60) // Convert to hours
        }, 0)
        
        // Calculate monthly income: weekly hours * course price * 4 weeks
        const monthlyIncome = weeklyHours * pricePerHour * 4
        
        console.log(`Fixed schedule calculation for ${student.first_name}: ${weeklyHours}h/week × €${pricePerHour} × 4 weeks = €${monthlyIncome}`)
        
        return monthlyIncome
      }
    } catch (error) {
      console.error(`Error parsing fixed_schedule for student ${student.id}:`, error)
    }
  }
  
  // Fallback: calculate based on existing classes (for students without fixed schedule)
  const studentClasses = allClasses.filter(cls => cls.student_id === student.id)
  
  if (studentClasses.length === 0) {
    return 0 // No classes scheduled
  }
  
  // Calculate total hours per week for recurring classes
  const weeklyHours = studentClasses.reduce((total, cls) => {
    if (cls.is_recurring) {
      // Convert duration from minutes to hours
      const hoursPerClass = cls.duration / 60
      return total + hoursPerClass
    }
    return total
  }, 0)
  
  // Calculate monthly income: weekly hours * course price * 4 weeks
  // (pricePerHour was already defined at the start of the function)
  const monthlyIncome = weeklyHours * pricePerHour * 4
  
  console.log(`Class-based calculation for ${student.first_name}: ${weeklyHours}h/week × €${pricePerHour} × 4 weeks = €${monthlyIncome}`)
  
  return monthlyIncome
}

const StudentCard = ({ student, onDelete, onView, allClasses }: StudentCardProps) => {
  const openDigitalBoard = () => {
    if (student.digital_board_link) {
      window.open(student.digital_board_link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.2 }}
    className="glass-effect card-hover rounded-lg p-5 border border-border relative overflow-hidden group"
    style={{ borderColor: student.course_color }}
  >
    {/* Top border lightning */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: student.course_color }} />
    
    {/* Right border lightning */}
    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: student.course_color }} />
    
    {/* Bottom border lightning */}
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: student.course_color }} />
    
    {/* Left border lightning */}
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: student.course_color }} />
    
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xl font-semibold text-foreground flex items-center">
        <Users size={20} className="mr-2 text-primary" />
        {student.first_name} {student.last_name}
      </h3>
      <div className="flex space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onView(student)} className="text-foreground-muted hover:text-primary">
          <Eye size={16} />
        </Button>
        {student.digital_board_link && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={openDigitalBoard}
            className="text-primary hover:text-primary/80"
            title="Abrir pizarra digital"
          >
            <Monitor size={16} />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive/80">
          <Trash2 size={16} />
        </Button>
      </div>
    </div>

    <div className="space-y-2 mb-4">
      <p className="text-foreground-secondary text-sm flex items-center">
        <BookOpen size={16} className="mr-2" />
        {student.course_name}
      </p>
      <p className="text-foreground-secondary text-sm flex items-center">
        <Mail size={16} className="mr-2" />
        {student.email}
      </p>
      <p className="text-foreground-secondary text-sm flex items-center">
        <Phone size={16} className="mr-2" />
        {student.phone}
      </p>
      {student.parent_phone && (
        <p className="text-foreground-secondary text-sm flex items-center">
          <User size={16} className="mr-2" />
          {student.parent_contact_type === 'madre' ? 'Madre' : 
           student.parent_contact_type === 'tutor' ? 'Tutor/a' : 'Padre'}: {student.parent_phone}
        </p>
      )}
      <div className="mt-2 p-2 bg-background-secondary rounded border border-border">
        <p className="text-xs text-foreground-muted mb-1">Código de Estudiante:</p>
        <p className="text-sm font-mono text-foreground">{formatStudentCode(student.student_code)}</p>
      </div>
      
      {/* Mostrar datos fiscales si están disponibles */}
      {(student.dni || student.nif || student.address) && (
        <div className="mt-2 p-2 bg-info/10 rounded border border-info/20">
          <p className="text-xs text-info mb-1 font-medium">Datos Fiscales:</p>
          <div className="text-xs text-foreground-muted space-y-1">
            {student.dni && <p>DNI: {student.dni}</p>}
            {student.nif && <p>NIF: {student.nif}</p>}
            {student.address && <p>Dirección: {student.address}</p>}
            {student.city && <p>Ciudad: {student.city}</p>}
          </div>
        </div>
      )}
      {/* Mostrar horarios fijos o clases */}
      {(student.fixed_schedule || allClasses.filter(cls => cls.student_id === student.id).length > 0) && (
        <div className="mt-2 p-2 bg-background-secondary rounded border border-border">
          <p className="text-xs text-foreground-muted mb-1">
            {student.fixed_schedule ? 'Horarios Fijos:' : 'Clases Programadas:'}
          </p>
          <div className="space-y-1">
            {(() => {
              // Si tiene fixed_schedule, mostrarlo
              if (student.fixed_schedule) {
                try {
                  const schedule = typeof student.fixed_schedule === 'string' 
                    ? JSON.parse(student.fixed_schedule) 
                    : student.fixed_schedule
                  return schedule.map((slot: any, index: number) => (
                    <div key={index} className="text-xs text-foreground">
                      <span className="font-medium">
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][slot.day_of_week - 1]}
                      </span>
                      : {slot.start_time} - {slot.end_time}
                      {slot.subject && <span className="text-foreground-muted"> ({slot.subject})</span>}
                    </div>
                  ))
                } catch (error) {
                  return <div className="text-xs text-foreground-muted">Error al cargar horarios</div>
                }
              } else {
                // Si no tiene fixed_schedule, mostrar clases individuales
                const studentClasses = allClasses.filter(cls => cls.student_id === student.id)
                return studentClasses.map((cls: any, index: number) => (
                  <div key={index} className="text-xs text-foreground">
                    <span className="font-medium">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][cls.day_of_week - 1]}
                    </span>
                    : {cls.start_time} - {cls.end_time}
                    {cls.subject && <span className="text-foreground-muted"> ({cls.subject})</span>}
                    <span className="text-foreground-muted ml-1">({cls.date})</span>
                  </div>
                ))
              }
            })()}
          </div>
        </div>
      )}
    </div>

    <div className="flex justify-between items-center pt-3 border-t border-border">
      <div>
        <p className="text-sm text-foreground-muted">Precio / hora</p>
        <p className="text-lg font-bold text-foreground">
          €{(student.has_shared_pricing && student.course_shared_price 
            ? student.course_shared_price 
            : student.course_price || 0).toFixed(2)}
        </p>
        {student.has_shared_pricing && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info/20 text-info border border-info/30 mt-1">
            Clase Compartida
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-foreground-muted">Ingreso mensual</p>
        <p className="text-lg font-bold text-foreground">€{calculateStudentMonthlyIncome(student, allClasses).toFixed(2)}</p>
      </div>
    </div>
  </motion.div>
  )
}

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (student: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'course_name' | 'course_price' | 'course_color'> & { schedule: TimeSlot[] }) => void
  courses: Course[]
  allClasses: any[]
}

const AddStudentModal = ({ isOpen, onClose, onSave, courses, allClasses }: AddStudentModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    phone: '',
    parentPhone: '',
    parentContactType: 'padre',
    courseId: '',
    startDate: '',
    hasSharedPricing: false,
    // Campos fiscales
    dni: '',
    address: '',
    postalCode: '',
    city: '',
    province: '',
    country: 'España',
    // Campos del receptor (padre/madre/tutor)
    receptorNombre: '',
    receptorApellidos: '',
    receptorEmail: '',
    // Campo para enlace a pizarra digital
    digitalBoardLink: ''
  })
  const [selectedSchedule, setSelectedSchedule] = useState<TimeSlot[]>([])
  const [studentCode, setStudentCode] = useState('')
  
  // Estados para el tipo de documento
  const [documentType, setDocumentType] = useState<'dni' | 'nif'>('dni')
  const [documentNumber, setDocumentNumber] = useState('')

  // Generar código único cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setStudentCode(generateStudentCode())
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submission - formData:', formData)
    console.log('Form submission - selectedSchedule:', selectedSchedule)
    console.log('Form submission - studentCode:', studentCode)
    
    if (!formData.courseId) {
      toast.error('Debes seleccionar un curso')
      return
    }

    const studentData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      birth_date: formData.birthDate,
      phone: formData.phone,
      parent_phone: formData.parentPhone || undefined,
      parent_contact_type: formData.parentPhone ? (formData.parentContactType as 'padre' | 'madre' | 'tutor') : undefined,
      course_id: Number(formData.courseId),
      student_code: studentCode,
      fixed_schedule: selectedSchedule.length > 0 ? JSON.stringify(selectedSchedule) : undefined,
      start_date: formData.startDate,
      has_shared_pricing: formData.hasSharedPricing,
      // Campos fiscales - usar el tipo de documento seleccionado
      dni: documentType === 'dni' ? (documentNumber || undefined) : undefined,
      nif: documentType === 'nif' ? (documentNumber || undefined) : undefined,
      address: formData.address || undefined,
      postal_code: formData.postalCode || undefined,
      city: formData.city || undefined,
      province: formData.province || undefined,
      country: formData.country || 'España',
      // Campos del receptor
      receptorNombre: formData.receptorNombre || undefined,
      receptorApellidos: formData.receptorApellidos || undefined,
      receptorEmail: formData.receptorEmail || undefined,
      // Enlace a pizarra digital
      digital_board_link: formData.digitalBoardLink || undefined,
      schedule: selectedSchedule
    }
    
    console.log('Form submission - studentData:', studentData)
    onSave(studentData)
  }

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      birthDate: '',
      phone: '',
      parentPhone: '',
      parentContactType: 'padre',
      courseId: '',
      startDate: '',
      hasSharedPricing: false,
      // Campos fiscales
      dni: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      country: 'España',
      // Campos del receptor
      receptorNombre: '',
      receptorApellidos: '',
      receptorEmail: '',
      // Campo para enlace a pizarra digital
      digitalBoardLink: ''
    })
    setSelectedSchedule([])
    setStudentCode('')
    // Resetear campos de documento
    setDocumentType('dni')
    setDocumentNumber('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-border"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Añadir Nuevo Alumno</h2>
            <Button variant="ghost" onClick={handleClose} size="sm">
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Información del Alumno</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Apellidos</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Fecha de Inicio de Clases</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Contacto Familiar (opcional)</label>
                    <div className="space-y-2">
                      <select
                        value={formData.parentContactType}
                        onChange={(e) => setFormData({ ...formData, parentContactType: e.target.value as 'padre' | 'madre' | 'tutor' })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="padre">Padre</option>
                        <option value="madre">Madre</option>
                        <option value="tutor">Tutor/a</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="Número de teléfono"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Curso</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Selecciona un curso</option>
                    {courses.filter(c => c.is_active).map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} - €{course.price}/hora
                        {course.shared_class_price && ` (Compartida: €${course.shared_class_price}/hora)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasSharedPricing}
                      onChange={(e) => setFormData({ ...formData, hasSharedPricing: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Este alumno tiene precio de clase compartida
                    </span>
                  </label>
                  {formData.hasSharedPricing && formData.courseId && (
                    <div className="mt-2 p-3 bg-info/10 border border-info/20 rounded-lg">
                      <p className="text-xs text-info">
                        {(() => {
                          const selectedCourse = courses.find(c => c.id.toString() === formData.courseId)
                          if (selectedCourse?.shared_class_price) {
                            return `✓ Precio aplicado: €${selectedCourse.shared_class_price}/hora (en lugar de €${selectedCourse.price}/hora)`
                          }
                          return '⚠️ El curso seleccionado no tiene un precio de clase compartida configurado. Se usará el precio normal.'
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sección de Datos Fiscales Completamente Unificados */}
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <User size={20} className="mr-2 text-primary" />
                    Datos Fiscales (Para Facturación)
                  </h4>
                  <p className="text-sm text-foreground-muted mb-6">
                    Estos datos se utilizarán para generar facturas RRSIF. Incluye tanto los datos del estudiante como del receptor (padre/madre/tutor).
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">DNI del Padre/Madre/Tutor</label>
                    <input
                      type="text"
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      placeholder="12345678A"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Dirección del Padre/Madre/Tutor</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle, número, piso, puerta"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Código Postal</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="28001"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Ciudad</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Madrid"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Provincia</label>
                      <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        placeholder="Madrid"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">País</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nombre del Padre/Madre/Tutor</label>
                      <input
                        type="text"
                        value={formData.receptorNombre}
                        onChange={(e) => setFormData({ ...formData, receptorNombre: e.target.value })}
                        placeholder="Nombre del padre/madre/tutor"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Apellidos del Padre/Madre/Tutor</label>
                      <input
                        type="text"
                        value={formData.receptorApellidos}
                        onChange={(e) => setFormData({ ...formData, receptorApellidos: e.target.value })}
                        placeholder="Apellidos del padre/madre/tutor"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Email del Padre/Madre/Tutor</label>
                    <input
                      type="email"
                      value={formData.receptorEmail}
                      onChange={(e) => setFormData({ ...formData, receptorEmail: e.target.value })}
                      placeholder="email@ejemplo.com"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Enlace a Pizarra Digital</label>
                    <input
                      type="url"
                      value={formData.digitalBoardLink}
                      onChange={(e) => setFormData({ ...formData, digitalBoardLink: e.target.value })}
                      placeholder="https://ejemplo.com/pizarra"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">URL de la pizarra digital para este estudiante</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Código de Estudiante</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formatStudentCode(studentCode)}
                      readOnly
                      className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-foreground font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentCode(generateStudentCode())}
                      className="whitespace-nowrap"
                    >
                      Regenerar
                    </Button>
                  </div>
                  <p className="text-xs text-foreground-muted mt-1">
                    Este código será usado por el alumno para registrarse en el futuro
                  </p>
                </div>

              </div>

              {/* Right Column - Schedule Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Horarios Fijos</h3>
                <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                  <p className="text-sm text-info font-medium mb-2">💡 Gestión de Horarios:</p>
                  <ul className="text-xs text-info/80 space-y-1">
                    <li>• <strong>Añadir:</strong> Haz clic en cualquier horario libre</li>
                    <li>• <strong>Eliminar:</strong> Pasa el ratón sobre un horario y haz clic en 🗑️</li>
                    <li>• <strong>Editar:</strong> Doble clic sobre cualquier horario</li>
                  </ul>
                </div>
                
                <SimpleWeeklyScheduleSelector
                  allClasses={[]} // No mostrar clases existentes - todos los horarios se muestran como selectedSchedule editables
                  allCourses={courses.map(course => ({ ...course, duration: 60 }))} // Adaptar interfaz con duración por defecto de 1h
                  selectedSchedule={selectedSchedule}
                  onScheduleChange={setSelectedSchedule}
                  selectedCourseId={formData.courseId}
                />

                {selectedSchedule.length > 0 && (
                  <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                    <h4 className="font-medium text-foreground mb-2">Horarios Fijos Seleccionados:</h4>
                    <div className="space-y-2">
                      {selectedSchedule.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][slot.day_of_week - 1]} - {slot.start_time} a {slot.end_time}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSchedule(selectedSchedule.filter((_, i) => i !== index))}
                            className="text-destructive hover:text-destructive/80 p-1"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-border">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                Crear Alumno
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

interface ViewEditStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (student: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'course_name' | 'course_price' | 'course_color'> & { schedule: TimeSlot[] }) => void
  student: Student
  courses: Course[]
  allClasses: any[]
}

const ViewEditStudentModal = ({ isOpen, onClose, onSave, student, courses, allClasses }: ViewEditStudentModalProps) => {
  const [formData, setFormData] = useState({
    firstName: student.first_name,
    lastName: student.last_name,
    email: student.email,
    birthDate: student.birth_date,
    phone: student.phone,
    parentPhone: student.parent_phone || '',
    parentContactType: student.parent_contact_type || 'padre',
    courseId: student.course_id.toString(),
    startDate: student.start_date || '',
    hasSharedPricing: student.has_shared_pricing || false,
    // Campos fiscales
    dni: student.dni || '',
    nif: student.nif || '',
    // Campos del receptor (padre/madre/tutor) - mapear de snake_case a camelCase
    receptorNombre: student.receptor_nombre || '',
    receptorApellidos: student.receptor_apellidos || '',
    receptorEmail: student.receptor_email || '',
    // Campo para enlace a pizarra digital
    digitalBoardLink: student.digital_board_link || '',
    address: student.address || '',
    postalCode: student.postal_code || '',
    city: student.city || '',
    province: student.province || '',
    country: student.country || 'España'
  })
  const [selectedSchedule, setSelectedSchedule] = useState<TimeSlot[]>([])

  // Cargar el horario actual del estudiante
  useEffect(() => {
    const loadStudentSchedule = async () => {
      try {
        console.log('Loading schedule for student:', student.id)
        const response = await fetch(`/api/students/${student.id}/schedule`)
        console.log('Schedule response status:', response.status)
        
        if (response.ok) {
          const scheduleData = await response.json()
          console.log('Schedule data received:', scheduleData)
          
          // Convertir los horarios fijos a formato editable con course_id como string
          const editableSchedule = scheduleData.map((slot: any) => ({
            ...slot,
            course_id: student.course_id.toString(), // Asegurar que sea string
            course_name: courses.find(c => c.id === student.course_id)?.name || 'Curso desconocido'
          }))
          
          setSelectedSchedule(editableSchedule)
          console.log('Editable schedule set:', editableSchedule)
        } else {
          const errorText = await response.text()
          console.error('Schedule response error:', errorText)
          
          // Fallback: cargar desde fixed_schedule si existe
          if (student.fixed_schedule) {
            try {
              const fallbackSchedule = typeof student.fixed_schedule === 'string' 
                ? JSON.parse(student.fixed_schedule) 
                : student.fixed_schedule
              
              const editableSchedule = fallbackSchedule.map((slot: any) => ({
                ...slot,
                course_id: student.course_id.toString(),
                course_name: courses.find(c => c.id === student.course_id)?.name || 'Curso desconocido'
              }))
              
              setSelectedSchedule(editableSchedule)
              console.log('Fallback schedule loaded from fixed_schedule:', editableSchedule)
            } catch (fallbackError) {
              console.error('Error parsing fallback fixed_schedule:', fallbackError)
              setSelectedSchedule([])
            }
          } else {
            setSelectedSchedule([])
          }
        }
      } catch (error) {
        console.error('Error loading student schedule:', error)
        
        // Fallback final: cargar desde fixed_schedule si existe
        if (student.fixed_schedule) {
          try {
            const fallbackSchedule = typeof student.fixed_schedule === 'string' 
              ? JSON.parse(student.fixed_schedule) 
              : student.fixed_schedule
            
            const editableSchedule = fallbackSchedule.map((slot: any) => ({
              ...slot,
              course_id: student.course_id.toString(),
              course_name: courses.find(c => c.id === student.course_id)?.name || 'Curso desconocido'
            }))
            
            setSelectedSchedule(editableSchedule)
            console.log('Final fallback schedule loaded:', editableSchedule)
          } catch (fallbackError) {
            console.error('Error in final fallback:', fallbackError)
            setSelectedSchedule([])
          }
        } else {
          setSelectedSchedule([])
        }
      }
    }
    
    if (isOpen && courses.length > 0) { // Esperar a que se carguen los cursos
      loadStudentSchedule()
    }
  }, [student.id, isOpen, courses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.courseId) {
      toast.error('Debes seleccionar un curso')
      return
    }

    onSave({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      birth_date: formData.birthDate,
      phone: formData.phone,
      parent_phone: formData.parentPhone || undefined,
      parent_contact_type: formData.parentPhone ? (formData.parentContactType as 'padre' | 'madre' | 'tutor') : undefined,
      course_id: Number(formData.courseId),
      student_code: student.student_code,
      start_date: formData.startDate,
      has_shared_pricing: formData.hasSharedPricing,
        // Campos fiscales
        dni: formData.dni || undefined,
      address: formData.address || undefined,
      postal_code: formData.postalCode || undefined,
      city: formData.city || undefined,
      province: formData.province || undefined,
      country: formData.country || 'España',
      // Campos del receptor (mapear a snake_case)
      receptor_nombre: formData.receptorNombre || undefined,
      receptor_apellidos: formData.receptorApellidos || undefined,
      receptor_email: formData.receptorEmail || undefined,
      // Enlace a pizarra digital
      digital_board_link: formData.digitalBoardLink || undefined,
      schedule: selectedSchedule
    })
  }

  const handleClose = () => {
    setFormData({
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      birthDate: student.birth_date,
      phone: student.phone,
      parentPhone: student.parent_phone || '',
      parentContactType: student.parent_contact_type || 'padre',
      courseId: student.course_id.toString(),
      startDate: student.start_date || '',
      hasSharedPricing: student.has_shared_pricing || false,
      // Campos fiscales
      dni: student.dni || '',
      nif: student.nif || '',
      address: student.address || '',
      postalCode: student.postal_code || '',
      city: student.city || '',
      province: student.province || '',
      country: student.country || 'España',
      // Campos del receptor
      receptorNombre: student.receptorNombre || '',
      receptorApellidos: student.receptorApellidos || '',
      receptorEmail: student.receptorEmail || '',
      // Campo para enlace a pizarra digital
      digitalBoardLink: student.digital_board_link || ''
    })
    setSelectedSchedule([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-border"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Editar Alumno</h2>
            <Button variant="ghost" onClick={handleClose} size="sm">
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Información del Alumno</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Apellidos</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Fecha de Inicio de Clases</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Contacto Familiar (opcional)</label>
                    <div className="space-y-2">
                      <select
                        value={formData.parentContactType}
                        onChange={(e) => setFormData({ ...formData, parentContactType: e.target.value as 'padre' | 'madre' | 'tutor' })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="padre">Padre</option>
                        <option value="madre">Madre</option>
                        <option value="tutor">Tutor/a</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="Número de teléfono"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Curso</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {courses.filter(c => c.is_active).map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} - €{course.price}/hora
                        {course.shared_class_price && ` (Compartida: €${course.shared_class_price}/hora)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasSharedPricing}
                      onChange={(e) => setFormData({ ...formData, hasSharedPricing: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Este alumno tiene precio de clase compartida
                    </span>
                  </label>
                  {formData.hasSharedPricing && formData.courseId && (
                    <div className="mt-2 p-3 bg-info/10 border border-info/20 rounded-lg">
                      <p className="text-xs text-info">
                        {(() => {
                          const selectedCourse = courses.find(c => c.id.toString() === formData.courseId)
                          if (selectedCourse?.shared_class_price) {
                            return `✓ Precio aplicado: €${selectedCourse.shared_class_price}/hora (en lugar de €${selectedCourse.price}/hora)`
                          }
                          return '⚠️ El curso seleccionado no tiene un precio de clase compartida configurado. Se usará el precio normal.'
                        })()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sección de Datos Fiscales Completamente Unificados */}
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <User size={20} className="mr-2 text-primary" />
                    Datos Fiscales (Para Facturación)
                  </h4>
                  <p className="text-sm text-foreground-muted mb-6">
                    Estos datos se utilizarán para generar facturas RRSIF. Incluye tanto los datos del estudiante como del receptor (padre/madre/tutor).
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">DNI del Padre/Madre/Tutor</label>
                    <input
                      type="text"
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      placeholder="12345678A"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Dirección del Padre/Madre/Tutor</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle, número, piso, puerta"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Código Postal</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="28001"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Ciudad</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Madrid"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Provincia</label>
                      <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        placeholder="Madrid"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">País</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nombre del Padre/Madre/Tutor</label>
                      <input
                        type="text"
                        value={formData.receptorNombre}
                        onChange={(e) => setFormData({ ...formData, receptorNombre: e.target.value })}
                        placeholder="Nombre del padre/madre/tutor"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Apellidos del Padre/Madre/Tutor</label>
                      <input
                        type="text"
                        value={formData.receptorApellidos}
                        onChange={(e) => setFormData({ ...formData, receptorApellidos: e.target.value })}
                        placeholder="Apellidos del padre/madre/tutor"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Email del Padre/Madre/Tutor</label>
                    <input
                      type="email"
                      value={formData.receptorEmail}
                      onChange={(e) => setFormData({ ...formData, receptorEmail: e.target.value })}
                      placeholder="email@ejemplo.com"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Enlace a Pizarra Digital</label>
                    <input
                      type="url"
                      value={formData.digitalBoardLink}
                      onChange={(e) => setFormData({ ...formData, digitalBoardLink: e.target.value })}
                      placeholder="https://ejemplo.com/pizarra"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">URL de la pizarra digital para este estudiante</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Schedule Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Horarios Fijos</h3>
                <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                  <p className="text-sm text-info font-medium mb-2">💡 Gestión de Horarios:</p>
                  <ul className="text-xs text-info/80 space-y-1">
                    <li>• <strong>Añadir:</strong> Haz clic en cualquier horario libre</li>
                    <li>• <strong>Eliminar:</strong> Pasa el ratón sobre un horario y haz clic en 🗑️</li>
                    <li>• <strong>Editar:</strong> Doble clic sobre cualquier horario</li>
                  </ul>
                </div>
                
                <SimpleWeeklyScheduleSelector
                  allClasses={[]} // No mostrar clases existentes - todos los horarios se muestran como selectedSchedule editables
                  allCourses={courses.map(course => ({ ...course, duration: 60 }))} // Adaptar interfaz con duración por defecto de 1h
                  selectedSchedule={selectedSchedule}
                  onScheduleChange={setSelectedSchedule}
                  selectedCourseId={formData.courseId}
                />

                {selectedSchedule.length > 0 && (
                  <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                    <h4 className="font-medium text-foreground mb-2">Horarios Fijos Seleccionados:</h4>
                    <div className="space-y-2">
                      {selectedSchedule.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][slot.day_of_week - 1]} - {slot.start_time} a {slot.end_time}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSchedule(selectedSchedule.filter((_, i) => i !== index))}
                            className="text-destructive hover:text-destructive/80 p-1"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-border">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default StudentsPage
