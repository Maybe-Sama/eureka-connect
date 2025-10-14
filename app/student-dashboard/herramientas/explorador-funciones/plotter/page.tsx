'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Plus, X, RefreshCw, HelpCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import SimpleGraph from '@/components/ui/SimpleGraph'

// Helper to generate distinct colors
const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"]
const getInitialFunctions = () => [
  { id: 1, eq: "x^2", color: COLORS[0] },
  { id: 2, eq: "", color: COLORS[1] },
]

export default function PlotterPage() {
  const [functions, setFunctions] = useState(getInitialFunctions())
  const [xDomain, setXDomain] = useState([-10, 10])
  const [yDomain, setYDomain] = useState([-10, 10])


  const handleFunctionChange = (id: number, eq: string) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, eq } : f)))
  }

  const addFunction = () => {
    const newId = functions.length > 0 ? Math.max(...functions.map(f => f.id)) + 1 : 1
    const colorIndex = (newId - 1) % COLORS.length
    setFunctions([...functions, { id: newId, eq: "", color: COLORS[colorIndex] }])
  }

  const removeFunction = (id: number) => {
    setFunctions(functions.filter((f) => f.id !== id))
  }
  
  const setExample = (fn: string) => {
    const emptyIndex = functions.findIndex(f => f.eq === "")
    if (emptyIndex !== -1) {
      handleFunctionChange(functions[emptyIndex].id, fn)
    } else {
      addFunction()
      setTimeout(() => {
         const newId = Math.max(...functions.map(f => f.id)) + 1
         handleFunctionChange(newId, fn)
      }, 0)
    }
  }

  const resetZoom = () => {
    setXDomain([-10, 10])
    setYDomain([-10, 10])
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Graficador de Funciones</h1>
          <p className="text-lg text-muted-foreground">
            Escribe funciones matemáticas y visualízalas en tiempo real
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
          <div className="lg:col-span-1 space-y-6">
            {/* Function Inputs */}
            <Card className="card-organic">
              <CardHeader>
                <CardTitle className="text-xl">Funciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {functions.map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <div className="w-2 h-8 rounded" style={{ backgroundColor: f.color }} />
                    <Input
                      type="text"
                      placeholder="Ej: x^3 - x"
                      value={f.eq}
                      onChange={(e) => handleFunctionChange(f.id, e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFunction(f.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addFunction} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Añadir función
                </Button>
              </CardContent>
            </Card>

            {/* Graph Controls */}
            <Card className="card-organic">
              <CardHeader>
                <CardTitle className="text-xl">Configuración del Gráfico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="x-min">X min</Label>
                    <Input 
                      id="x-min" 
                      type="number" 
                      value={xDomain[0]} 
                      onChange={(e) => setXDomain([+e.target.value, xDomain[1]])} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="x-max">X max</Label>
                    <Input 
                      id="x-max" 
                      type="number" 
                      value={xDomain[1]} 
                      onChange={(e) => setXDomain([xDomain[0], +e.target.value])} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="y-min">Y min</Label>
                    <Input 
                      id="y-min" 
                      type="number" 
                      value={yDomain[0]} 
                      onChange={(e) => setYDomain([+e.target.value, yDomain[1]])} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="y-max">Y max</Label>
                    <Input 
                      id="y-max" 
                      type="number" 
                      value={yDomain[1]} 
                      onChange={(e) => setYDomain([yDomain[0], +e.target.value])} 
                    />
                  </div>
                </div>
                <Button onClick={resetZoom} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" /> Restablecer Zoom
                </Button>
              </CardContent>
            </Card>
            
            {/* Examples */}
            <Card className="card-organic">
              <CardHeader>
                <CardTitle className="text-xl">Ejemplos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setExample('x^2')} size="sm">f(x) = x²</Button>
                <Button variant="outline" onClick={() => setExample('sin(x)')} size="sm">f(x) = sin(x)</Button>
                <Button variant="outline" onClick={() => setExample('cos(x)')} size="sm">f(x) = cos(x)</Button>
                <Button variant="outline" onClick={() => setExample('tan(x)')} size="sm">f(x) = tan(x)</Button>
                <Button variant="outline" onClick={() => setExample('ln(x)')} size="sm">f(x) = ln(x)</Button>
                <Button variant="outline" onClick={() => setExample('exp(x)')} size="sm">f(x) = e^x</Button>
                <Button variant="outline" onClick={() => setExample('sqrt(x)')} size="sm">f(x) = √x</Button>
                <Button variant="outline" onClick={() => setExample('1/x')} size="sm">f(x) = 1/x</Button>
                <Button variant="outline" onClick={() => setExample('x^3 - 3*x + 1')} size="sm">f(x) = x³-3x+1</Button>
                <Button variant="outline" onClick={() => setExample('abs(x)')} size="sm">f(x) = |x|</Button>
              </CardContent>
            </Card>

            {/* Syntax Helper */}
            <Card className="card-organic">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Ayuda de Sintaxis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>
                  <p className="font-semibold text-foreground mb-1">Operadores:</p>
                  <p>+, -, *, /, ^ (potencia), ** (potencia)</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Funciones:</p>
                  <p>sin, cos, tan, asin, acos, atan, exp, ln, log2, sqrt, cbrt, abs</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Constantes:</p>
                  <p>pi, e</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Ejemplos:</p>
                  <p className="text-xs">x^2, sin(x), sqrt(x), 1/x, x^3-3*x+1</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="card-organic">
              <CardContent className="p-4">
                <SimpleGraph
                  functions={functions
                    .filter((f) => f.eq.trim() !== "")
                    .map((f) => ({
                      fn: f.eq,
                      color: f.color
                    }))}
                  xDomain={xDomain as [number, number]}
                  yDomain={yDomain as [number, number]}
                  height={600}
                  className="h-[600px]"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
