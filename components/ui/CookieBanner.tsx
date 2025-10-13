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
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
      >
        <div className="w-[90%]">
          <div className="glass-effect rounded-2xl shadow-2xl border border-white/10 p-3 sm:p-4 relative overflow-hidden">
            {/* Efectos de fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              {!showDetails ? (
                // Vista principal
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                      <Cookie className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">🍪 Cookies y Privacidad</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-foreground-muted leading-relaxed">
                      Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestro uso de cookies según nuestra{' '}
                      <a 
                        href="/privacy-policy" 
                        className="text-primary hover:text-primary-hover underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Política de Privacidad
                      </a>
                      {' '}y{' '}
                      <a 
                        href="/terms-of-service" 
                        className="text-primary hover:text-primary-hover underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Términos de Servicio
                      </a>
                      .
                    </p>
                  </div>
                  
                  <div className="flex flex-row gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRejectAll}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 border-border hover:border-destructive/50 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                      Rechazar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCustomize}
                      className="flex items-center gap-1 text-xs px-3 py-1.5"
                    >
                      <Settings className="w-3 h-3" />
                      Personalizar
                    </Button>
                    <Button
                      onClick={handleAcceptAll}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover shadow-lg"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Aceptar
                    </Button>
                  </div>
                </div>
              ) : (
                // Vista de personalización
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Preferencias de Cookies</h3>
                        <p className="text-xs text-foreground-muted">Personaliza tu experiencia de privacidad</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(false)}
                      className="text-foreground-muted hover:text-foreground p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Cookies necesarias */}
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Cookies Necesarias</h4>
                        <p className="text-xs text-foreground-muted mt-1">
                          Esenciales para el funcionamiento básico del sitio web.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-green-600">Siempre activo</span>
                      </div>
                    </div>

                    {/* Cookies de análisis */}
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Cookies de Análisis</h4>
                        <p className="text-xs text-foreground-muted mt-1">
                          Nos ayudan a entender cómo interactúas con el sitio web.
                        </p>
                      </div>
                      <Button
                        variant={preferences.analytics ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePreferenceChange('analytics')}
                        className="ml-3 text-xs px-2 py-1"
                      >
                        {preferences.analytics ? 'Activado' : 'Desactivado'}
                      </Button>
                    </div>

                    {/* Cookies de marketing */}
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Cookies de Marketing</h4>
                        <p className="text-xs text-foreground-muted mt-1">
                          Utilizadas para mostrar anuncios relevantes.
                        </p>
                      </div>
                      <Button
                        variant={preferences.marketing ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePreferenceChange('marketing')}
                        className="ml-3 text-xs px-2 py-1"
                      >
                        {preferences.marketing ? 'Activado' : 'Desactivado'}
                      </Button>
                    </div>

                    {/* Cookies funcionales */}
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Cookies Funcionales</h4>
                        <p className="text-xs text-foreground-muted mt-1">
                          Permiten recordar tus preferencias.
                        </p>
                      </div>
                      <Button
                        variant={preferences.functional ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePreferenceChange('functional')}
                        className="ml-3 text-xs px-2 py-1"
                      >
                        {preferences.functional ? 'Activado' : 'Desactivado'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 pt-3 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={handleRejectAll}
                      className="flex items-center gap-1 text-xs px-3 py-1.5"
                    >
                      <X className="w-3 h-3" />
                      Rechazar todo
                    </Button>
                    <Button
                      onClick={handleSavePreferences}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover shadow-lg"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Guardar
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
