'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BarChart, LineChart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const tools = [
  {
    icon: LineChart,
    title: "Graficador de Funciones",
    description: "Visualiza y explora múltiples funciones matemáticas en un gráfico interactivo. Personaliza el dominio, el rango y la apariencia.",
    href: "/student-dashboard/herramientas/explorador-funciones/plotter",
    cta: "Abrir Graficador",
  },
  {
    icon: BarChart,
    title: "Analizador de Funciones",
    description: "Practica el análisis de funciones. Elige un tipo de función, estudia sus propiedades (dominio, asíntotas, etc.) y comprueba tus respuestas.",
    href: "/student-dashboard/herramientas/explorador-funciones/analyzer",
    cta: "Iniciar Análisis",
  },
]

export default function ExploradorFuncionesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-primary/5 to-accent/5 py-8 sm:py-12 border-b border-border"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/student-dashboard/herramientas" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Herramientas
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Explorador de Funciones</h1>
          <p className="text-lg text-muted-foreground">
            Una suite de herramientas interactivas para graficar y analizar funciones matemáticas.
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="container mx-auto px-4 py-12"
      >
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <Card className="card-organic hover-lift p-8 flex flex-col h-full">
                <div className="flex-shrink-0 mb-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <tool.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold text-foreground mb-3">{tool.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-grow">{tool.description}</p>
                  <div className="mt-auto">
                    <Button asChild className="btn-organic font-semibold w-full">
                      <Link href={tool.href}>
                        {tool.cta}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
