import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Formula {
  name: string
  formula: string
  subject: string
  category: string
  subcategory: string
  keywords: string[]
}

interface SearchParams {
  query?: string
  subject?: string
  category?: string
  limit?: number
  offset?: number
}

// Cache para las fórmulas cargadas
let formulasCache: Formula[] | null = null
let lastLoadTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

const SUBJECTS = [
  { id: 'matematicas', name: 'Matemáticas', file: 'formulas_matematicas.json' },
  { id: 'fisica', name: 'Física', file: 'formulas_fisica.json' },
  { id: 'quimica', name: 'Química', file: 'formulas_quimica.json' },
  { id: 'economia', name: 'Economía', file: 'formulas_economia.json' },
  { id: 'tecnologia', name: 'Tecnología', file: 'formulas_tecnologia.json' }
]

// Función para cargar todas las fórmulas
async function loadAllFormulas(): Promise<Formula[]> {
  const now = Date.now()
  
  // Verificar si el cache es válido
  if (formulasCache && (now - lastLoadTime) < CACHE_DURATION) {
    return formulasCache
  }

  try {
    const allFormulas: Formula[] = []
    
    // Cargar todos los archivos JSON
    for (const subject of SUBJECTS) {
      const filePath = path.join(process.cwd(), 'public', 'formulas', subject.file)
      console.log('Loading file:', filePath)
      console.log('File exists:', fs.existsSync(filePath))
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(fileContent)
        console.log(`Data keys for ${subject.name}:`, Object.keys(data))
        
        // Convertir a formato plano
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
                subject.name.toLowerCase()
              ]
              
              allFormulas.push({
                name,
                formula: formulaStr,
                subject: subject.id,
                category,
                subcategory,
                keywords
              })
            })
          })
        })
        
        console.log(`Formulas loaded for ${subject.name}:`, allFormulas.filter(f => f.subject === subject.id).length)
      } else {
        console.warn(`File not found: ${filePath}`)
      }
    }
    
    console.log('Total formulas loaded:', allFormulas.length)
    
    // Actualizar cache
    formulasCache = allFormulas
    lastLoadTime = now
    
    return allFormulas
  } catch (error) {
    console.error('Error loading formulas:', error)
    throw new Error(`Error cargando las fórmulas: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

// Función para buscar fórmulas
function searchFormulas(formulas: Formula[], params: SearchParams): Formula[] {
  let filtered = formulas

  // Filtro por materia
  if (params.subject && params.subject !== 'todas') {
    filtered = filtered.filter(f => f.subject === params.subject)
  }

  // Filtro por categoría
  if (params.category && params.category !== 'todas') {
    filtered = filtered.filter(f => f.category === params.category)
  }

  // Filtro por búsqueda
  if (params.query && params.query.trim()) {
    const query = params.query.toLowerCase().trim()
    filtered = filtered.filter(f => 
      f.keywords.some(keyword => keyword.includes(query))
    )
  }

  // Aplicar paginación
  const offset = params.offset || 0
  const limit = params.limit || 50
  
  return filtered.slice(offset, offset + limit)
}

// Función para obtener categorías de una materia
function getCategoriesForSubject(formulas: Formula[], subjectId: string): string[] {
  if (subjectId === 'todas') {
    return Array.from(new Set(formulas.map(f => f.category)))
  }
  
  return Array.from(new Set(
    formulas
      .filter(f => f.subject === subjectId)
      .map(f => f.category)
  ))
}

// GET - Obtener fórmulas con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params: SearchParams = {
      query: searchParams.get('query') || undefined,
      subject: searchParams.get('subject') || 'todas',
      category: searchParams.get('category') || 'todas',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    // Cargar todas las fórmulas
    const allFormulas = await loadAllFormulas()
    
    // Buscar fórmulas
    const filteredFormulas = searchFormulas(allFormulas, params)
    
    // Obtener categorías disponibles
    const availableCategories = getCategoriesForSubject(allFormulas, params.subject)
    
    // Obtener estadísticas por materia
    const subjectsStats = SUBJECTS.map(subject => ({
      id: subject.id,
      name: subject.name,
      totalFormulas: allFormulas.filter(f => f.subject === subject.id).length,
      categories: getCategoriesForSubject(allFormulas, subject.id)
    }))

    return NextResponse.json({
      success: true,
      data: {
        formulas: filteredFormulas,
        total: filteredFormulas.length,
        availableCategories,
        subjects: subjectsStats,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          hasMore: (params.offset + params.limit) < allFormulas.length
        }
      }
    })
  } catch (error) {
    console.error('Error in formulas API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// POST - Búsqueda avanzada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params: SearchParams = {
      query: body.query,
      subject: body.subject || 'todas',
      category: body.category || 'todas',
      limit: body.limit || 50,
      offset: body.offset || 0
    }

    // Cargar todas las fórmulas
    const allFormulas = await loadAllFormulas()
    
    // Buscar fórmulas
    const filteredFormulas = searchFormulas(allFormulas, params)
    
    // Obtener categorías disponibles
    const availableCategories = getCategoriesForSubject(allFormulas, params.subject)

    return NextResponse.json({
      success: true,
      data: {
        formulas: filteredFormulas,
        total: filteredFormulas.length,
        availableCategories,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          hasMore: (params.offset + params.limit) < allFormulas.length
        }
      }
    })
  } catch (error) {
    console.error('Error in formulas POST API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
