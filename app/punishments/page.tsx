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
  RotateCcw
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
    }
  }, [isTeacher])

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
              🎯 Sistema de Castigos
            </h1>
            <p className="text-foreground-muted mt-2">
              Gestiona los castigos y la ruleta de castigos
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
