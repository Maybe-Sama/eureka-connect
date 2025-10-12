'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from 'lucide-react'

interface OptimizedAvatarProps {
  src?: string
  alt: string
  fallback: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onLoad?: () => void
  onError?: () => void
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl',
  lg: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl'
}

export function OptimizedAvatar({
  src,
  alt,
  fallback,
  className = '',
  size = 'md',
  onLoad,
  onError
}: OptimizedAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  // Actualizar src cuando cambie
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src)
      setImageLoaded(false)
      setImageError(false)
    }
  }, [src, currentSrc])

  const handleLoad = () => {
    setImageLoaded(true)
    setImageError(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    setImageLoaded(false)
    onError?.()
  }

  const showImage = currentSrc && !imageError && imageLoaded
  const showFallback = !currentSrc || imageError || !imageLoaded

  return (
    <div className={`relative rounded-full overflow-hidden shadow-lg border-2 border-primary-foreground/20 ${sizeClasses[size]} ${className}`}>
      <AnimatePresence mode="wait">
        {showImage ? (
          <motion.img
            key={currentSrc}
            src={currentSrc}
            alt={alt}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onLoad={handleLoad}
            onError={handleError}
            loading="eager" // Carga inmediata para avatares
            decoding="async" // Decodificación asíncrona
          />
        ) : (
          <motion.div
            key="fallback"
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {showFallback && (
              <>
                {fallback ? (
                  <span className="font-bold text-primary-foreground">
                    {fallback}
                  </span>
                ) : (
                  <User className="w-1/2 h-1/2 text-primary-foreground/60" />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preload invisible para caché */}
      {currentSrc && !imageLoaded && !imageError && (
        <img
          src={currentSrc}
          alt=""
          className="absolute opacity-0 pointer-events-none"
          onLoad={handleLoad}
          onError={handleError}
          loading="eager"
        />
      )}
    </div>
  )
}
