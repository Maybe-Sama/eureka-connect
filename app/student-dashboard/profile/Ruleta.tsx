'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthToken } from '@/hooks/useAuthToken'
import { supabase } from '@/lib/supabase'
import { RotateCcw, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'

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

interface PunishmentResult {
  id: number
  punishment_type_id: number
  result_date: string
  is_completed: boolean
  completed_at?: string
  notes?: string
  punishment_type: PunishmentType
}

export default function Ruleta() {
  const { user } = useAuth()
  const { getAuthHeaders, isAuthenticated } = useAuthToken()
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<PunishmentResult | null>(null)
  const [punishmentTypes, setPunishmentTypes] = useState<PunishmentType[]>([])
  const [recentResults, setRecentResults] = useState<PunishmentResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.studentId) {
      loadPunishmentTypes()
      loadRecentResults()
    }
  }, [user?.studentId])

  const loadPunishmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('punishment_types')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: true })

      if (error) throw error
      
      // Asegurar que los colores tengan suficiente contraste
      const typesWithContrast = (data || []).map(type => ({
        ...type,
        // Asegurar contraste mínimo para accesibilidad
        textColor: getContrastColor(type.color),
        borderColor: getContrastBorder(type.color)
      }))
      
      setPunishmentTypes(typesWithContrast)
    } catch (error) {
      console.error('Error loading punishment types:', error)
    }
  }

  // Función para determinar el color del texto basado en el contraste
  const getContrastColor = (hexColor: string) => {
    // Convertir hex a RGB
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    
    // Calcular luminancia relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Retornar blanco o negro basado en la luminancia
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Función para obtener color de borde con contraste
  const getContrastBorder = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Retornar un color de borde más oscuro para mejor contraste
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  const loadRecentResults = async () => {
    try {
      const { data, error } = await supabase
        .from('punishment_results')
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .eq('student_id', user?.studentId)
        .order('result_date', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentResults(data || [])
    } catch (error) {
      console.error('Error loading recent results:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPermissions = async () => {
    try {
      if (!isAuthenticated()) {
        return false
      }

      const response = await fetch(`/api/punishments/permissions?student_id=${user?.studentId}&action=spin`, {
        headers: getAuthHeaders()
      })
      const result = await response.json()
      return result.hasPermission
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  const spinWheel = async () => {
    if (isSpinning || punishmentTypes.length === 0) return

    // Verificar permisos antes de permitir el giro
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
      const randomIndex = Math.floor(Math.random() * punishmentTypes.length)
      const selectedPunishment = punishmentTypes[randomIndex]

      // Guardar resultado en la base de datos
      const { data, error } = await supabase
        .from('punishment_results')
        .insert({
          student_id: user?.studentId,
          punishment_type_id: selectedPunishment.id,
          result_date: new Date().toISOString()
        })
        .select(`
          *,
          punishment_type:punishment_types(*)
        `)
        .single()

      if (error) throw error

      setResult(data)
      loadRecentResults() // Recargar historial
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
          <p className="mt-4 text-foreground-muted">Cargando ruleta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          🎯 Ruleta de Castigos
        </h2>
        <p className="text-foreground-muted">
          ¡Gira la ruleta y descubre tu castigo!
        </p>
      </div>

      {/* Ruleta Container */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Ruleta */}
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
                  ${punishmentTypes.map((punishment, index) => 
                    `${punishment.color} ${index * (360 / punishmentTypes.length)}deg ${(index + 1) * (360 / punishmentTypes.length)}deg`
                  ).join(', ')}
                )`
              }}
            >
              {/* Sectores de la ruleta */}
              {punishmentTypes.map((punishment, index) => (
                <div
                  key={punishment.id}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${index * (360 / punishmentTypes.length)}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <div 
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 font-bold text-xs text-center px-2"
                    style={{ 
                      color: punishment.textColor || '#ffffff',
                      textShadow: punishment.borderColor ? `1px 1px 2px ${punishment.borderColor}` : '1px 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {punishment.name}
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
          disabled={isSpinning || punishmentTypes.length === 0}
          className={`
            px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200
            ${isSpinning || punishmentTypes.length === 0
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 text-primary-foreground'
            }
          `}
          whileHover={!isSpinning && punishmentTypes.length > 0 ? { scale: 1.05 } : {}}
          whileTap={!isSpinning && punishmentTypes.length > 0 ? { scale: 0.95 } : {}}
        >
          {isSpinning ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Girando...</span>
            </div>
          ) : punishmentTypes.length === 0 ? (
            'No hay castigos disponibles'
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

      {/* Historial de castigos */}
      {recentResults.length > 0 && (
        <div className="glass-effect rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            📋 Historial de Castigos
          </h3>
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
        </div>
      )}

      {/* Información adicional */}
      <div className="glass-effect rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          📋 Cómo funciona
        </h3>
        <div className="space-y-2 text-sm text-foreground-muted">
          <p>• Gira la ruleta cuando tu profesor te lo indique</p>
          <p>• Los castigos se registran automáticamente</p>
          <p>• Completa tus castigos para mantener un buen historial</p>
          <p>• Los castigos se marcan como completados por tu profesor</p>
        </div>
      </div>
    </div>
  )
}

