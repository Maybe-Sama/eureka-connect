import { useState, useEffect } from 'react'

export interface Formula {
  name: string
  formula: string
  subject: string
  category: string
  subcategory: string
  keywords: string[]
}

export interface SubjectData {
  id: string
  name: string
  categories: string[]
  totalFormulas: number
}

const SUBJECTS = [
  { id: 'matematicas', name: 'Matemáticas', file: 'formulas_matematicas.json' },
  { id: 'fisica', name: 'Física', file: 'formulas_fisica.json' },
  { id: 'quimica', name: 'Química', file: 'formulas_quimica.json' },
  { id: 'economia', name: 'Economía', file: 'formulas_economia.json' },
  { id: 'tecnologia', name: 'Tecnología', file: 'formulas_tecnologia.json' }
]

export function useFormulas() {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para aplanar las fórmulas de un archivo JSON
  const flattenFormulas = (data: any, subjectId: string, subjectName: string): Formula[] => {
    const formulas: Formula[] = []
    
    Object.entries(data).forEach(([category, subcategories]) => {
      Object.entries(subcategories as any).forEach(([subcategory, formulasInSubcategory]) => {
        Object.entries(formulasInSubcategory as any).forEach(([name, formula]) => {
          // Asegurar que formula sea string
          const formulaStr = String(formula)
          
          // Generar keywords para búsqueda
          const keywords = [
            name.toLowerCase(),
            formulaStr.toLowerCase(),
            category.toLowerCase(),
            subcategory.toLowerCase(),
            subjectName.toLowerCase()
          ]
          
          formulas.push({
            name,
            formula: formulaStr,
            subject: subjectId,
            category,
            subcategory,
            keywords
          })
        })
      })
    })
    
    return formulas
  }

  // Función para cargar un archivo JSON
  const loadSubjectData = async (subject: typeof SUBJECTS[0]): Promise<{ formulas: Formula[], subjectData: SubjectData }> => {
    try {
      const response = await fetch(`/formulas/${subject.file}`)
      if (!response.ok) {
        throw new Error(`Error cargando ${subject.name}`)
      }
      
      const data = await response.json()
      const formulas = flattenFormulas(data, subject.id, subject.name)
      
      // Extraer categorías únicas
      const categories = Array.from(new Set(formulas.map(f => f.category)))
      
      const subjectData: SubjectData = {
        id: subject.id,
        name: subject.name,
        categories,
        totalFormulas: formulas.length
      }
      
      return { formulas, subjectData }
    } catch (err) {
      console.error(`Error cargando ${subject.name}:`, err)
      throw err
    }
  }

  // Cargar todas las fórmulas
  useEffect(() => {
    const loadAllFormulas = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Iniciando carga de fórmulas...')
        const promises = SUBJECTS.map(loadSubjectData)
        const results = await Promise.all(promises)
        
        console.log('Resultados cargados:', results)
        
        // Combinar todas las fórmulas
        const allFormulas = results.flatMap(result => result.formulas)
        console.log('Total de fórmulas cargadas:', allFormulas.length)
        
        // Combinar todos los datos de materias
        const allSubjects = results.map(result => result.subjectData)
        console.log('Materias cargadas:', allSubjects)
        
        setFormulas(allFormulas)
        setSubjects(allSubjects)
      } catch (err) {
        console.error('Error cargando fórmulas:', err)
        setError(err instanceof Error ? err.message : 'Error cargando las fórmulas')
      } finally {
        setIsLoading(false)
      }
    }

    loadAllFormulas()
  }, [])

  // Función para buscar fórmulas
  const searchFormulas = (query: string, selectedSubject: string, selectedCategory: string): Formula[] => {
    return formulas.filter(formula => {
      // Filtro por materia
      const matchesSubject = selectedSubject === 'todas' || formula.subject === selectedSubject
      
      // Filtro por categoría
      const matchesCategory = selectedCategory === 'todas' || formula.category === selectedCategory
      
      // Filtro por búsqueda
      const matchesQuery = query === '' || 
        formula.keywords.some(keyword => keyword.includes(query.toLowerCase()))
      
      return matchesSubject && matchesCategory && matchesQuery
    })
  }

  // Obtener categorías de una materia específica
  const getCategoriesForSubject = (subjectId: string): string[] => {
    if (subjectId === 'todas') {
      return Array.from(new Set(formulas.map(f => f.category)))
    }
    return subjects.find(s => s.id === subjectId)?.categories || []
  }

  return {
    formulas,
    subjects,
    isLoading,
    error,
    searchFormulas,
    getCategoriesForSubject
  }
}
