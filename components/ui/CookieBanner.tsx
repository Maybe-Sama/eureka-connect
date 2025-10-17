'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Cookie, Shield, Settings, CheckCircle } from 'lucide-react'
import { useCookieConsent } from '@/hooks/useCookieConsent'

interface CookieBannerProps {
  onAccept: () => void
  onReject: () => void
  onCustomize: () => void
}

export function CookieBanner({ onAccept, onReject, onCustomize }: CookieBannerProps) {
  const { customize } = useCookieConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Siempre activo
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Cargar preferencias guardadas
    const savedPreferences = localStorage.getItem('cookie-preferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences(parsed)
      } catch (error) {
        console.error('Error parsing saved preferences:', error)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    onAccept()
  }

  const handleRejectAll = () => {
    onReject()
  }

  const handleCustomize = () => {
    setShowDetails(true)
  }

  const handleSavePreferences = () => {
    customize(preferences)
    onCustomize()
  }

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    if (key === 'necessary') return // No se puede desactivar
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Función para verificar si se pueden usar cookies específicas
  const canUseCookie = (type: keyof typeof preferences): boolean => {
    if (type === 'necessary') return true
    return preferences[type] === true
  }

  // El banner siempre se muestra cuando el componente está montado
  // La lógica de visibilidad se maneja en el provider

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-1 sm:px-4 lg:px-6"
      >
        <div className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          <div className="glass-effect rounded-lg sm:rounded-xl shadow-2xl border border-white/10 p-1.5 sm:p-3 md:p-4 lg:p-4 xl:p-5 relative overflow-hidden">
            {/* Efectos de fondo responsivos */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl sm:rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-primary/10 rounded-full blur-xl sm:blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-accent/10 rounded-full blur-lg sm:blur-xl"></div>
            
            <div className="relative z-10">
              {!showDetails ? (
                // Vista principal - Ultra compacta para móvil
                <div className="flex flex-col space-y-1.5 sm:space-y-0 sm:flex-row sm:items-center sm:gap-3 md:gap-4 lg:gap-6">
                  {/* Header con icono y título - Mínimo */}
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-accent rounded-md sm:rounded-lg flex items-center justify-center shadow-lg">
                      <Cookie className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-base font-bold text-foreground">
                        🍪 Cookies
                      </h3>
                    </div>
                  </div>
                  
                  {/* Texto descriptivo - Muy compacto en móvil */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-foreground-muted leading-tight">
                      <span className="hidden sm:inline">
                        Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestro uso de cookies según nuestra{' '}
                        <a 
                          href="/privacy-policy" 
                          className="text-primary hover:text-primary-hover underline font-medium break-words"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Política de Privacidad
                        </a>
                        {' '}y{' '}
                        <a 
                          href="/terms-of-service" 
                          className="text-primary hover:text-primary-hover underline font-medium break-words"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Términos de Servicio
                        </a>
                        .
                      </span>
                      <span className="sm:hidden">
                        Mejoramos tu experiencia con cookies.{' '}
                        <a 
                          href="/privacy-policy" 
                          className="text-primary hover:text-primary-hover underline font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Política
                        </a>
                        {' '}y{' '}
                        <a 
                          href="/terms-of-service" 
                          className="text-primary hover:text-primary-hover underline font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Términos
                        </a>
                        .
                      </span>
                    </p>
                  </div>
                  
                  {/* Botones de acción - Ultra compactos en móvil */}
                  <div className="flex flex-row gap-1 sm:gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRejectAll}
                      className="flex items-center justify-center gap-1 text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 border-border hover:border-destructive/50 hover:text-destructive w-full sm:w-auto h-7 sm:h-8"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Rechazar</span>
                      <span className="sm:hidden">No</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCustomize}
                      className="flex items-center justify-center gap-1 text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 w-full sm:w-auto h-7 sm:h-8"
                    >
                      <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Personalizar</span>
                      <span className="sm:hidden">Opc</span>
                    </Button>
                    <Button
                      onClick={handleAcceptAll}
                      className="flex items-center justify-center gap-1 text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover shadow-lg w-full sm:w-auto h-7 sm:h-8"
                    >
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Aceptar</span>
                      <span className="sm:hidden">Sí</span>
                    </Button>
                  </div>
                </div>
              ) : (
                // Vista de personalización - Ultra compacta para móvil
                <div className="space-y-1 sm:space-y-2">
                  {/* Header de personalización - Mínimo */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                      <div className="w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-br from-primary to-accent rounded-md sm:rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Shield className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-base font-bold text-foreground">
                          Preferencias
                        </h3>
                        <p className="text-xs text-foreground-muted hidden sm:block">
                          Personaliza tu experiencia de privacidad
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(false)}
                      className="text-foreground-muted hover:text-foreground p-1 flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  {/* Lista de preferencias - Ultra compacta */}
                  <div className="space-y-1 sm:space-y-1.5">
                    {/* Cookies necesarias */}
                    <div className="flex items-center justify-between p-1.5 sm:p-3 bg-background/50 rounded-md sm:rounded-lg border border-border/50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-xs">
                          Necesarias
                        </h4>
                        <p className="text-xs text-foreground-muted hidden sm:block">
                          Esenciales para el funcionamiento básico.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                        <span className="text-xs font-medium text-green-600 hidden sm:inline">
                          Siempre activo
                        </span>
                        <span className="text-xs font-medium text-green-600 sm:hidden">
                          ✓
                        </span>
                      </div>
                    </div>

                    {/* Cookies de análisis */}
                    <div className="flex items-center justify-between p-1.5 sm:p-3 bg-background/50 rounded-md sm:rounded-lg border border-border/50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-xs">
                          Análisis
                        </h4>
                        <p className="text-xs text-foreground-muted hidden sm:block">
                          Nos ayudan a entender cómo interactúas.
                        </p>
                      </div>
                      <Button
                        variant={preferences.analytics ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePreferenceChange('analytics')}
                        className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 h-6 sm:h-7 flex-shrink-0"
                      >
                        {preferences.analytics ? 'Sí' : 'No'}
                      </Button>
                    </div>

                    {/* Cookies de marketing */}
                    <div className="flex items-center justify-between p-1.5 sm:p-3 bg-background/50 rounded-md sm:rounded-lg border border-border/50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-xs">
                          Marketing
                        </h4>
                        <p className="text-xs text-foreground-muted hidden sm:block">
                          Para mostrar anuncios relevantes.
                        </p>
                      </div>
                      <Button
                        variant={preferences.marketing ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePreferenceChange('marketing')}
                        className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 h-6 sm:h-7 flex-shrink-0"
                      >
                        {preferences.marketing ? 'Sí' : 'No'}
                      </Button>
                    </div>

                    {/* Cookies funcionales */}
                    <div className="flex items-center justify-between p-1.5 sm:p-3 bg-background/50 rounded-md sm:rounded-lg border border-border/50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-xs">
                          Funcionales
                        </h4>
                        <p className="text-xs text-foreground-muted hidden sm:block">
                          Para recordar tus preferencias.
                        </p>
                      </div>
                      <Button
                        variant={preferences.functional ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePreferenceChange('functional')}
                        className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 h-6 sm:h-7 flex-shrink-0"
                      >
                        {preferences.functional ? 'Sí' : 'No'}
                      </Button>
                    </div>
                  </div>

                  {/* Botones de acción finales - Ultra compactos */}
                  <div className="flex flex-row gap-1 sm:gap-2 pt-1.5 sm:pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={handleRejectAll}
                      className="flex items-center justify-center gap-1 text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 w-full sm:w-auto h-6 sm:h-8"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Rechazar todo</span>
                      <span className="sm:hidden">No</span>
                    </Button>
                    <Button
                      onClick={handleSavePreferences}
                      className="flex items-center justify-center gap-1 text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover shadow-lg w-full sm:w-auto h-6 sm:h-8"
                    >
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Guardar preferencias</span>
                      <span className="sm:hidden">Guardar</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
