'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Minus, 
  Calendar,
  Clock,
  User,
  Euro,
  RefreshCw,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { toast } from 'sonner'
import { parseDateAsLocal } from '@/lib/utils'

interface ClassComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  onClassesGenerated: () => void
  month?: string
}

interface ComparisonResult {
  studentId: number
  studentName: string
  status: string
  dateRange: { startDate: string; endDate: string }
  expectedClasses: number
  actualClasses: number
  missingClasses: number
  extraClasses: number
  missingClassesData: any[]
  extraClassesData: any[]
  summary: {
    totalExpected: number
    totalActual: number
    missing: number
    extra: number
    match: number
  }
}

interface ComparisonResponse {
  success: boolean
  results: ComparisonResult[]
  summary: {
    totalStudents: number
    studentsWithIssues: number
    totalMissingClasses: number
    totalExtraClasses: number
  }
}

const ClassComparisonModal = ({ 
  isOpen, 
  onClose, 
  onClassesGenerated, 
  month 
}: ClassComparisonModalProps) => {
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set())
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set())

  const fetchComparison = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/class-tracking/compare-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month }),
      })

      if (response.ok) {
        const data = await response.json()
        setComparisonData(data)
      } else {
        const error = await response.json()
        toast.error(`Error: ${error.error || 'No se pudo obtener la comparación'}`)
      }
    } catch (error) {
      console.error('Error fetching comparison:', error)
      toast.error('Error al obtener la comparación de clases')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchComparison()
    }
  }, [isOpen, month])

  const handleSelectAll = (studentId: number, missingClasses: any[]) => {
    const newSelected = new Set(selectedClasses)
    const studentKey = `student-${studentId}`
    
    // Check if all classes for this student are selected
    const allSelected = missingClasses.every(cls => 
      newSelected.has(`${studentKey}-${cls.date}-${cls.start_time}`)
    )
    
    if (allSelected) {
      // Deselect all classes for this student
      missingClasses.forEach(cls => {
        newSelected.delete(`${studentKey}-${cls.date}-${cls.start_time}`)
      })
    } else {
      // Select all classes for this student
      missingClasses.forEach(cls => {
        newSelected.add(`${studentKey}-${cls.date}-${cls.start_time}`)
      })
    }
    
    setSelectedClasses(newSelected)
  }

  const handleSelectClass = (studentId: number, classData: any) => {
    const newSelected = new Set(selectedClasses)
    const key = `student-${studentId}-${classData.date}-${classData.start_time}`
    
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    
    setSelectedClasses(newSelected)
  }

  const handleGenerateSelected = async () => {
    if (selectedClasses.size === 0) {
      toast.error('No hay clases seleccionadas para generar')
      return
    }

    try {
      setIsGenerating(true)
      
      // Convert selected classes to the format expected by the API
      const classesToGenerate = []
      
      if (comparisonData) {
        for (const result of comparisonData.results) {
          if (result.status === 'success' && result.missingClassesData.length > 0) {
            for (const classData of result.missingClassesData) {
              const key = `student-${result.studentId}-${classData.date}-${classData.start_time}`
              if (selectedClasses.has(key)) {
                classesToGenerate.push(classData)
              }
            }
          }
        }
      }

      const response = await fetch('/api/class-tracking/generate-selected-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedClasses: classesToGenerate }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.summary.totalCreated > 0) {
          toast.success(`✅ Se generaron ${result.summary.totalCreated} clases exitosamente`)
        }
        
        if (result.summary.totalSkipped > 0) {
          toast.info(`ℹ️ ${result.summary.totalSkipped} clases ya existían y se saltaron`)
        }
        
        if (result.summary.totalErrors > 0) {
          toast.error(`❌ ${result.summary.totalErrors} clases tuvieron errores`)
        }
        
        onClassesGenerated()
        onClose()
      } else {
        const error = await response.json()
        toast.error(`Error: ${error.error || 'No se pudieron generar las clases'}`)
      }
    } catch (error) {
      console.error('Error generating classes:', error)
      toast.error('Error al generar las clases seleccionadas')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleStudentExpansion = (studentId: number) => {
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId)
    } else {
      newExpanded.add(studentId)
    }
    setExpandedStudents(newExpanded)
  }

  const formatDate = (dateStr: string) => {
    return parseDateAsLocal(dateStr).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-xl border border-border shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              Comparación de Clases
            </h2>
            <p className="text-foreground-muted mt-1">
              Compara las clases esperadas vs las existentes y selecciona cuáles generar
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-foreground-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
                <p className="text-foreground-muted mt-4">Analizando clases...</p>
              </div>
            </div>
          ) : comparisonData ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="glass-effect rounded-lg p-4 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">Resumen General</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{comparisonData.summary.totalStudents}</p>
                    <p className="text-sm text-foreground-muted">Estudiantes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{comparisonData.summary.totalMissingClasses}</p>
                    <p className="text-sm text-foreground-muted">Clases Faltantes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{comparisonData.summary.totalExtraClasses}</p>
                    <p className="text-sm text-foreground-muted">Clases Extra</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">{comparisonData.summary.studentsWithIssues}</p>
                    <p className="text-sm text-foreground-muted">Con Problemas</p>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div className="space-y-4">
                {comparisonData.results.map((result) => (
                  <div key={result.studentId} className="bg-background rounded-lg border border-border">
                    <div 
                      className="p-4 cursor-pointer hover:bg-background-secondary transition-colors"
                      onClick={() => toggleStudentExpansion(result.studentId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{result.studentName}</h4>
                            <p className="text-sm text-foreground-muted">
                              {result.dateRange.startDate} - {result.dateRange.endDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">{result.summary.totalExpected}</p>
                            <p className="text-xs text-foreground-muted">Esperadas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-500">{result.summary.match}</p>
                            <p className="text-xs text-foreground-muted">Existentes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-orange-500">{result.summary.missing}</p>
                            <p className="text-xs text-foreground-muted">Faltantes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-500">{result.summary.extra}</p>
                            <p className="text-xs text-foreground-muted">Extra</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedStudents.has(result.studentId) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border"
                        >
                          <div className="p-4 space-y-4">
                            {/* Missing Classes */}
                            {result.missingClassesData.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-foreground flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    Clases Faltantes ({result.missingClassesData.length})
                                  </h5>
                                  <Button
                                    onClick={() => handleSelectAll(result.studentId, result.missingClassesData)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {result.missingClassesData.every(cls => 
                                      selectedClasses.has(`student-${result.studentId}-${cls.date}-${cls.start_time}`)
                                    ) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                  </Button>
                                </div>
                                <div className="grid gap-2">
                                  {result.missingClassesData.map((classData, index) => {
                                    const key = `student-${result.studentId}-${classData.date}-${classData.start_time}`
                                    const isSelected = selectedClasses.has(key)
                                    
                                    return (
                                      <div
                                        key={index}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                          isSelected 
                                            ? 'border-primary bg-primary/10' 
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                        onClick={() => handleSelectClass(result.studentId, classData)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                              isSelected ? 'border-primary bg-primary' : 'border-border'
                                            }`}>
                                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                            </div>
                                            <div>
                                              <p className="font-medium text-foreground">
                                                {formatDate(classData.date)} - {formatTime(classData.start_time)} a {formatTime(classData.end_time)}
                                              </p>
                                              <p className="text-sm text-foreground-muted">
                                                {classData.subject || 'Sin materia'} • €{classData.price.toFixed(2)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-foreground-muted" />
                                            <span className="text-sm text-foreground-muted">
                                              {Math.round(classData.duration / 60)}min
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Extra Classes */}
                            {result.extraClassesData.length > 0 && (
                              <div>
                                <h5 className="font-medium text-foreground flex items-center gap-2 mb-3">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  Clases Extra ({result.extraClassesData.length})
                                </h5>
                                <div className="grid gap-2">
                                  {result.extraClassesData.map((classData, index) => (
                                    <div
                                      key={index}
                                      className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium text-foreground">
                                            {formatDate(classData.date)} - {formatTime(classData.start_time)} a {formatTime(classData.end_time)}
                                          </p>
                                          <p className="text-sm text-foreground-muted">
                                            {classData.subject || 'Sin materia'} • €{classData.price.toFixed(2)}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-foreground-muted" />
                                          <span className="text-sm text-foreground-muted">
                                            {Math.round(classData.duration / 60)}min
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
              <p className="text-foreground-muted">No se pudo cargar la comparación</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-background-secondary">
          <div className="text-sm text-foreground-muted">
            {selectedClasses.size > 0 && (
              <span className="text-primary font-medium">
                {selectedClasses.size} clases seleccionadas
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateSelected}
              disabled={selectedClasses.size === 0 || isGenerating}
              className="bg-primary hover:bg-primary-hover"
            >
              {isGenerating ? (
                <>
                  <DiagonalBoxLoader size="sm" color="white" className="mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generar Seleccionadas ({selectedClasses.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ClassComparisonModal
