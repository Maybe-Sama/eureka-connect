'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Edit2, Calendar, BookOpen, Clock, FileText, Star, CalendarIcon } from 'lucide-react'

interface Exam {
  id: number
  subject: string
  exam_date: string
  exam_time?: string
  notes?: string
  grade?: number
}

interface ExamManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExamManagerModal({ isOpen, onClose }: ExamManagerModalProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    exam_date: '',
    exam_time: '',
    notes: '',
    grade: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadExams()
    }
  }, [isOpen])

  const loadExams = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('session_token')
      if (!token) {
        console.error('No session token found')
        return
      }

      const response = await fetch('/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setExams(data.exams)
      } else {
        console.error('Error loading exams:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('session_token')
      if (!token) {
        alert('No hay sesión activa')
        return
      }

      const url = editingExam ? `/api/exams/${editingExam.id}` : '/api/exams'
      const method = editingExam ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          grade: formData.grade ? parseFloat(formData.grade) : null
        }),
      })

      if (response.ok) {
        await loadExams()
        resetForm()
        // Notificar al componente padre que se actualizó la lista
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('examsUpdated'))
        }
      } else {
        const error = await response.json()
        console.error('Error saving exam:', error)
        alert(`Error: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving exam:', error)
      alert('Error al guardar el examen')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam)
    setFormData({
      subject: exam.subject,
      exam_date: exam.exam_date,
      exam_time: exam.exam_time || '',
      notes: exam.notes || '',
      grade: exam.grade?.toString() || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (examId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este examen?')) return

    setLoading(true)
    try {
      const token = localStorage.getItem('session_token')
      if (!token) {
        alert('No hay sesión activa')
        return
      }

      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        await loadExams()
        // Notificar al componente padre que se actualizó la lista
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('examsUpdated'))
        }
      } else {
        const error = await response.json()
        console.error('Error deleting exam:', error)
        alert(`Error: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert('Error al eliminar el examen')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      subject: '',
      exam_date: '',
      exam_time: '',
      notes: '',
      grade: ''
    })
    setEditingExam(null)
    setShowForm(false)
  }

  const getGradeColor = (grade?: number) => {
    if (!grade) return 'text-gray-500'
    if (grade >= 9) return 'text-green-600'
    if (grade >= 7) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <BookOpen className="mr-3 text-primary" size={28} />
            Gestor de Exámenes
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Lista de exámenes */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Mis Exámenes</h3>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Nuevo Examen
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.length === 0 ? (
                  <div className="text-center py-8 text-foreground-muted">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No tienes exámenes registrados</p>
                  </div>
                ) : (
                  exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 bg-background-secondary rounded-lg border border-border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <BookOpen size={16} className="mr-2 text-primary" />
                            <h4 className="font-semibold text-foreground">{exam.subject}</h4>
                          </div>
                          <div className="flex items-center text-sm text-foreground-secondary mb-2">
                            <Calendar size={14} className="mr-2" />
                            {new Date(exam.exam_date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                            {exam.exam_time && (
                              <>
                                <Clock size={14} className="ml-4 mr-2" />
                                {exam.exam_time}
                              </>
                            )}
                          </div>
                          {exam.notes && (
                            <div className="flex items-start text-sm text-foreground-muted mb-2">
                              <FileText size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{exam.notes}</span>
                            </div>
                          )}
                          {exam.grade && (
                            <div className="flex items-center text-sm">
                              <Star size={14} className="mr-2" />
                              <span className={`font-medium ${getGradeColor(exam.grade)}`}>
                                Nota: {exam.grade}/10
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(exam)}
                            className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Formulario */}
          {showForm && (
            <div className="w-96 border-l border-border p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingExam ? 'Editar Examen' : 'Nuevo Examen'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-3 flex items-center">
                     <BookOpen className="mr-2 text-primary" size={18} />
                     Asignatura *
                   </label>
                   <input
                     type="text"
                     value={formData.subject}
                     onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                     className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-primary/50"
                     placeholder="Ej: Matemáticas"
                     required
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-foreground mb-3 flex items-center">
                     <CalendarIcon className="mr-2 text-primary" size={18} />
                     Fecha *
                   </label>
                   <div className="relative group">
                     <input
                       type="date"
                       value={formData.exam_date}
                       onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                       onClick={(e) => {
                         // Forzar la apertura del calendario
                         e.currentTarget.showPicker?.()
                       }}
                       className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 cursor-pointer hover:border-primary/50 pr-12"
                       required
                     />
                     <button
                       type="button"
                       onClick={(e) => {
                         e.preventDefault()
                         const input = e.currentTarget.previousElementSibling as HTMLInputElement
                         input.focus()
                         input.showPicker?.()
                       }}
                       className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200 group-hover:bg-primary/5"
                     >
                       <CalendarIcon className="text-primary group-hover:text-primary/80 transition-colors" size={18} />
                     </button>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-foreground mb-3 flex items-center">
                     <Clock className="mr-2 text-primary" size={18} />
                     Hora
                   </label>
                   <div className="relative group">
                     <input
                       type="time"
                       value={formData.exam_time}
                       onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                       onClick={(e) => {
                         // Forzar la apertura del selector de hora
                         e.currentTarget.showPicker?.()
                       }}
                       className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 cursor-pointer hover:border-primary/50 pr-12"
                     />
                     <button
                       type="button"
                       onClick={(e) => {
                         e.preventDefault()
                         const input = e.currentTarget.previousElementSibling as HTMLInputElement
                         input.focus()
                         input.showPicker?.()
                       }}
                       className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200 group-hover:bg-primary/5"
                     >
                       <Clock className="text-primary group-hover:text-primary/80 transition-colors" size={18} />
                     </button>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-foreground mb-3 flex items-center">
                     <FileText className="mr-2 text-primary" size={18} />
                     Tema
                   </label>
                   <textarea
                     value={formData.notes}
                     onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                     className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-primary/50 resize-none"
                     rows={3}
                     placeholder="Tema o descripción del examen..."
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-foreground mb-3 flex items-center">
                     <Star className="mr-2 text-primary" size={18} />
                     Nota (0-10)
                   </label>
                   <input
                     type="number"
                     min="0"
                     max="10"
                     step="0.1"
                     value={formData.grade}
                     onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                     className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 hover:border-primary/50"
                     placeholder="Ej: 8.5"
                   />
                 </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : editingExam ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-background-tertiary transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
