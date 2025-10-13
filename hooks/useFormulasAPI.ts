import { useState, useEffect, useCallback } from 'react'

export interface Formula {
  name: string
  formula: string
  subject: string
  category: string
  subcategory: string
  keywords: string[]
}

export interface SubjectStats {
  id: string
  name: string
  totalFormulas: number
  categories: string[]
}

export interface FormulasResponse {
  success: boolean
  data: {
    formulas: Formula[]
    total: number
    availableCategories: string[]
    subjects: SubjectStats[]
    pagination: {
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  error?: string
  message?: string
}

export interface SearchParams {
  query?: string
  subject?: string
  category?: string
  limit?: number
  offset?: number
}

export function useFormulasAPI() {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [subjects, setSubjects] = useState<SubjectStats[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Función para hacer la búsqueda
  const searchFormulas = useCallback(async (params: SearchParams = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (params.query) searchParams.set('query', params.query)
      if (params.subject) searchParams.set('subject', params.subject)
      if (params.category) searchParams.set('category', params.category)
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.offset) searchParams.set('offset', params.offset.toString())

      const response = await fetch(`/api/formulas?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: FormulasResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error en la respuesta del servidor')
      }

      setFormulas(result.data.formulas)
      setSubjects(result.data.subjects)
      setAvailableCategories(result.data.availableCategories)
      setTotal(result.data.total)
      setHasMore(result.data.pagination.hasMore)

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error searching formulas:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Función para búsqueda con POST (más robusta para queries complejas)
  const searchFormulasPOST = useCallback(async (params: SearchParams = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/formulas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: FormulasResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error en la respuesta del servidor')
      }

      setFormulas(result.data.formulas)
      setSubjects(result.data.subjects)
      setAvailableCategories(result.data.availableCategories)
      setTotal(result.data.total)
      setHasMore(result.data.pagination.hasMore)

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error searching formulas:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    await searchFormulas({ limit: 50 })
  }, [searchFormulas])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Función para obtener categorías de una materia específica
  const getCategoriesForSubject = useCallback((subjectId: string): string[] => {
    if (subjectId === 'todas') {
      return availableCategories
    }
    return subjects.find(s => s.id === subjectId)?.categories || []
  }, [subjects, availableCategories])

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Función para recargar datos
  const reload = useCallback(() => {
    return loadInitialData()
  }, [loadInitialData])

  return {
    // Estado
    formulas,
    subjects,
    availableCategories,
    isLoading,
    error,
    total,
    hasMore,
    
    // Acciones
    searchFormulas,
    searchFormulasPOST,
    getCategoriesForSubject,
    clearError,
    reload
  }
}
