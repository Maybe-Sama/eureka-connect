'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, AlertTriangle } from 'lucide-react'

interface PunishmentType {
  id?: number
  name: string
  description: string
  color: string
  severity: number
  is_active: boolean
}

interface PunishmentTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (punishment: PunishmentType) => void
  editingType?: PunishmentType | null
}

const severityOptions = [
  { value: 1, label: 'Muy Leve', color: '#10b981' },
  { value: 2, label: 'Leve', color: '#f59e0b' },
  { value: 3, label: 'Moderado', color: '#f97316' },
  { value: 4, label: 'Severo', color: '#ef4444' },
  { value: 5, label: 'Muy Severo', color: '#dc2626' }
]

const colorOptions = [
  '#fdd835', '#ffb300', '#fb8c00', '#f4511e', '#e53935',
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

export default function PunishmentTypeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingType 
}: PunishmentTypeModalProps) {
  const [formData, setFormData] = useState<PunishmentType>({
    name: '',
    description: '',
    color: '#fdd835',
    severity: 1,
    is_active: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editingType) {
      setFormData(editingType)
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#fdd835',
        severity: 1,
        is_active: true
      })
    }
    setErrors({})
  }, [editingType, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.color) {
      newErrors.color = 'El color es requerido'
    }

    if (formData.severity < 1 || formData.severity > 5) {
      newErrors.severity = 'La severidad debe estar entre 1 y 5'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSave(formData)
      onClose()
    }
  }

  const handleInputChange = (field: keyof PunishmentType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {editingType ? 'Editar Castigo' : 'Nuevo Castigo'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <X className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre del Castigo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.name ? 'border-red-500' : 'border-border'
                } bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                placeholder="Ej: 5 minutos extra de deberes"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Descripción detallada del castigo..."
              />
            </div>

            {/* Severidad */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Severidad *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {severityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('severity', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.severity === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div 
                        className="w-4 h-4 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: option.color }}
                      />
                      <p className="text-xs font-medium text-foreground">
                        {option.value}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {option.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {errors.severity && (
                <p className="text-red-500 text-sm mt-1">{errors.severity}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Color *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color', color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-primary scale-110'
                        : 'border-border hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              {errors.color && (
                <p className="text-red-500 text-sm mt-1">{errors.color}</p>
              )}
            </div>

            {/* Estado Activo */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm text-foreground">
                Castigo activo (disponible en la ruleta)
              </label>
            </div>

            {/* Preview */}
            <div className="p-4 bg-background-tertiary rounded-lg">
              <h3 className="text-sm font-medium text-foreground mb-2">Vista previa:</h3>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <div>
                  <p className="font-medium text-foreground">{formData.name}</p>
                  <p className="text-sm text-foreground-muted">{formData.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <AlertTriangle 
                      className="w-4 h-4" 
                      style={{ color: severityOptions.find(s => s.value === formData.severity)?.color }}
                    />
                    <span className="text-xs text-foreground-muted">
                      {severityOptions.find(s => s.value === formData.severity)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background-tertiary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingType ? 'Actualizar' : 'Crear'}</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
