'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Users,
  RotateCcw,
  Target,
  List
} from 'lucide-react'
import PunishmentTypeModal from '@/components/punishments/PunishmentTypeModal'

interface PunishmentType {
  id: number
  name: string
  description: string
  color: string
  severity: number
  is_active: boolean
}

interface PunishmentResult {
  id: number
  student_id: number
  punishment_type_id: number
  result_date: string
  is_completed: boolean
  completed_at?: string
  notes?: string
  punishment_type: PunishmentType
  student: {
    id: number
    first_name: string
    last_name: string
  }
}

export default function PunishmentsPage() {
  const { user, loading, isTeacher } = useAuth()
  const router = useRouter()
  const [punishmentTypes, setPunishmentTypes] = useState<PunishmentType[]>([])
  const [punishmentResults, setPunishmentResults] = useState<PunishmentResult[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [studentCustomPunishments, setStudentCustomPunishments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'types' | 'students' | 'roulette'>('types')
  const [loadingData, setLoadingData] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingType, setEditingType] = useState<PunishmentType | null>(null)

  useEffect(() => {
    if (!loading && !isTeacher) {
      router.push('/login')
    }
  }, [loading, isTeacher, router])

  useEffect(() => {
    if (isTeacher) {
      loadPunishmentTypes()
      loadPunishmentResults()
      loadStudents()
    }
  }, [isTeacher])

  useEffect(() => {
    if (selectedStudent) {
      loadStudentCustomPunishments(selectedStudent)
    }
  }, [selectedStudent])

  const loadPunishmentTypes = async () => {
    try {
      const response = await fetch('/api/punishments/types')
      const result = await response.json()
      if (result.data) {
        setPunishmentTypes(result.data)
      }
    } catch (error) {
      console.error('Error loading punishment types:', error)
    }
  }

  const loadPunishmentResults = async () => {
    try {
      const response = await fetch('/api/punishments/results?limit=20')
      const result = await response.json()
      if (result.data) {
        setPunishmentResults(result.data)
      }
    } catch (error) {
      console.error('Error loading punishment results:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_code')
        .order('first_name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Error cargando estudiantes')
    }
  }

  const loadStudentCustomPunishments = async (studentId: number) => {
    try {
      const { data, error } = await supabase
        .from('student_custom_punishments')
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .eq('student_id', studentId)
        .order('order_position', { ascending: true })

      if (error) throw error
      setStudentCustomPunishments(data || [])
    } catch (error) {
      console.error('Error loading student custom punishments:', error)
      toast.error('Error cargando castigos personalizados del estudiante')
    }
  }

  const togglePunishmentLock = async (punishmentId: number, isUnlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('student_custom_punishments')
        .update({ is_unlocked: !isUnlocked })
        .eq('id', punishmentId)

      if (error) throw error
      
      toast.success(`Castigo ${!isUnlocked ? 'desbloqueado' : 'bloqueado'}`)
      if (selectedStudent) {
        loadStudentCustomPunishments(selectedStudent)
      }
    } catch (error) {
      console.error('Error toggling punishment lock:', error)
      toast.error('Error cambiando estado del castigo')
    }
  }

  const togglePunishmentActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/punishments/types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive })
      })

      if (response.ok) {
        loadPunishmentTypes()
      }
    } catch (error) {
      console.error('Error toggling punishment type:', error)
    }
  }

  const markAsCompleted = async (id: number, isCompleted: boolean) => {
    try {
      const response = await fetch('/api/punishments/results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_completed: isCompleted })
      })

      if (response.ok) {
        loadPunishmentResults()
      }
    } catch (error) {
      console.error('Error updating punishment result:', error)
    }
  }

  const handleSavePunishmentType = async (punishmentData: any) => {
    try {
      const response = await fetch('/api/punishments/types', {
        method: editingType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingType ? { ...punishmentData, id: editingType.id } : punishmentData)
      })

      if (response.ok) {
        loadPunishmentTypes()
        setShowAddForm(false)
        setEditingType(null)
      }
    } catch (error) {
      console.error('Error saving punishment type:', error)
    }
  }

  const getSeverityIcon = (severity: number) => {
    switch (severity) {
      case 1: return <Clock className="w-4 h-4 text-green-500" />
      case 2: return <Clock className="w-4 h-4 text-yellow-500" />
      case 3: return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 4: return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 5: return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityText = (severity: number) => {
    switch (severity) {
      case 1: return 'Muy Leve'
      case 2: return 'Leve'
      case 3: return 'Moderado'
      case 4: return 'Severo'
      case 5: return 'Muy Severo'
      default: return 'Desconocido'
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isTeacher) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              🎯 Sistema de Castigos y Ruleta
            </h1>
            <p className="text-foreground-muted mt-2">
              Gestiona tipos de castigos, controla estudiantes y lanza la ruleta
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            <span>Nuevo Castigo</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-effect rounded-xl p-6 border border-border">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {punishmentTypes.length}
                </p>
                <p className="text-sm text-foreground-muted">Tipos de Castigo</p>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6 border border-border">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {punishmentResults.filter(r => !r.is_completed).length}
                </p>
                <p className="text-sm text-foreground-muted">Pendientes</p>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6 border border-border">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {punishmentResults.filter(r => r.is_completed).length}
                </p>
                <p className="text-sm text-foreground-muted">Completados</p>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6 border border-border">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(punishmentResults.map(r => r.student_id)).size}
                </p>
                <p className="text-sm text-foreground-muted">Estudiantes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Navegación */}
        <div className="glass-effect rounded-2xl p-2 border border-border">
          <div className="flex space-x-1 bg-background-tertiary rounded-xl p-1">
            <button
              onClick={() => setActiveTab('types')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'types'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-background-tertiary/70'
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Tipos de Castigos</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'students'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-background-tertiary/70'
              }`}
            >
              <Users size={20} />
              <span className="font-medium">Control por Estudiante</span>
            </button>
            <button
              onClick={() => setActiveTab('roulette')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'roulette'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-background-tertiary/70'
              }`}
            >
              <Target size={20} />
              <span className="font-medium">Lanzar Ruleta</span>
            </button>
          </div>
        </div>

        {/* Tab: Tipos de Castigos */}
        {activeTab === 'types' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Gestión de Tipos de Castigo */}
        <div className="glass-effect rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
            <Settings className="mr-2 text-primary" size={24} />
            Tipos de Castigo
          </h2>
          
          <div className="space-y-4">
            {punishmentTypes.map((punishment) => (
              <motion.div
                key={punishment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: punishment.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {punishment.name}
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      {punishment.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getSeverityIcon(punishment.severity)}
                      <span className="text-xs text-foreground-muted">
                        {getSeverityText(punishment.severity)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingType(punishment)}
                    className="p-2 rounded-lg bg-background hover:bg-background-tertiary transition-colors"
                  >
                    <Edit className="w-4 h-4 text-foreground-muted" />
                  </button>
                  <button
                    onClick={() => togglePunishmentActive(punishment.id, punishment.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      punishment.is_active 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {punishment.is_active ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Historial de Castigos */}
        <div className="glass-effect rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
            <RotateCcw className="mr-2 text-primary" size={24} />
            Historial de Castigos
          </h2>
          
          <div className="space-y-4">
            {punishmentResults.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: result.punishment_type.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {result.punishment_type.name}
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      {result.student.first_name} {result.student.last_name} • {new Date(result.result_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => markAsCompleted(result.id, !result.is_completed)}
                    className={`p-2 rounded-lg transition-colors ${
                      result.is_completed 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    }`}
                  >
                    {result.is_completed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
          </motion.div>
        )}

        {/* Tab: Control por Estudiante */}
        {activeTab === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Control de Castigos por Estudiante */}
        <div className="glass-effect rounded-2xl shadow-lg p-6 border border-border mt-8">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
            <Users className="mr-2 text-primary" size={24} />
            Control de Castigos por Estudiante
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Seleccionar Estudiante
            </label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
              className="w-64 px-3 py-2 bg-background-secondary border border-border rounded-lg text-foreground"
            >
              <option value="">Selecciona un estudiante</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.student_code})
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Castigos Personalizados del Estudiante
              </h3>
              
              {studentCustomPunishments.length === 0 ? (
                <p className="text-foreground-muted">No hay castigos personalizados para este estudiante.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentCustomPunishments.map((punishment) => (
                    <div
                      key={punishment.id}
                      className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg border border-border/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: punishment.punishment_type.color }}
                        />
                        <div>
                          <p className="font-medium text-foreground">
                            {punishment.punishment_type.name}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-foreground-muted">
                            <span>Posición: {punishment.order_position || 'No asignada'}</span>
                            <span>•</span>
                            <span>{punishment.is_selected ? 'Seleccionado' : 'No seleccionado'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => togglePunishmentLock(punishment.id, punishment.is_unlocked)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            punishment.is_unlocked
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {punishment.is_unlocked ? 'Desbloqueado' : 'Bloqueado'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
          </motion.div>
        )}

        {/* Tab: Lanzar Ruleta */}
        {activeTab === 'roulette' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-effect rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <Target className="mr-2 text-primary" size={24} />
                Lanzar Ruleta para Estudiante
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seleccionar Estudiante
                </label>
                <select
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-64 px-3 py-2 bg-background-secondary border border-border rounded-lg text-foreground"
                >
                  <option value="">Selecciona un estudiante</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.student_code})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="text-center">
                  <div className="mb-4">
                    <p className="text-foreground-muted">
                      Para lanzar la ruleta, ve a la página dedicada de ruleta del profesor.
                    </p>
                  </div>
                  <a
                    href="/teacher-roulette"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Ir a Panel de Ruleta</span>
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Modal para agregar/editar tipos de castigo */}
        <PunishmentTypeModal
          isOpen={showAddForm || editingType !== null}
          onClose={() => {
            setShowAddForm(false)
            setEditingType(null)
          }}
          onSave={handleSavePunishmentType}
          editingType={editingType}
        />
      </div>
    </div>
  )
}
