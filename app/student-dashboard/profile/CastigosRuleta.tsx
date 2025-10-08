'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Unlock, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw,
  Settings,
  Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PunishmentType {
  id: number
  name: string
  description: string
  color: string
  severity: number
  is_active: boolean
  textColor?: string
  borderColor?: string
}

interface StudentCustomPunishment {
  id: number
  student_id: number
  punishment_type_id: number
  is_unlocked: boolean
  is_selected: boolean
  order_position: number
  punishment_type: PunishmentType
}

interface PunishmentResult {
  id: number
  punishment_type_id: number
  result_date: string
  is_completed: boolean
  completed_at?: string
  notes?: string
  punishment_type: PunishmentType
}

export default function CastigosRuleta() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'config' | 'ruleta' | 'historial'>('config')
  const [availablePunishments, setAvailablePunishments] = useState<PunishmentType[]>([])
  const [selectedPunishments, setSelectedPunishments] = useState<StudentCustomPunishment[]>([])
  const [recentResults, setRecentResults] = useState<PunishmentResult[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<PunishmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.studentId) {
      loadData()
    }
  }, [user?.studentId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar castigos disponibles (desbloqueados por el profesor)
      const { data: punishments, error: punishmentsError } = await supabase
        .from('student_custom_punishments')
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .eq('student_id', user?.studentId)
        .eq('is_unlocked', true)
        .order('order_position', { ascending: true })

      if (punishmentsError) throw punishmentsError

      // Separar castigos seleccionados y disponibles
      const selected = punishments?.filter(p => p.is_selected) || []
      const available = punishments?.filter(p => !p.is_selected) || []

      setSelectedPunishments(selected)
      setAvailablePunishments(available.map(p => ({
        ...p.punishment_type,
        textColor: getContrastColor(p.punishment_type.color),
        borderColor: getContrastBorder(p.punishment_type.color)
      })))

      // Cargar resultados recientes
      const { data: results, error: resultsError } = await supabase
        .from('punishment_results')
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .eq('student_id', user?.studentId)
        .order('result_date', { ascending: false })
        .limit(5)

      if (resultsError) throw resultsError
      setRecentResults(results || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  // Funciones de contraste para accesibilidad
  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  const getContrastBorder = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  const selectPunishment = async (punishmentType: PunishmentType) => {
    if (selectedPunishments.length >= 5) {
      toast.error('Ya tienes 5 castigos seleccionados. Elimina uno para agregar otro.')
      return
    }

    try {
      setSaving(true)
      
      const nextPosition = selectedPunishments.length + 1
      
      const { error } = await supabase
        .from('student_custom_punishments')
        .update({
          is_selected: true,
          order_position: nextPosition
        })
        .eq('student_id', user?.studentId)
        .eq('punishment_type_id', punishmentType.id)

      if (error) throw error

      toast.success(`Castigo "${punishmentType.name}" agregado a tu ruleta`)
      loadData()
    } catch (error) {
      console.error('Error selecting punishment:', error)
      toast.error('Error agregando castigo')
    } finally {
      setSaving(false)
    }
  }

  const removePunishment = async (punishmentId: number) => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('student_custom_punishments')
        .update({
          is_selected: false,
          order_position: 0
        })
        .eq('id', punishmentId)

      if (error) throw error

      toast.success('Castigo eliminado de tu ruleta')
      loadData()
    } catch (error) {
      console.error('Error removing punishment:', error)
      toast.error('Error eliminando castigo')
    } finally {
      setSaving(false)
    }
  }

  const movePunishment = async (punishmentId: number, direction: 'up' | 'down') => {
    try {
      setSaving(true)
      
      const punishment = selectedPunishments.find(p => p.id === punishmentId)
      if (!punishment) return

      const newPosition = direction === 'up' 
        ? Math.max(1, punishment.order_position - 1)
        : Math.min(5, punishment.order_position + 1)

      const targetPunishment = selectedPunishments.find(p => p.order_position === newPosition)
      
      if (targetPunishment) {
        await supabase
          .from('student_custom_punishments')
          .update({ order_position: punishment.order_position })
          .eq('id', targetPunishment.id)

        await supabase
          .from('student_custom_punishments')
          .update({ order_position: newPosition })
          .eq('id', punishmentId)
      }

      loadData()
    } catch (error) {
      console.error('Error moving punishment:', error)
      toast.error('Error reordenando castigo')
    } finally {
      setSaving(false)
    }
  }

  const checkPermissions = async () => {
    try {
      const response = await fetch(`/api/punishments/permissions?student_id=${user?.studentId}&action=spin`)
      const result = await response.json()
      return result.hasPermission
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  const spinWheel = async () => {
    if (isSpinning || selectedPunishments.length === 0) return

    const hasPermission = await checkPermissions()
    if (!hasPermission) {
      alert('No tienes permisos para lanzar la ruleta. Contacta con tu profesor.')
      return
    }

    setIsSpinning(true)
    setResult(null)

    try {
      // Simular giro de la ruleta
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Seleccionar castigo aleatorio
      const randomIndex = Math.floor(Math.random() * selectedPunishments.length)
      const selectedPunishment = selectedPunishments[randomIndex]

      // Guardar resultado en la base de datos
      const { data, error } = await supabase
        .from('punishment_results')
        .insert({
          student_id: user?.studentId,
          punishment_type_id: selectedPunishment.punishment_type_id,
          result_date: new Date().toISOString()
        })
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .single()

      if (error) throw error

      setResult(data)
      loadData() // Recargar historial
    } catch (error) {
      console.error('Error spinning wheel:', error)
    } finally {
      setIsSpinning(false)
    }
  }

  const getSeverityIcon = (severity: number) => {
    switch (severity) {
      case 1: return <Clock className="w-4 h-4 text-green-500" />
      case 2: return <Clock className="w-4 h-4 text-yellow-500" />
      case 3: return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 4: return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 5: return <XCircle className="w-4 h-4 text-red-600" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground-muted">Cargando castigos y ruleta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          🎯 Castigos y Ruleta
        </h2>
        <p className="text-foreground-muted">
          Configura tus castigos y lanza la ruleta de la suerte
        </p>
      </div>

      {/* Tabs de Navegación */}
      <div className="glass-effect rounded-2xl p-2 border border-border">
        <div className="flex space-x-1 bg-background-tertiary rounded-xl p-1">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'config'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'hover:bg-background-tertiary/70'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Configurar</span>
          </button>
          <button
            onClick={() => setActiveTab('ruleta')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'ruleta'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'hover:bg-background-tertiary/70'
            }`}
          >
            <Gift size={20} />
            <span className="font-medium">Ruleta</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'historial'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'hover:bg-background-tertiary/70'
            }`}
          >
            <CheckCircle size={20} />
            <span className="font-medium">Historial</span>
          </button>
        </div>
      </div>

      {/* Tab: Configurar Castigos */}
      {activeTab === 'config' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Castigos Seleccionados */}
          <div className="glass-effect rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-500" size={24} />
              Mis Castigos Seleccionados ({selectedPunishments.length}/5)
            </h3>
            
            {selectedPunishments.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">
                  No tienes castigos seleccionados. Elige de la lista de abajo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPunishments
                  .sort((a, b) => a.order_position - b.order_position)
                  .map((punishment, index) => (
                    <motion.div
                      key={punishment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg border border-border/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {punishment.order_position}
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: punishment.punishment_type.color }}
                        />
                        <div>
                          <p className="font-medium text-foreground">
                            {punishment.punishment_type.name}
                          </p>
                          <div className="flex items-center space-x-1 text-sm text-foreground-muted">
                            {getSeverityIcon(punishment.punishment_type.severity)}
                            <span>{getSeverityText(punishment.punishment_type.severity)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => movePunishment(punishment.id, 'up')}
                          disabled={punishment.order_position === 1 || saving}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => movePunishment(punishment.id, 'down')}
                          disabled={punishment.order_position === selectedPunishments.length || saving}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePunishment(punishment.id)}
                          disabled={saving}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>

          {/* Castigos Disponibles */}
          <div className="glass-effect rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Unlock className="mr-2 text-blue-500" size={24} />
              Castigos Disponibles
            </h3>
            
            {availablePunishments.length === 0 ? (
              <div className="text-center py-8">
                <Lock className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">
                  No hay castigos disponibles. Tu profesor debe desbloquearlos primero.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePunishments.map((punishment) => (
                  <motion.div
                    key={punishment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg border border-border/50 hover:bg-background-tertiary/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: punishment.color }}
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {punishment.name}
                        </p>
                        <div className="flex items-center space-x-1 text-sm text-foreground-muted">
                          {getSeverityIcon(punishment.severity)}
                          <span>{getSeverityText(punishment.severity)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => selectPunishment(punishment)}
                      disabled={selectedPunishments.length >= 5 || saving}
                      size="sm"
                    >
                      Agregar
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab: Ruleta */}
      {activeTab === 'ruleta' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Ruleta Container */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="relative w-80 h-80">
                <motion.div
                  className="w-full h-full rounded-full border-4 border-background shadow-2xl"
                  animate={{ 
                    rotate: isSpinning ? 360 * 5 : 0 
                  }}
                  transition={{ 
                    duration: isSpinning ? 2 : 0,
                    ease: "easeOut" 
                  }}
                  style={{
                    background: `conic-gradient(
                      ${selectedPunishments.map((punishment, index) => 
                        `${punishment.punishment_type.color} ${index * (360 / selectedPunishments.length)}deg ${(index + 1) * (360 / selectedPunishments.length)}deg`
                      ).join(', ')}
                    )`
                  }}
                >
                  {/* Sectores de la ruleta */}
                  {selectedPunishments.map((punishment, index) => (
                    <div
                      key={punishment.id}
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${index * (360 / selectedPunishments.length)}deg)`,
                        transformOrigin: 'center'
                      }}
                    >
                      <div 
                        className="absolute top-4 left-1/2 transform -translate-x-1/2 font-bold text-xs text-center px-2"
                        style={{ 
                          color: punishment.punishment_type.textColor || '#ffffff',
                          textShadow: punishment.punishment_type.borderColor ? `1px 1px 2px ${punishment.punishment_type.borderColor}` : '1px 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        {punishment.punishment_type.name}
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Puntero */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-b-12 border-l-transparent border-r-transparent border-b-primary"></div>
                </div>

                {/* Centro de la ruleta */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-background rounded-full border-4 border-primary shadow-lg flex items-center justify-center">
                  <RotateCcw className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Botón de girar */}
          <div className="text-center">
            <motion.button
              onClick={spinWheel}
              disabled={isSpinning || selectedPunishments.length === 0}
              className={`
                px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200
                ${isSpinning || selectedPunishments.length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 text-primary-foreground'
                }
              `}
              whileHover={!isSpinning && selectedPunishments.length > 0 ? { scale: 1.05 } : {}}
              whileTap={!isSpinning && selectedPunishments.length > 0 ? { scale: 0.95 } : {}}
            >
              {isSpinning ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Girando...</span>
                </div>
              ) : selectedPunishments.length === 0 ? (
                'Configura tus castigos primero'
              ) : (
                '🎯 ¡Girar Ruleta!'
              )}
            </motion.button>
          </div>

          {/* Resultado */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="glass-effect rounded-2xl p-6 border border-primary/20 bg-primary/5">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  🎯 ¡Resultado!
                </h3>
                <p className="text-lg text-foreground-muted mb-2">
                  Tu castigo es: <span className="font-bold text-primary">{result.punishment_type.name}</span>
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-foreground-muted">
                  {getSeverityIcon(result.punishment_type.severity)}
                  <span>{getSeverityText(result.punishment_type.severity)}</span>
                </div>
                <p className="text-sm text-foreground-muted mt-2">
                  {result.punishment_type.description}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tab: Historial */}
      {activeTab === 'historial' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass-effect rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <CheckCircle className="mr-2 text-primary" size={24} />
              Historial de Castigos
            </h3>
            
            {recentResults.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">
                  No tienes castigos registrados aún.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: result.punishment_type.color }}
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {result.punishment_type.name}
                        </p>
                        <p className="text-sm text-foreground-muted">
                          {new Date(result.result_date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.is_completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="text-sm text-foreground-muted">
                        {result.is_completed ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Información adicional */}
      <div className="glass-effect bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          ℹ️ Cómo funciona
        </h3>
        <div className="space-y-2 text-sm text-foreground-muted">
          <p>• <strong>Configurar:</strong> Selecciona hasta 5 castigos y ordénalos de menor a mayor fastidio</p>
          <p>• <strong>Ruleta:</strong> Gira la ruleta para recibir un castigo aleatorio de los configurados</p>
          <p>• <strong>Historial:</strong> Ve todos tus castigos anteriores y su estado de completado</p>
          <p>• Tu profesor controla qué castigos están disponibles para ti</p>
        </div>
      </div>
    </div>
  )
}


