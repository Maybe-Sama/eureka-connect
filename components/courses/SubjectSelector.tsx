'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, BookOpen, GraduationCap, Users, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import subjectsData from '@/data/subjects.json'

interface SubjectSelectorProps {
  selectedSubject: string
  onSubjectChange: (subject: string) => void
  placeholder?: string
}

export function SubjectSelector({ selectedSubject, onSubjectChange, placeholder = "Buscar asignatura..." }: SubjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

  // Filter subjects based on search term and category
  const filteredSubjects = useMemo(() => {
    return allSubjects.filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || subject.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [allSubjects, searchTerm, selectedCategory])

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'primaria':
        return <BookOpen size={16} className="text-blue-500" />
      case 'secundaria':
        return <GraduationCap size={16} className="text-green-500" />
      case 'bachillerato':
        return <Users size={16} className="text-purple-500" />
      case 'idiomas':
        return <Globe size={16} className="text-orange-500" />
      case 'especialidades':
        return <BookOpen size={16} className="text-red-500" />
      default:
        return <BookOpen size={16} className="text-gray-500" />
    }
  }

  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'primaria':
        return 'Primaria'
      case 'secundaria':
        return 'Secundaria (ESO)'
      case 'bachillerato':
        return 'Bachillerato'
      case 'idiomas':
        return 'Idiomas'
      case 'especialidades':
        return 'Especialidades'
      default:
        return 'Todas'
    }
  }

  const categories = [
    { value: 'all', label: 'Todas las asignaturas' },
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria (ESO)' },
    { value: 'bachillerato', label: 'Bachillerato' },
    { value: 'idiomas', label: 'Idiomas' },
    { value: 'especialidades', label: 'Especialidades' }
  ]

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">
        Asignatura
      </label>
      
      {/* Input field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={16} />
        <input
          type="text"
          value={selectedSubject}
          onChange={(e) => {
            onSubjectChange(e.target.value)
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background-secondary border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Category filter */}
          <div className="p-3 border-b border-border">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition-colors",
                    selectedCategory === category.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-background-tertiary"
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search results */}
          <div className="max-h-60 overflow-y-auto">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject, index) => (
                <button
                  key={`${subject.category}-${index}`}
                  onClick={() => {
                    onSubjectChange(subject.name)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-background-tertiary transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(subject.category)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{subject.name}</p>
                      <p className="text-xs text-foreground-muted">{subject.level}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-foreground-muted">
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p>No se encontraron asignaturas</p>
                <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
