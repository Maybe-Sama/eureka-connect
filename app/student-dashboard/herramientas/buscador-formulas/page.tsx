'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Calculator, 
  BookOpen, 
  Filter,
  ArrowLeft,
  Sparkles,
  Zap,
  TrendingUp,
  Cpu,
  DollarSign,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useFormulasAPI, type Formula } from '@/hooks/useFormulasAPI'
import { FormulaCard } from '@/components/ui/FormulaRenderer'

const subjectIcons = {
  matematicas: Calculator,
  fisica: Zap,
  quimica: Sparkles,
  economia: DollarSign,
  tecnologia: Cpu
}

export default function BuscadorFormulasPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('todas')
  const [selectedCategory, setSelectedCategory] = useState('todas')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const {
    formulas,
    subjects,
    availableCategories,
    isLoading,
    error,
    total,
    hasMore,
    searchFormulas,
    getCategoriesForSubject,
    clearError
  } = useFormulasAPI()

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Búsqueda cuando cambian los parámetros
  useEffect(() => {
    const performSearch = async () => {
      try {
        await searchFormulas({
          query: debouncedQuery || undefined,
          subject: selectedSubject,
          category: selectedCategory,
          limit: 100
        })
      } catch (err) {
        console.error('Error en búsqueda:', err)
      }
    }

    performSearch()
  }, [debouncedQuery, selectedSubject, selectedCategory]) // Sin searchFormulas

  // Resetear categoría cuando cambia la materia
  useEffect(() => {
    setSelectedCategory('todas')
  }, [selectedSubject])

  // Obtener categorías disponibles para la materia seleccionada
  const currentCategories = getCategoriesForSubject(selectedSubject)


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 py-6 sm:py-8 lg:py-12"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
              <Link href="/student-dashboard/herramientas">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Volver</span>
                <span className="sm:hidden">Atrás</span>
              </Link>
            </Button>
            
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            
            <h1 
              className="font-bold text-foreground mb-3 sm:mb-4"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                lineHeight: '1.2'
              }}
              suppressHydrationWarning
            >
              Encuentra la<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Fórmula Perfecta
              </span>
            </h1>
            
            <p 
              className="text-muted-foreground mb-6 sm:mb-8"
              style={{
                fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)'
              }}
              suppressHydrationWarning
            >
              Busca entre cientos de fórmulas matemáticas, físicas y químicas.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="Buscar fórmulas por nombre, fórmula o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-lg border-2 focus:border-primary transition-colors w-full"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:block">
            {/* Subject Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedSubject === 'todas' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubject('todas')}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Todas las materias
              </Button>
              {subjects.map((subject) => {
                const Icon = subjectIcons[subject.id as keyof typeof subjectIcons] || BookOpen
                return (
                  <Button
                    key={subject.id}
                    variant={selectedSubject === subject.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubject(subject.id)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {subject.name}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {subject.totalFormulas}
                    </Badge>
                  </Button>
                )
              })}
            </div>

            {/* Category Filter */}
            {currentCategories.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Categoría
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    {currentCategories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mobile Filters Panel */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="lg:hidden mb-6 overflow-hidden"
              >
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Subject Filters Mobile */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Materia
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        variant={selectedSubject === 'todas' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSubject('todas')}
                        className="gap-2 justify-start h-10"
                      >
                        <BookOpen className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Todas las materias</span>
                      </Button>
                      {subjects.map((subject) => {
                        const Icon = subjectIcons[subject.id as keyof typeof subjectIcons] || BookOpen
                        return (
                          <Button
                            key={subject.id}
                            variant={selectedSubject === subject.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSubject(subject.id)}
                            className="gap-2 justify-start h-10"
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{subject.name}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {subject.totalFormulas}
                            </Badge>
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Category Filter Mobile */}
                  {currentCategories.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Categoría
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas las categorías</SelectItem>
                          {currentCategories.map((category: string) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-muted-foreground">
              {isLoading ? 'Cargando fórmulas...' : 
               searchQuery || selectedSubject !== 'todas' || selectedCategory !== 'todas' ? 
               'Buscando...' : `${total} fórmulas encontradas`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {selectedSubject !== 'todas' && (
                <Badge variant="outline" className="gap-1 text-xs">
                  {subjects.find(s => s.id === selectedSubject)?.name}
                </Badge>
              )}
              {selectedCategory !== 'todas' && (
                <Badge variant="outline" className="gap-1 text-xs">
                  {selectedCategory}
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1 text-xs">
                <Filter className="w-3 h-3" />
                Filtros activos
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12"
      >
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 sm:py-12"
              >
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm sm:text-base">Cargando fórmulas...</span>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 sm:py-12"
              >
                <div className="text-red-500 mb-4">
                  <Calculator className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Error cargando fórmulas</h3>
                  <p className="text-sm sm:text-base text-muted-foreground px-4">{error}</p>
                </div>
              </motion.div>
            ) : formulas.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 sm:py-12"
              >
                <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  No se encontraron fórmulas
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground px-4">
                  Intenta con otros términos de búsqueda o cambia el filtro de materia
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
                }}
                suppressHydrationWarning
              >
                {formulas.map((formula, index) => (
                  <motion.div
                    key={`${formula.subject}-${formula.name}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="w-full"
                  >
                    <Card className="glass-effect border-border/50 hover:border-primary/30 transition-all duration-300 h-full group hover:shadow-lg hover:shadow-primary/5">
                      <CardHeader className="pb-3 px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
                              {formula.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
                              <Badge variant={null} className="text-xs capitalize bg-white text-gray-800 border-gray-200 hover:bg-white">
                                {subjects.find(s => s.id === formula.subject)?.name || formula.subject}
                              </Badge>
                              <Badge variant={null} className="text-xs bg-white text-gray-800 border-gray-200 hover:bg-white">
                                {formula.category}
                              </Badge>
                              {formula.subcategory !== formula.category && (
                                <Badge variant={null} className="text-xs bg-white text-gray-800 border-gray-200 hover:bg-white">
                                  {formula.subcategory}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                        <div className="overflow-x-auto">
                          <FormulaCard formula={formula.formula} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
