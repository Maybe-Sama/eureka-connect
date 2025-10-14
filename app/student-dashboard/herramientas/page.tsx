'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Calculator, 
  QrCode, 
  FileText, 
  FunctionSquare, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const tools = [
  {
    icon: Calculator,
    title: "Buscador de Fórmulas",
    description: "Accede a nuestra biblioteca completa de fórmulas matemáticas, físicas, químicas y más. Encuentra la fórmula que necesitas con explicaciones detalladas.",
    tags: ["Matemáticas", "Física", "Química", "Economía"],
    href: "/student-dashboard/herramientas/buscador-formulas",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconGradient: "from-blue-500 to-cyan-500",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200/50"
  },
  {
    icon: QrCode,
    title: "Creador de QR",
    description: "Genera códigos QR personalizados para enlaces, textos, WiFi o contactos. Personaliza colores, patrones y añade tu logo.",
    tags: ["Personalizable", "Descargable", "Múltiples tipos"],
    href: "/student-dashboard/herramientas/creador-qr",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconGradient: "from-emerald-500 to-teal-500",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-200/50"
  },
  {
    icon: FileText,
    title: "Extractor de PDF",
    description: "Encuentra y descarga PDFs de cualquier página web para tus estudios. Extrae documentos académicos de forma rápida y eficiente.",
    tags: ["Extracción", "Descarga", "Web scraping"],
    href: "/student-dashboard/herramientas/extractor-pdf",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconGradient: "from-purple-500 to-pink-500",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200/50"
  },
  {
    icon: FunctionSquare,
    title: "Explorador de Funciones",
    description: "Analiza y explora funciones matemáticas con gráficas interactivas. Incluye graficador, analizador y ejemplos predefinidos.",
    tags: ["Matemáticas", "Gráficas", "Interactivo", "Análisis"],
    href: "/student-dashboard/herramientas/explorador-funciones",
    gradient: "from-orange-500/20 to-red-500/20",
    iconGradient: "from-orange-500 to-red-500",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200/50"
  },
]

export default function HerramientasPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 py-16 sm:py-20"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
        
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Potencia tu{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              aprendizaje
            </span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Herramientas Educativas</span>
      </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Herramientas interactivas diseñadas para estudiantes. Desde fórmulas matemáticas hasta 
            generadores de QR, todo lo que necesitas para estudiar mejor.
          </motion.p>
          
        </div>
        
      </motion.section>

     
      
      {/* Tools Grid */}
      <main className="container mx-auto px-4 py-12 sm:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group"
            >
              <Link href={tool.href} className="block h-full">
                <Card className="h-full glass-effect border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden relative cursor-pointer">
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-start justify-start mb-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`p-3 rounded-xl bg-gradient-to-br ${tool.iconGradient} shadow-lg`}
                      >
                        <tool.icon className="w-6 h-6 text-white" />
                      </motion.div>
                    </div>
                    
                    <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="relative z-10 pt-0">
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tool.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={`${tool.bgColor} text-gray-800 ${tool.borderColor} font-medium px-3 py-1 hover:scale-105 transition-transform`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                   
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Bottom CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="bg-gradient-to-r from-primary/5 to-accent/5 py-12 sm:py-16"
      >
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4"
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">¿Necesitas ayuda?</span>
            </motion.div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Explora todas las herramientas
            </h3>
            
            <p className="text-muted-foreground mb-6">
              Cada herramienta está diseñada para facilitar tu proceso de aprendizaje. 
              ¡Descubre nuevas formas de estudiar y mejorar tus resultados!
            </p>
            
          
          </div>
        </div>
      </motion.section>
    </div>
  )
}
