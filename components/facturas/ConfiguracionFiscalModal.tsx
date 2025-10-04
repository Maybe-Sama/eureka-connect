'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Save, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FiscalData, ReceptorData } from '@/types'
import { validarDatosFiscales, validarDatosReceptor } from '@/lib/rrsif-utils'

interface ConfiguracionFiscalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (datosFiscales: FiscalData, datosReceptor: ReceptorData) => void
  datosFiscales?: FiscalData
  datosReceptor?: ReceptorData
}

const ConfiguracionFiscalModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  datosFiscales: datosFiscalesIniciales,
  datosReceptor: datosReceptorIniciales 
}: ConfiguracionFiscalModalProps) => {
  const [datosFiscales, setDatosFiscales] = useState<FiscalData>({
    nif: '',
    nombre: '',
    direccion: '',
    codigoPostal: '',
    municipio: '',
    provincia: '',
    pais: 'España',
    telefono: '',
    email: '',
    regimenFiscal: 'autonomo',
    actividadEconomica: '',
    codigoActividad: '',
    ...datosFiscalesIniciales
  })

  const [datosReceptor, setDatosReceptor] = useState<ReceptorData>({
    nif: '',
    nombre: '',
    direccion: '',
    codigoPostal: '',
    municipio: '',
    provincia: '',
    pais: 'España',
    telefono: '',
    email: '',
    ...datosReceptorIniciales
  })

  const [erroresFiscales, setErroresFiscales] = useState<string[]>([])
  const [erroresReceptor, setErroresReceptor] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Validar datos al abrir el modal
      validarDatos()
    }
  }, [isOpen, datosFiscales, datosReceptor])

  const validarDatos = () => {
    const erroresF = validarDatosFiscales(datosFiscales)
    
    setErroresFiscales(erroresF)
    setErroresReceptor([]) // No validar receptor
  }

  const handleSave = async () => {
    validarDatos()
    
    if (erroresFiscales.length > 0) {
      return
    }

    setIsLoading(true)
    try {
      // Solo pasar datos fiscales, los datos del receptor se obtendrán del alumno
      await onSave(datosFiscales, undefined)
      onClose()
    } catch (error) {
      console.error('Error guardando configuración fiscal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Configuración Fiscal
                </h2>
                <p className="text-sm text-foreground-muted">
                  Datos fiscales para facturación RRSIF
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(80vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Datos Fiscales del Emisor */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Building size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Datos del Emisor (Profesor)
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      NIF *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.nif}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, nif: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="12345678A"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nombre/Razón Social *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.nombre}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nombre completo o razón social"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.direccion}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, direccion: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Calle, número, piso, puerta"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.codigoPostal}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, codigoPostal: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="28001"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Municipio *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.municipio}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, municipio: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Madrid"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Provincia *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.provincia}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, provincia: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Madrid"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      País *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.pais}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, pais: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="España"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={datosFiscales.telefono}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={datosFiscales.email}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="profesor@ejemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Régimen Fiscal *
                    </label>
                    <select
                      value={datosFiscales.regimenFiscal}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, regimenFiscal: e.target.value as 'autonomo' | 'sociedad' }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="autonomo">Autónomo</option>
                      <option value="sociedad">Sociedad</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Actividad Económica *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.actividadEconomica}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, actividadEconomica: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enseñanza privada"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Código de Actividad *
                    </label>
                    <input
                      type="text"
                      value={datosFiscales.codigoActividad}
                      onChange={(e) => setDatosFiscales(prev => ({ ...prev, codigoActividad: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="85.59.1"
                    />
                  </div>
                </div>
                
                {/* Errores fiscales */}
                {erroresFiscales.length > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-destructive">
                      <AlertCircle size={16} />
                      <span className="font-medium">Errores en datos fiscales:</span>
                    </div>
                    <ul className="mt-2 text-sm text-destructive">
                      {erroresFiscales.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Información sobre datos del receptor */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Datos del Receptor
                  </h3>
                </div>
                
                <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-info mb-2">
                    <AlertCircle size={16} />
                    <span className="font-medium">Información</span>
                  </div>
                  <p className="text-sm text-foreground-muted">
                    Los datos del receptor (alumno/padre) se obtendrán automáticamente 
                    desde el formulario del alumno seleccionado. No es necesario 
                    configurarlos aquí.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground-muted">
                Los campos marcados con * son obligatorios
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={erroresFiscales.length > 0 || isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Guardar Configuración</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ConfiguracionFiscalModal
