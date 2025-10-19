'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, BookOpen, GraduationCap, Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import subjectsData from '@/data/subjects.json'

interface SubjectGroupSelectorProps {
  selectedGroup: string
  onGroupChange: (group: string) => void
  className?: string
}

interface SubjectGroup {
  value: string
  label: string
  category: string
  icon: React.ReactNode
  subjectsCount: number
}

export function SubjectGroupSelector({ 
  selectedGroup, 
  onGroupChange, 
  className 
}: SubjectGroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generar grupos dinámicamente desde subjects.json
  const subjectGroups: SubjectGroup[] = useMemo(() => {
    const groups: SubjectGroup[] = []

    // Primaria
    Object.entries(subjectsData.primaria).forEach(([key, subjects]) => {
      const courseName = key.replace('_', 'º ')
      groups.push({
        value: `primaria.${key}`,
        label: `${courseName} Primaria`,
        category: 'Primaria',
        icon: <BookOpen size={16} className="text-blue-500" />,
        subjectsCount: subjects.length
      })
    })

    // Secundaria (ESO)
    Object.entries(subjectsData.secundaria).forEach(([key, subjects]) => {
      const courseName = key.replace('_', 'º ')
      groups.push({
        value: `secundaria.${key}`,
        label: `${courseName} ESO`,
        category: 'Secundaria',
        icon: <GraduationCap size={16} className="text-green-500" />,
        subjectsCount: subjects.length
      })
    })

    // Bachillerato
    Object.entries(subjectsData.bachillerato).forEach(([course, branches]) => {
      const courseName = course.replace('_', 'º ')
      Object.entries(branches).forEach(([branch, subjects]) => {
        const branchName = branch.charAt(0).toUpperCase() + branch.slice(1)
        groups.push({
          value: `bachillerato.${course}.${branch}`,
          label: `${courseName} ${branchName}`,
          category: 'Bachillerato',
          icon: <Users size={16} className="text-purple-500" />,
          subjectsCount: subjects.length
        })
      })
    })

    // Idiomas
    groups.push({
      value: 'idiomas',
      label: 'Idiomas',
      category: 'Otros',
      icon: <BookOpen size={16} className="text-orange-500" />,
      subjectsCount: subjectsData.idiomas.length
    })

    // Especialidades
    groups.push({
      value: 'especialidades',
      label: 'Especialidades / Refuerzo',
      category: 'Otros',
      icon: <BookOpen size={16} className="text-red-500" />,
      subjectsCount: subjectsData.especialidades.length
    })

    return groups
  }, [])

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedGroupData = subjectGroups.find(g => g.value === selectedGroup)

  // Agrupar por categoría
  const groupedByCategory: Record<string, SubjectGroup[]> = {}
  subjectGroups.forEach(group => {
    if (!groupedByCategory[group.category]) {
      groupedByCategory[group.category] = []
    }
    groupedByCategory[group.category].push(group)
  })

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="block text-sm font-medium text-foreground mb-2">
        Grupo de Asignaturas
        <span className="text-xs text-foreground-muted ml-2">(Define qué asignaturas estarán disponibles)</span>
      </label>
      
      {/* Selector button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between hover:bg-background-secondary transition-colors"
      >
        <div className="flex items-center space-x-2">
          {selectedGroupData ? (
            <>
              {selectedGroupData.icon}
              <span className="text-sm">{selectedGroupData.label}</span>
              <span className="text-xs text-foreground-muted">({selectedGroupData.subjectsCount} asignaturas)</span>
            </>
          ) : (
            <span className="text-sm text-foreground-muted">Selecciona un grupo de asignaturas...</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-foreground-muted transition-transform",
            isOpen && "transform rotate-180"
          )} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedByCategory).map(([category, groups]) => (
              <div key={category}>
                {/* Category header */}
                <div className="px-4 py-2 bg-background-secondary border-b border-border">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    {category}
                  </p>
                </div>
                
                {/* Category groups */}
                {groups.map((group) => (
                  <button
                    key={group.value}
                    type="button"
                    onClick={() => {
                      onGroupChange(group.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-background-secondary transition-colors border-b border-border last:border-b-0 flex items-center justify-between",
                      selectedGroup === group.value && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {group.icon}
                      <div>
                        <p className="text-sm font-medium text-foreground">{group.label}</p>
                        <p className="text-xs text-foreground-muted">{group.subjectsCount} asignaturas disponibles</p>
                      </div>
                    </div>
                    {selectedGroup === group.value && (
                      <Check size={16} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

