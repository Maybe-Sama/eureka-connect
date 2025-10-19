'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import subjectsData from '@/data/subjects.json'

interface CourseFilteredSubjectSelectorProps {
  selectedSubject: string
  onSubjectChange: (subject: string) => void
  courseName: string
  subjectGroup?: string  // Nuevo: grupo de asignaturas del curso
  placeholder?: string
  className?: string
}

export function CourseFilteredSubjectSelector({ 
  selectedSubject, 
  onSubjectChange, 
  courseName,
  subjectGroup,
  placeholder = "Selecciona una asignatura...",
  className 
}: CourseFilteredSubjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Función para obtener asignaturas desde subjects.json usando el subjectGroup
  const getSubjectsFromGroup = (): string[] => {
    if (!subjectGroup) {
      // Fallback: usar la lógica antigua si no hay subjectGroup
      return getFallbackSubjects()
    }

    try {
      const parts = subjectGroup.split('.')
      
      // Caso especial para idiomas y especialidades
      if (parts.length === 1) {
        if (parts[0] === 'idiomas') {
          return subjectsData.idiomas
        }
        if (parts[0] === 'especialidades') {
          return subjectsData.especialidades
        }
      }
      
      // Para primaria y secundaria: nivel.curso
      if (parts.length === 2) {
        const [level, course] = parts
        if (level === 'primaria' && subjectsData.primaria[course as keyof typeof subjectsData.primaria]) {
          return subjectsData.primaria[course as keyof typeof subjectsData.primaria]
        }
        if (level === 'secundaria' && subjectsData.secundaria[course as keyof typeof subjectsData.secundaria]) {
          return subjectsData.secundaria[course as keyof typeof subjectsData.secundaria]
        }
      }
      
      // Para bachillerato: nivel.curso.modalidad
      if (parts.length === 3) {
        const [level, course, branch] = parts
        if (level === 'bachillerato') {
          const bachData = subjectsData.bachillerato[course as keyof typeof subjectsData.bachillerato]
          if (bachData && bachData[branch as keyof typeof bachData]) {
            return bachData[branch as keyof typeof bachData] as string[]
          }
        }
      }
      
      // Si no se encuentra, usar fallback
      console.warn(`No se encontró el grupo de asignaturas: ${subjectGroup}`)
      return getFallbackSubjects()
      
    } catch (error) {
      console.error('Error obteniendo asignaturas del grupo:', error)
      return getFallbackSubjects()
    }
  }

  // Función fallback: lógica antigua basada en palabras clave del nombre del curso
  const getFallbackSubjects = (): string[] => {
    const course = courseName.toLowerCase()
    
    // Mapear nombres de cursos a asignaturas específicas (lógica antigua)
    if (course.includes('matemáticas') || course.includes('matematicas')) {
      return [
        'Matemáticas',
        'Matemáticas Aplicadas a las Ciencias Sociales I',
        'Matemáticas Aplicadas a las Ciencias Sociales II',
        'Matemáticas I',
        'Matemáticas II',
        'Álgebra',
        'Geometría',
        'Trigonometría',
        'Cálculo',
        'Estadística'
      ]
    } else if (course.includes('física') || course.includes('fisica')) {
      return [
        'Física',
        'Física y Química',
        'Física I',
        'Física II',
        'Mecánica',
        'Termodinámica',
        'Óptica',
        'Electricidad y Magnetismo',
        'Física Cuántica'
      ]
    } else if (course.includes('química') || course.includes('quimica')) {
      return [
        'Química',
        'Química Orgánica',
        'Química Inorgánica',
        'Física y Química',
        'Biología y Geología',
        'Química Analítica',
        'Bioquímica'
      ]
    } else if (course.includes('lengua') || course.includes('literatura')) {
      return [
        'Lengua Castellana y Literatura',
        'Lengua Castellana y Literatura I',
        'Lengua Castellana y Literatura II',
        'Comentario de Texto',
        'Sintaxis',
        'Morfología',
        'Literatura Universal',
        'Literatura Española'
      ]
    } else if (course.includes('historia')) {
      return [
        'Historia del Mundo Contemporáneo',
        'Historia de España',
        'Geografía e Historia',
        'Historia del Arte',
        'Historia Universal',
        'Geografía',
        'Historia de la Filosofía'
      ]
    } else if (course.includes('inglés') || course.includes('ingles')) {
      return [
        'Inglés',
        'Primera Lengua Extranjera I (Inglés)',
        'Primera Lengua Extranjera II (Inglés)',
        'English Grammar',
        'English Literature',
        'English Conversation',
        'Business English'
      ]
    } else if (course.includes('biología') || course.includes('biologia')) {
      return [
        'Biología',
        'Biología y Geología',
        'Ciencias de la Naturaleza',
        'Anatomía',
        'Fisiología',
        'Genética',
        'Ecología',
        'Microbiología'
      ]
    } else if (course.includes('francés') || course.includes('frances')) {
      return [
        'Francés',
        'Segunda Lengua Extranjera I (Francés)',
        'Segunda Lengua Extranjera II (Francés)',
        'Français',
        'Littérature Française'
      ]
    } else if (course.includes('alemán') || course.includes('aleman')) {
      return [
        'Alemán',
        'Segunda Lengua Extranjera I (Alemán)',
        'Segunda Lengua Extranjera II (Alemán)',
        'Deutsch',
        'Deutsche Literatur'
      ]
    } else {
      // Si no se puede mapear específicamente, devolver asignaturas generales
      return [
        'Matemáticas',
        'Lengua Castellana y Literatura',
        'Física y Química',
        'Biología y Geología',
        'Geografía e Historia',
        'Inglés',
        'Educación Física',
        'Tecnología y Digitalización',
        'Filosofía',
        'Economía'
      ]
    }
  }

  // Obtener asignaturas usando useMemo para mejor rendimiento
  const filteredSubjects = useMemo(() => getSubjectsFromGroup(), [subjectGroup, courseName])

  // Función para normalizar texto (quitar acentos y convertir a minúsculas)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
  }

  // Filtrar por término de búsqueda
  const searchFilteredSubjects = filteredSubjects.filter(subject => {
    const normalizedSearchTerm = normalizeText(searchTerm)
    const normalizedSubjectName = normalizeText(subject)
    return normalizedSubjectName.includes(normalizedSearchTerm)
  })

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Manejar selección de asignatura
  const handleSubjectSelect = (subjectName: string) => {
    onSubjectChange(subjectName)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Manejar apertura del dropdown
  const handleInputFocus = () => {
    setSearchTerm(selectedSubject)
    setIsOpen(true)
  }

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsOpen(true)
  }

  // Limpiar selección
  const handleClear = () => {
    onSubjectChange('')
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="block text-sm font-medium text-foreground mb-2">
        Asignatura
      </label>
      
      {/* Input field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted pointer-events-none" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedSubject}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        {selectedSubject && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[70] w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Header con información del curso */}
          <div className="p-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center space-x-2">
              <BookOpen size={16} className="text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">Asignaturas para:</p>
                <p className="text-xs text-gray-300">{courseName}</p>
                {subjectGroup && (
                  <p className="text-xs text-gray-400 mt-1">
                    Grupo: {subjectGroup.replace(/\./g, ' › ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search results */}
          <div className="max-h-48 overflow-y-auto">
            {searchFilteredSubjects.length > 0 ? (
              searchFilteredSubjects.map((subject, index) => (
                <button
                  key={`${subject}-${index}`}
                  onClick={() => handleSubjectSelect(subject)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen size={14} className="text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{subject}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-gray-400">
                <Search size={20} className="mx-auto mb-1 opacity-50" />
                <p className="text-xs">No se encontraron asignaturas</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
