'use client'

import { motion } from 'framer-motion'

interface DiagonalBoxLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export const DiagonalBoxLoader = ({ 
  size = 'md', 
  color = 'hsl(var(--primary))',
  className = ''
}: DiagonalBoxLoaderProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  const boxSize = sizeClasses[size]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Línea diagonal de fondo */}
        <div 
          className="absolute w-16 h-0.5 opacity-30"
          style={{ 
            backgroundColor: color,
            transform: 'rotate(-45deg)',
            top: '50%',
            left: '50%',
            transformOrigin: 'center',
            marginLeft: '-32px',
            marginTop: '-1px'
          }}
        />
        
        {/* Cuadrado que sube por la diagonal */}
        <motion.div
          className={`${boxSize} rounded-sm`}
          style={{ backgroundColor: color }}
          animate={{
            x: [32, -32],
            y: [32, -32],
            rotate: [0, 360]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  )
}
