'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { toast } from 'sonner'
import { SubjectGroupSelector } from '@/components/courses/SubjectGroupSelector'

interface Course {
  id: number
  name: string
  description?: string
  subject?: string
  subject_group?: string  // Nuevo campo para el grupo de asignaturas
  price: number
  shared_class_price?: number
  duration: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Fetch courses from database
  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      } else {
        toast.error('Error al cargar los cursos')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Error al cargar los cursos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleAddCourse = async (newCourse: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse),
      })

      if (response.ok) {
        toast.success('Curso creado exitosamente')
        setIsAddModalOpen(false)
        fetchCourses() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear el curso')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      toast.error('Error al crear el curso')
    }
  }

  const handleEditCourse = async (updatedCourse: Course) => {
    try {
      const response = await fetch(`/api/courses/${updatedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCourse),
      })

      if (response.ok) {
        toast.success('Curso actualizado exitosamente')
        setIsEditModalOpen(false)
        setEditingCourse(null)
        fetchCourses() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar el curso')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('Error al actualizar el curso')
    }
  }

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso?')) return

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Curso eliminado exitosamente')
        fetchCourses() // Refresh the list
      } else {
        const error = await response.json()
        const errorMessage = error.error || 'Error al eliminar el curso'
        
        // Mostrar mensaje específico si hay estudiantes asociados
        if (errorMessage.includes('estudiantes asociados')) {
          toast.error('No se puede eliminar el curso porque tiene estudiantes asociados. Primero elimina o reasigna los estudiantes.', {
            duration: 5000,
          })
        } else {
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Error al eliminar el curso')
    }
  }

  const totalCourses = courses.length
  const averagePrice = totalCourses > 0 ? courses.reduce((sum, c) => sum + c.price, 0) / totalCourses : 0
  const activeCourses = courses.filter(c => c.is_active).length

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
            <BookOpen size={32} className="mr-3 text-primary" />
            Gestión de Cursos
          </h1>
          <Button 
            onClick={() => {
              console.log('Botón Añadir Curso clickeado, abriendo modal...') // Log de depuración
              setIsAddModalOpen(true)
              console.log('Estado del modal después de abrir:', true) // Log de depuración
            }} 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Añadir Curso
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-effect rounded-lg p-4 text-center">
            <BookOpen size={24} className="text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
            <p className="text-sm text-foreground-muted">Total de Cursos</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">€{averagePrice.toFixed(2)}</p>
            <p className="text-sm text-foreground-muted">Precio Medio</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{activeCourses}</p>
            <p className="text-sm text-foreground-muted">Cursos Activos</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow">
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onEdit={() => {
              setEditingCourse(course)
              setIsEditModalOpen(true)
            }}
            onDelete={() => handleDeleteCourse(course.id)}
          />
        ))}
      </div>

      <AddEditCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCourse}
        title="Añadir Nuevo Curso"
      />
              {editingCourse && (
          <AddEditCourseModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditingCourse(null)
            }}
            onSave={(course) => handleEditCourse(course as Course)}
            title="Editar Curso"
            initialData={editingCourse}
          />
        )}
    </div>
  )
}

interface CourseCardProps {
  course: Course
  onEdit: () => void
  onDelete: () => void
}

const CourseCard = ({ course, onEdit, onDelete }: CourseCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.2 }}
    className="glass-effect card-hover rounded-lg p-5 border border-border relative overflow-hidden"
    style={{ borderColor: course.color }}
  >
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: course.color }} />
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xl font-semibold text-foreground flex items-center">
        <BookOpen size={20} className="mr-2 text-primary" />
        {course.name}
      </h3>
      <div className="flex space-x-2">
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-foreground-muted hover:text-primary">
          <Edit size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive/80">
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
    {course.subject_group && (
      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          <BookOpen size={12} className="mr-1" />
          {course.subject_group.split('.').pop()?.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>
    )}
    <p className="text-foreground-secondary text-sm mb-4">{course.description}</p>
    <div className="flex justify-between items-center pt-3 border-t border-border">
      <div>
        <p className="text-sm text-foreground-muted">Precio / hora</p>
        <p className="text-lg font-bold text-foreground">€{course.price.toFixed(2)}</p>
        {course.shared_class_price && (
          <p className="text-xs text-foreground-muted">Compartida: €{course.shared_class_price.toFixed(2)}</p>
        )}
      </div>
      <div>
        <p className="text-sm text-foreground-muted">Duración</p>
        <p className="text-lg font-bold text-foreground">{course.duration} min</p>
      </div>
    </div>
    <div className="mt-2">
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        course.is_active 
          ? 'bg-success/20 text-success border border-success/30' 
          : 'bg-destructive/20 text-destructive border border-destructive/30'
      }`}>
        {course.is_active ? 'Activo' : 'Inactivo'}
      </span>
    </div>
  </motion.div>
)

interface AddEditCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'> | Course) => void
  title: string
  initialData?: Course | null
}

const AddEditCourseModal = ({ isOpen, onClose, onSave, title, initialData }: AddEditCourseModalProps) => {
  const [formData, setFormData] = useState<Omit<Course, 'id' | 'created_at' | 'updated_at'> | Course>(
    initialData || {
      name: '',
      description: '',
      subject: '',
      subject_group: '',  // Inicializar el nuevo campo
      price: 0,
      shared_class_price: 0,
      duration: 60,
      color: '#6366f1',
      is_active: true,
    }
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    if (!initialData) {
      setFormData({
        name: '',
        description: '',
        subject: '',
        subject_group: '',
        price: 0,
        shared_class_price: 0,
        duration: 60,
        color: '#6366f1',
        is_active: true,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background p-8 rounded-lg shadow-xl w-full max-w-md border border-border"
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">Nombre del Curso</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <SubjectGroupSelector
              selectedGroup={formData.subject_group || ''}
              onGroupChange={(subject_group) => setFormData(prev => ({ ...prev, subject_group }))}
            />
            <p className="text-xs text-foreground-muted mt-2">
              💡 Define el grupo de asignaturas que estarán disponibles en el seguimiento de clases para los alumnos de este curso.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Precio por Hora (€)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Precio Clase Compartida (€)
                <span className="text-xs text-foreground-muted ml-1">(opcional)</span>
              </label>
              <input
                type="number"
                name="shared_class_price"
                value={formData.shared_class_price || ''}
                onChange={handleChange}
                placeholder="Precio reducido para clases compartidas"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Duración (min)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                min="15"
                step="15"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">Color de Identificación</label>
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-border cursor-pointer"
            />
          </div>
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="mr-2 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">Curso Activo</span>
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">Guardar Curso</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default CoursesPage
