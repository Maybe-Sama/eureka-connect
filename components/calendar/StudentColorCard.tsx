'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'

interface Student {
  id: number
  first_name: string
  last_name: string
  course_name?: string
}

interface StudentColorCardProps {
  student: Student
  currentColor: string
  onColorClick: () => void
}

// Colores organizados por categorías con 4 colores muy diferentes cada una
const PREDEFINED_COLORS = [
  // Azules (4 colores muy diferentes)
  { name: 'Azul Cielo', value: 'bg-sky-100 border-sky-300 dark:bg-sky-900/20 dark:border-sky-700', preview: '#e0f2fe', category: 'azul' },
  { name: 'Azul Marino', value: 'bg-blue-200 border-blue-400 dark:bg-blue-800/30 dark:border-blue-600', preview: '#bfdbfe', category: 'azul' },
  { name: 'Azul Profundo', value: 'bg-indigo-200 border-indigo-400 dark:bg-indigo-800/30 dark:border-indigo-600', preview: '#c7d2fe', category: 'azul' },
  { name: 'Azul Eléctrico', value: 'bg-cyan-200 border-cyan-400 dark:bg-cyan-800/30 dark:border-cyan-600', preview: '#a5f3fc', category: 'azul' },
  
  // Verdes (4 colores muy diferentes)
  { name: 'Verde Menta', value: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700', preview: '#d1fae5', category: 'verde' },
  { name: 'Verde Lima', value: 'bg-lime-200 border-lime-400 dark:bg-lime-800/30 dark:border-lime-600', preview: '#d9f99d', category: 'verde' },
  { name: 'Verde Bosque', value: 'bg-green-200 border-green-400 dark:bg-green-800/30 dark:border-green-600', preview: '#bbf7d0', category: 'verde' },
  { name: 'Verde Esmeralda', value: 'bg-teal-200 border-teal-400 dark:bg-teal-800/30 dark:border-teal-600', preview: '#99f6e4', category: 'verde' },
  
  // Púrpuras (4 colores muy diferentes)
  { name: 'Púrpura Lavanda', value: 'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700', preview: '#f3e8ff', category: 'purple' },
  { name: 'Púrpura Intenso', value: 'bg-violet-200 border-violet-400 dark:bg-violet-800/30 dark:border-violet-600', preview: '#ddd6fe', category: 'purple' },
  { name: 'Púrpura Real', value: 'bg-fuchsia-200 border-fuchsia-400 dark:bg-fuchsia-800/30 dark:border-fuchsia-600', preview: '#f5d0fe', category: 'purple' },
  { name: 'Púrpura Oscuro', value: 'bg-indigo-300 border-indigo-500 dark:bg-indigo-700/40 dark:border-indigo-500', preview: '#a5b4fc', category: 'purple' },
  
  // Rosas (4 colores muy diferentes)
  { name: 'Rosa Suave', value: 'bg-pink-100 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700', preview: '#fce7f3', category: 'rosa' },
  { name: 'Rosa Fucsia', value: 'bg-fuchsia-100 border-fuchsia-300 dark:bg-fuchsia-900/20 dark:border-fuchsia-700', preview: '#fae8ff', category: 'rosa' },
  { name: 'Rosa Coral', value: 'bg-rose-200 border-rose-400 dark:bg-rose-800/30 dark:border-rose-600', preview: '#fecaca', category: 'rosa' },
  { name: 'Rosa Vibrante', value: 'bg-pink-200 border-pink-400 dark:bg-pink-800/30 dark:border-pink-600', preview: '#fbcfe8', category: 'rosa' },
  
  // Rojos (4 colores muy diferentes)
  { name: 'Rojo Coral', value: 'bg-rose-100 border-rose-300 dark:bg-rose-900/20 dark:border-rose-700', preview: '#ffe4e6', category: 'rojo' },
  { name: 'Rojo Escarlata', value: 'bg-red-200 border-red-400 dark:bg-red-800/30 dark:border-red-600', preview: '#fecaca', category: 'rojo' },
  { name: 'Rojo Tomate', value: 'bg-orange-200 border-orange-400 dark:bg-orange-800/30 dark:border-orange-600', preview: '#fed7aa', category: 'rojo' },
  { name: 'Rojo Intenso', value: 'bg-red-300 border-red-500 dark:bg-red-700/40 dark:border-red-500', preview: '#fca5a5', category: 'rojo' },
  
  // Naranjas (4 colores muy diferentes)
  { name: 'Naranja Melocotón', value: 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700', preview: '#fed7aa', category: 'naranja' },
  { name: 'Naranja Dorado', value: 'bg-amber-200 border-amber-400 dark:bg-amber-800/30 dark:border-amber-600', preview: '#fde68a', category: 'naranja' },
  { name: 'Naranja Intenso', value: 'bg-orange-200 border-orange-400 dark:bg-orange-800/30 dark:border-orange-600', preview: '#fed7aa', category: 'naranja' },
  { name: 'Naranja Fuego', value: 'bg-red-200 border-red-400 dark:bg-red-800/30 dark:border-red-600', preview: '#fecaca', category: 'naranja' },
  
  // Amarillos (4 colores muy diferentes)
  { name: 'Amarillo Dorado', value: 'bg-amber-100 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700', preview: '#fef3c7', category: 'amarillo' },
  { name: 'Amarillo Mostaza', value: 'bg-yellow-200 border-yellow-400 dark:bg-yellow-800/30 dark:border-yellow-600', preview: '#fef08a', category: 'amarillo' },
  { name: 'Amarillo Limón', value: 'bg-lime-200 border-lime-400 dark:bg-lime-800/30 dark:border-lime-600', preview: '#d9f99d', category: 'amarillo' },
  { name: 'Amarillo Suave', value: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700', preview: '#fef3c7', category: 'amarillo' },
  
  // Turquesas (4 colores muy diferentes)
  { name: 'Turquesa Océano', value: 'bg-cyan-100 border-cyan-300 dark:bg-cyan-900/20 dark:border-cyan-700', preview: '#cffafe', category: 'turquesa' },
  { name: 'Turquesa Profundo', value: 'bg-teal-200 border-teal-400 dark:bg-teal-800/30 dark:border-teal-600', preview: '#99f6e4', category: 'turquesa' },
  { name: 'Turquesa Claro', value: 'bg-sky-200 border-sky-400 dark:bg-sky-800/30 dark:border-sky-600', preview: '#bae6fd', category: 'turquesa' },
  { name: 'Turquesa Vibrante', value: 'bg-cyan-200 border-cyan-400 dark:bg-cyan-800/30 dark:border-cyan-600', preview: '#a5f3fc', category: 'turquesa' },
  
  // Grises (4 colores muy diferentes)
  { name: 'Gris Perla', value: 'bg-gray-100 border-gray-300 dark:bg-gray-900/20 dark:border-gray-700', preview: '#f3f4f6', category: 'gris' },
  { name: 'Gris Azulado', value: 'bg-slate-200 border-slate-400 dark:bg-slate-800/30 dark:border-slate-600', preview: '#e2e8f0', category: 'gris' },
  { name: 'Gris Neutro', value: 'bg-zinc-200 border-zinc-400 dark:bg-zinc-800/30 dark:border-zinc-600', preview: '#e4e4e7', category: 'gris' },
  { name: 'Gris Suave', value: 'bg-stone-200 border-stone-400 dark:bg-stone-800/30 dark:border-stone-600', preview: '#e7e5e4', category: 'gris' }
]

export const StudentColorCard = ({ student, currentColor, onColorClick }: StudentColorCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  // Obtener el color actual y su preview
  const getCurrentColorInfo = () => {
    const colorInfo = PREDEFINED_COLORS.find(c => c.value === currentColor)
    return colorInfo || { name: 'Personalizado', preview: '#e5e7eb' }
  }

  const colorInfo = getCurrentColorInfo()

  return (
    <div className="bg-background-secondary rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between">
        {/* Información del alumno */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {student.first_name} {student.last_name}
          </h3>
          <p className="text-sm text-foreground-muted truncate">
            {student.course_name || 'Sin curso asignado'}
          </p>
        </div>

        {/* Cuadrado de color clickeable */}
        <div 
          className="w-8 h-8 rounded-lg border-2 border-border flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 hover:border-primary/50"
          style={{ backgroundColor: colorInfo.preview }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onColorClick}
        >
          {isHovered && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center"
            >
              <Palette className="w-2 h-2 text-primary" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
