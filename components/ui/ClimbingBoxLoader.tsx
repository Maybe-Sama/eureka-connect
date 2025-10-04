'use client'

import { motion } from 'framer-motion'

interface ClimbingBoxLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export const ClimbingBoxLoader = ({ 
  size = 'md', 
  color = 'hsl(var(--primary))',
  className = ''
}: ClimbingBoxLoaderProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  const boxSize = sizeClasses[size]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className={`${boxSize} rounded-sm`}
            style={{ backgroundColor: color }}
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}
