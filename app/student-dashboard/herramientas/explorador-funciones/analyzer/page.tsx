'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MathRenderer from '@/components/ui/MathRenderer'
import SimpleGraph from '@/components/ui/SimpleGraph'

// Import function data
import functionData from '@/lib/function_store.json'

// Define types for our function data
type FunctionType = "linear" | "quadratic" | "cubic" | "piecewise" | "exponential" | "logarithmic" | "radical" | "rational" | "trigonometric"
type FunctionRecord = {
  id: string;
  type: FunctionType;
  expression: string;
  latex_equation: string;
  js_equation: string;
  x_range: number[];
  y_range: number[];
  domain: string;
  range: string;
  intercepts: number[][] | string;
  symmetry: "Par (eje Y)" | "Impar (origen)" | "none" | string;
  monotonicity: string;
  concavity: string;
  periodicity: string;
  extrema: (string | number)[][] | string;
  inflection_points: (string | number)[][] | string;
  asymptotes: {
    vertical: number[];
    horizontal: number[];
    oblique: number[];
  };
}

const functionTypes: { value: FunctionType; label: string }[] = [
    { value: "linear", label: "Lineal" },
    { value: "quadratic", label: "Cuadrática" },
    { value: "cubic", label: "Cúbica" },
    { value: "exponential", label: "Exponencial" },
    { value: "logarithmic", label: "Logarítmica" },
    { value: "radical", label: "Radical" },
    { value: "rational", label: "Racional" },
    { value: "trigonometric", label: "Trigonométrica" },
]

const analysisFields = [
    { id: "domain", label: "Dominio", placeholder: "Ej: (-∞, ∞)"},
    { id: "range", label: "Recorrido", placeholder: "Ej: [0, ∞)"},
    { id: "intercepts", label: "Puntos de corte (x,y)", placeholder: "Ej: (0,0), (2,0)"},
    { id: "symmetry", label: "Simetría", type: "select", options: ["Par (eje Y)", "Impar (origen)", "Sin simetría"]},
    { id: "monotonicity", label: "Monotonía", placeholder: "Creciente en (0,∞), Decreciente en (-∞,0)"},
    { id: "concavity", label: "Concavidad", placeholder: "Cóncava en (-∞,0), Convexa en (0,∞)"},
    { id: "periodicity", label: "Periodicidad", placeholder: "Ej: 2π o No periódica"},
    { id: "extrema", label: "Máximos y mínimos", placeholder: "Máx: (1,4), Mín: (-1,-2)"},
    { id: "inflection_points", label: "Puntos de inflexión", placeholder: "Ej: (0,0)"},
    { id: "asymptotes", label: "Asíntotas", placeholder: "Vertical: x=0, Horizontal: y=1"},
]

export default function AnalyzerPage() {
  const [selectedType, setSelectedType] = useState<FunctionType>("quadratic")
  const [currentFunction, setCurrentFunction] = useState<FunctionRecord | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean> | null>(null)
  const [showSolution, setShowSolution] = useState(false)

  const functionsByType = useMemo(() => {
    const data = functionData as Record<string, FunctionRecord>
    return Object.values(data).reduce((acc, func) => {
      if (!acc[func.type]) {
        acc[func.type] = []
      }
      acc[func.type].push(func)
      return acc
    }, {} as Record<FunctionType, FunctionRecord[]>)
  }, [])

  const loadNewFunction = (type: FunctionType) => {
    const funcs = functionsByType[type]
    if (funcs) {
      const func = funcs[Math.floor(Math.random() * funcs.length)]
      setCurrentFunction(func)
      setUserAnswers({})
      setResults(null)
      setShowSolution(false)
    }
  }

  useEffect(() => {
    loadNewFunction(selectedType)
  }, [selectedType])
  

  const handleInputChange = (id: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFunction) return
    
    const newResults: Record<string, boolean> = {}
    analysisFields.forEach(field => {
        // Simple comparison for now, can be improved
        const userAnswer = userAnswers[field.id]?.trim().toLowerCase()
        const solution = (currentFunction as any)[field.id]?.toString().trim().toLowerCase()
        newResults[field.id] = userAnswer === solution
    })
    setResults(newResults)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-primary/5 to-accent/5 py-8 sm:py-12 border-b border-border"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <Link href="/student-dashboard/herramientas/explorador-funciones" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Explorador
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Analizador de Funciones</h1>
          <p className="text-lg text-muted-foreground">
            Selecciona un tipo de función, analiza sus propiedades y comprueba tus respuestas
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="container mx-auto px-4 py-12 max-w-6xl"
      >
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="card-organic">
              <CardHeader>
                <div className="flex sm:items-center flex-col sm:flex-row justify-between">
                  <CardTitle className="text-xl mb-4 sm:mb-0">Función a Analizar</CardTitle>
                  <div className="flex items-center gap-2">
                      <Select value={selectedType} onValueChange={(v) => setSelectedType(v as FunctionType)}>
                          <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Tipo de función" />
                          </SelectTrigger>
                          <SelectContent>
                              {functionTypes.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <Button onClick={() => loadNewFunction(selectedType)} variant="outline">
                          <RefreshCw className="mr-2 h-4 w-4" /> Nueva
                      </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentFunction ? (
                  <>
                    <div className="p-4 rounded-xl mb-4 text-center text-xl text-foreground border border-border bg-muted/30">
                        <MathRenderer expression={`f(x) = ${currentFunction.expression}`} displayMode={true} />
                    </div>
                    <SimpleGraph
                      functions={[{
                        fn: currentFunction.js_equation,
                        color: '#3B82F6'
                      }]}
                      xDomain={currentFunction.x_range as [number, number]}
                      yDomain={currentFunction.y_range as [number, number]}
                      height={400}
                      className="h-[400px]"
                    />
                  </>
                ) : (
                  <div className="h-[460px] flex items-center justify-center">Cargando función...</div>
                )}
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit}>
              <Card className="card-organic">
                 <CardHeader>
                    <CardTitle className="text-xl">Tu Análisis</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  {analysisFields.map(field => (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        {field.type === 'select' ? (
                            <Select onValueChange={v => handleInputChange(field.id, v)} value={userAnswers[field.id] || ''}>
                                <SelectTrigger id={field.id}>
                                  <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input 
                              id={field.id} 
                              placeholder={field.placeholder} 
                              value={userAnswers[field.id] || ''} 
                              onChange={e => handleInputChange(field.id, e.target.value)} 
                            />
                        )}
                        {results && (
                           <div className="flex items-center text-sm pt-1">
                               {results[field.id] ? 
                                 <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> : 
                                 <XCircle className="h-4 w-4 text-red-500 mr-1" />
                               }
                               <span>{results[field.id] ? 'Correcto' : 'Incorrecto'}</span>
                           </div>
                        )}
                    </div>
                  ))}
                </CardContent>
              </Card>
               <div className="mt-6 flex gap-4">
                  <Button type="submit" className="btn-organic flex-1">Comprobar Respuestas</Button>
                  <Button type="button" onClick={() => setShowSolution(true)} variant="outline" disabled={!results}>
                    Ver Solución
                  </Button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="card-organic sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Solución</CardTitle>
              </CardHeader>
              <CardContent>
                {showSolution && currentFunction ? (
                    <div className="space-y-3">
                        {analysisFields.map(field => (
                            <div key={field.id}>
                                <p className="font-semibold text-foreground">{field.label}</p>
                                <p className="text-muted-foreground text-sm">{(currentFunction as any)[field.id]}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Completa el análisis y comprueba tus respuestas para ver la solución.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
