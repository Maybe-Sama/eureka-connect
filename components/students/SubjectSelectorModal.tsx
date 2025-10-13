'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, BookOpen, GraduationCap, Users, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

// Importar datos de asignaturas de manera dinámica
const subjectsData = {
  "primaria": {
    "1_primaria": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Artística", "Educación Física", "Religión/Valores Sociales y Cívicos", "Inglés"],
    "2_primaria": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Artística", "Educación Física", "Religión/Valores Sociales y Cívicos", "Inglés"],
    "3_primaria": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Artística", "Educación Física", "Religión/Valores Sociales y Cívicos", "Inglés"],
    "4_primaria": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Artística", "Educación Física", "Religión/Valores Sociales y Cívicos", "Inglés"],
    "5_primaria": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Artística", "Educación Física", "Religión/Valores Sociales y Cívicos", "Inglés"],
    "6_primaria": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Artística", "Educación Física", "Religión/Valores Sociales y Cívicos", "Inglés"]
  },
  "secundaria": {
    "1_eso": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Física", "Religión/Valores Éticos", "Inglés", "Francés", "Alemán", "Educación Plástica, Visual y Audiovisual", "Música", "Tecnología y Digitalización"],
    "2_eso": ["Lengua Castellana y Literatura", "Matemáticas", "Ciencias de la Naturaleza", "Ciencias Sociales", "Educación Física", "Religión/Valores Éticos", "Inglés", "Francés", "Alemán", "Educación Plástica, Visual y Audiovisual", "Música", "Tecnología y Digitalización"],
    "3_eso": ["Lengua Castellana y Literatura", "Matemáticas", "Física y Química", "Biología y Geología", "Geografía e Historia", "Educación Física", "Religión/Valores Éticos", "Inglés", "Francés", "Alemán", "Educación Plástica, Visual y Audiovisual", "Música", "Tecnología y Digitalización"],
    "4_eso": ["Lengua Castellana y Literatura", "Matemáticas", "Física y Química", "Biología y Geología", "Geografía e Historia", "Educación Física", "Religión/Valores Éticos", "Inglés", "Francés", "Alemán", "Educación Plástica, Visual y Audiovisual", "Música", "Tecnología y Digitalización"]
  },
  "bachillerato": {
    "1_bachillerato": {
      "ciencias": ["Matemáticas I", "Física y Química", "Biología y Geología", "Dibujo Técnico I", "Tecnología e Ingeniería I"],
      "letras": ["Lengua Castellana y Literatura I", "Historia del Mundo Contemporáneo", "Filosofía", "Latín I", "Griego I"],
      "humanidades": ["Lengua Castellana y Literatura I", "Historia del Mundo Contemporáneo", "Filosofía", "Latín I", "Griego I"],
      "ciencias_sociales": ["Matemáticas Aplicadas a las Ciencias Sociales I", "Economía", "Historia del Mundo Contemporáneo", "Filosofía", "Latín I"]
    },
    "2_bachillerato": {
      "ciencias": ["Matemáticas II", "Física", "Química", "Biología", "Dibujo Técnico II", "Tecnología e Ingeniería II"],
      "letras": ["Lengua Castellana y Literatura II", "Historia de España", "Filosofía", "Latín II", "Griego II"],
      "humanidades": ["Lengua Castellana y Literatura II", "Historia de España", "Filosofía", "Latín II", "Griego II"],
      "ciencias_sociales": ["Matemáticas Aplicadas a las Ciencias Sociales II", "Economía de la Empresa", "Historia de España", "Filosofía", "Geografía"]
    }
  },
  "idiomas": ["Inglés", "Francés", "Alemán", "Italiano", "Portugués", "Chino", "Japonés", "Ruso", "Árabe"],
  "especialidades": ["Música", "Arte", "Deportes", "Robótica", "Programación", "Diseño Gráfico", "Fotografía", "Teatro", "Danza", "Pintura", "Escultura", "Cocina"]
}

interface SubjectSelectorModalProps {
  selectedSubject: string
  onSubjectChange: (subject: string) => void
  placeholder?: string
  className?: string
}

export function SubjectSelectorModal({ 
  selectedSubject, 
  onSubjectChange, 
  placeholder = "Buscar asignatura...",
  className 
}: SubjectSelectorModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Flatten all subjects into a searchable array
  const allSubjects = useMemo(() => {
    const subjects: Array<{ name: string; category: string; level: string }> = []
    
    // Primaria
    Object.entries(subjectsData.primaria).forEach(([level, subjectsList]) => {
      subjectsList.forEach(subject => {
        subjects.push({
          name: subject,
          category: 'primaria',
          level: level.replace('_', ' ').toUpperCase()
        })
      })
    })
    
    // Secundaria
    Object.entries(subjectsData.secundaria).forEach(([level, subjectsList]) => {
      subjectsList.forEach(subject => {
        subjects.push({
          name: subject,
          category: 'secundaria',
          level: level.replace('_', ' ').toUpperCase()
        })
      })
    })
    
    // Bachillerato
    Object.entries(subjectsData.bachillerato).forEach(([level, branches]) => {
      Object.entries(branches).forEach(([branch, subjectsList]) => {
        subjectsList.forEach(subject => {
          subjects.push({
            name: subject,
            category: 'bachillerato',
            level: `${level.replace('_', ' ').toUpperCase()} - ${branch.toUpperCase()}`
          })
        })
      })
    })
    
    // Idiomas
    subjectsData.idiomas.forEach(language => {
      subjects.push({
        name: language,
        category: 'idiomas',
        level: 'IDIOMAS'
      })
    })
    
    // Especialidades
    subjectsData.especialidades.forEach(specialty => {
      subjects.push({
        name: specialty,
        category: 'especialidades',
        level: 'ESPECIALIDADES'
      })
    })
    
    return subjects
  }, [])

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

  // Filter subjects based on search term and category
  const filteredSubjects = useMemo(() => {
    return allSubjects.filter(subject => {
      const normalizedSearchTerm = normalizeText(searchTerm)
      const normalizedSubjectName = normalizeText(subject.name)
      const matchesSearch = normalizedSubjectName.includes(normalizedSearchTerm)
      const matchesCategory = selectedCategory === 'all' || subject.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [allSubjects, searchTerm, selectedCategory])

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'primaria':
        return <BookOpen size={14} className="text-blue-500" />
      case 'secundaria':
        return <GraduationCap size={14} className="text-green-500" />
      case 'bachillerato':
        return <Users size={14} className="text-purple-500" />
      case 'idiomas':
        return <Globe size={14} className="text-orange-500" />
      case 'especialidades':
        return <BookOpen size={14} className="text-red-500" />
      default:
        return <BookOpen size={14} className="text-gray-500" />
    }
  }

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'ESO' },
    { value: 'bachillerato', label: 'Bachillerato' },
    { value: 'idiomas', label: 'Idiomas' },
    { value: 'especialidades', label: 'Especialidades' }
  ]

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
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[70] w-full mt-1 bg-background-secondary border border-border rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Category filter */}
          <div className="p-2 border-b border-border">
            <div className="flex flex-wrap gap-1">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    selectedCategory === category.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-background-tertiary"
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search results */}
          <div className="max-h-48 overflow-y-auto">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.slice(0, 20).map((subject, index) => (
                <button
                  key={`${subject.category}-${index}`}
                  onClick={() => handleSubjectSelect(subject.name)}
                  className="w-full px-3 py-2 text-left hover:bg-background-tertiary transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(subject.category)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{subject.name}</p>
                      <p className="text-xs text-foreground-muted truncate">{subject.level}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-foreground-muted">
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




