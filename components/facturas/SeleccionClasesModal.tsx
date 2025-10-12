'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  BookOpen, 
  Euro,
  User,
  Search,
  Filter,
  ArrowLeft,
  Users,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { ClasePagada, Student, ModalSeleccionClases } from '@/types'
import { formatearFechaFactura, formatearImporte } from '@/lib/rrsif-utils'

interface SeleccionClasesModalProps {
  modal: ModalSeleccionClases
  onClose: () => void
  onConfirmar: (clasesSeleccionadas: string[]) => void
  onSeleccionarEstudiante?: (studentId: string) => void
}

const SeleccionClasesModal = ({ modal, onClose, onConfirmar, onSeleccionarEstudiante }: SeleccionClasesModalProps) => {
  const [clasesSeleccionadas, setClasesSeleccionadas] = useState<string[]>(modal.clasesSeleccionadas)
  const [busqueda, setBusqueda] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fase, setFase] = useState<'estudiantes' | 'clases'>('estudiantes')
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Student | null>(null)

  // Obtener estudiantes únicos con clases pagadas
  const estudiantesConClases = modal.clasesPagadas.reduce((acc, clase) => {
    const studentId = clase.student.id
    if (!acc.find(s => s.id === studentId)) {
      acc.push(clase.student)
    }
    return acc
  }, [] as Student[])

  // Filtrar estudiantes
  const estudiantesFiltrados = estudiantesConClases.filter(estudiante => {
    const coincideBusqueda = estudiante.firstName.toLowerCase().includes(busqueda.toLowerCase()) ||
                            estudiante.lastName.toLowerCase().includes(busqueda.toLowerCase()) ||
                            estudiante.email.toLowerCase().includes(busqueda.toLowerCase())
    return coincideBusqueda
  })

  // Filtrar clases del estudiante seleccionado
  const clasesDelEstudiante = modal.clasesPagadas.filter(clase => 
    clase.student.id === estudianteSeleccionado?.id
  )

  const clasesFiltradas = clasesDelEstudiante.filter(clase => {
    const coincideBusqueda = clase.asignatura.toLowerCase().includes(busqueda.toLowerCase())
    const coincideFecha = filtroFecha === '' || clase.fecha.startsWith(filtroFecha)
    return coincideBusqueda && coincideFecha
  })

  // Calcular total seleccionado
  const totalSeleccionado = clasesFiltradas
    .filter(clase => clasesSeleccionadas.includes(clase.id))
    .reduce((sum, clase) => sum + clase.precio, 0)

  const handleSeleccionarEstudiante = (estudiante: Student) => {
    setEstudianteSeleccionado(estudiante)
    setFase('clases')
    setClasesSeleccionadas([])
    setBusqueda('')
    setFiltroFecha('')
  }

  const handleVolverAEstudiantes = () => {
    setFase('estudiantes')
    setEstudianteSeleccionado(null)
    setClasesSeleccionadas([])
    setBusqueda('')
    setFiltroFecha('')
  }

  const handleToggleClase = (claseId: string) => {
    setClasesSeleccionadas(prev => 
      prev.includes(claseId) 
        ? prev.filter(id => id !== claseId)
        : [...prev, claseId]
    )
  }

  const handleSeleccionarTodas = () => {
    const todasLasIds = clasesFiltradas.map(clase => clase.id)
    setClasesSeleccionadas(todasLasIds)
  }

  const handleDeseleccionarTodas = () => {
    setClasesSeleccionadas([])
  }

  const handleConfirmar = async () => {
    setIsLoading(true)
    try {
      await onConfirmar(clasesSeleccionadas)
      onClose()
    } catch (error) {
      console.error('Error confirmando selección:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (modal.isOpen) {
      setFase('estudiantes')
      setEstudianteSeleccionado(null)
      setClasesSeleccionadas([])
      setBusqueda('')
      setFiltroFecha('')
    }
  }, [modal.isOpen])

  if (!modal.isOpen) return null

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
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {fase === 'estudiantes' ? <Users size={20} className="text-primary" /> : <BookOpen size={20} className="text-primary" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {fase === 'estudiantes' ? 'Seleccionar Estudiante' : 'Seleccionar Clases para Factura'}
                  </h2>
                  <p className="text-sm text-foreground-muted">
                    {fase === 'estudiantes' 
                      ? 'Selecciona un estudiante para generar su factura'
                      : `${estudianteSeleccionado?.firstName} ${estudianteSeleccionado?.lastName}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {fase === 'clases' && (
                  <Button variant="ghost" size="sm" onClick={handleVolverAEstudiantes}>
                    <ArrowLeft size={16} className="mr-2" />
                    Volver
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" />
                  <input
                    type="text"
                    placeholder={fase === 'estudiantes' ? 'Buscar estudiante...' : 'Buscar por asignatura...'}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {fase === 'clases' && (
                <div className="flex gap-2">
                  <input
                    type="month"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeleccionarTodas}
                    disabled={clasesFiltradas.length === 0}
                  >
                    Seleccionar Todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeseleccionarTodas}
                    disabled={clasesSeleccionadas.length === 0}
                  >
                    Deseleccionar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {fase === 'estudiantes' ? (
              // Fase 1: Lista de estudiantes
              <div className="p-6">
                {estudiantesFiltrados.length > 0 ? (
                  <div className="space-y-3">
                    {estudiantesFiltrados.map((estudiante) => {
                      const clasesDelEstudiante = modal.clasesPagadas.filter(clase => clase.student.id === estudiante.id)
                      const totalClases = clasesDelEstudiante.length
                      const totalFacturado = clasesDelEstudiante.reduce((sum, clase) => sum + clase.precio, 0)
                      
                      return (
                        <motion.div
                          key={estudiante.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer bg-background hover:bg-muted/20"
                          onClick={() => handleSeleccionarEstudiante(estudiante)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User size={20} className="text-primary" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {estudiante.firstName} {estudiante.lastName}
                                </h3>
                                <p className="text-sm text-foreground-muted">{estudiante.email}</p>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-foreground-muted">
                                  <span>{totalClases} clase{totalClases !== 1 ? 's' : ''} pagada{totalClases !== 1 ? 's' : ''}</span>
                                  <span>Total: €{formatearImporte(totalFacturado)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Plus size={16} className="text-primary" />
                              <span className="text-sm text-primary font-medium">Seleccionar</span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center text-foreground-muted">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No hay estudiantes</h3>
                    <p>No se encontraron estudiantes con clases pagadas</p>
                  </div>
                )}
              </div>
            ) : (
              // Fase 2: Lista de clases del estudiante seleccionado
              <div className="p-6">
                {/* Datos del Receptor */}
                {estudianteSeleccionado && (
                  <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-info mb-2">
                      <User size={16} />
                      <span className="font-medium">Datos del Receptor (Alumno/Padre)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-foreground-muted">
                      <div>
                        <strong>Nombre:</strong> {estudianteSeleccionado.firstName} {estudianteSeleccionado.lastName}
                      </div>
                      <div>
                        <strong>Email:</strong> {estudianteSeleccionado.email || 'No especificado'}
                      </div>
                      <div>
                        <strong>Teléfono:</strong> {estudianteSeleccionado.phone || 'No especificado'}
                      </div>
                      <div>
                        <strong>Dirección:</strong> {estudianteSeleccionado.address || 'No especificada'}
                      </div>
                    </div>
                  </div>
                )}

                {clasesFiltradas.length > 0 ? (
                  <div className="space-y-3">
                    {clasesFiltradas.map((clase) => (
                      <motion.div
                        key={clase.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          clasesSeleccionadas.includes(clase.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleToggleClase(clase.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              clasesSeleccionadas.includes(clase.id)
                                ? 'border-primary bg-primary'
                                : 'border-border'
                            }`}>
                              {clasesSeleccionadas.includes(clase.id) && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2 text-sm text-foreground-muted">
                                  <Calendar size={14} />
                                  <span>{formatearFechaFactura(clase.fecha)}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-foreground-muted">
                                  <Clock size={14} />
                                  <span>{clase.hora_inicio} - {clase.hora_fin}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-foreground-muted">
                                  <BookOpen size={14} />
                                  <span>{clase.asignatura}</span>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Clock size={14} className="text-foreground-muted" />
                                  <span className="text-foreground-muted">
                                    {clase.duracion} min
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="flex items-center space-x-1 text-lg font-semibold text-foreground">
                                <Euro size={16} />
                                <span>{formatearImporte(clase.precio)}</span>
                              </div>
                              <div className="text-xs text-foreground-muted">
                                Pagado: {formatearFechaFactura(clase.payment_date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-foreground-muted">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No hay clases pagadas</h3>
                    <p>No se encontraron clases pagadas para este alumno</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {fase === 'clases' && (
            <div className="p-6 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground-muted">
                  {clasesSeleccionadas.length} clase{clasesSeleccionadas.length !== 1 ? 's' : ''} seleccionada{clasesSeleccionadas.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-foreground-muted">Total seleccionado:</div>
                    <div className="text-xl font-bold text-foreground">
                      €{formatearImporte(totalSeleccionado)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleConfirmar}
                      disabled={clasesSeleccionadas.length === 0 || isLoading}
                      className="flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <DiagonalBoxLoader size="sm" color="white" />
                      ) : (
                        <Check size={16} />
                      )}
                      <span>Generar Factura</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SeleccionClasesModal
