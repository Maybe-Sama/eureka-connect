'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CookieBanner } from './CookieBanner'
import { useCookieConsent } from '@/hooks/useCookieConsent'

interface CookieBannerContextType {
  showBanner: boolean
  setShowBanner: (show: boolean) => void
}

const CookieBannerContext = createContext<CookieBannerContextType | undefined>(undefined)

export function useCookieBanner() {
  const context = useContext(CookieBannerContext)
  if (context === undefined) {
    throw new Error('useCookieBanner must be used within a CookieBannerProvider')
  }
  return context
}

interface CookieBannerProviderProps {
  children: React.ReactNode
}

export function CookieBannerProvider({ children }: CookieBannerProviderProps) {
  const { consent, isLoading, acceptAll, rejectAll, customize } = useCookieConsent()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Solo mostrar el banner si no hay consentimiento y no está cargando
    if (!isLoading && !consent) {
      // Pequeño delay para mejor UX
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (consent) {
      // Si ya hay consentimiento, ocultar el banner
      setShowBanner(false)
    }
  }, [consent, isLoading])

  // Escuchar cambios en el consentimiento para ocultar el banner
  useEffect(() => {
    if (consent) {
      setShowBanner(false)
    }
  }, [consent])

  const handleAccept = () => {
    acceptAll()
    setShowBanner(false)
  }

  const handleReject = () => {
    rejectAll()
    setShowBanner(false)
  }

  const handleCustomize = () => {
    // La personalización se maneja dentro del componente CookieBanner
    // El banner se ocultará automáticamente cuando se guarde la configuración
    // porque el estado de consent cambiará
  }

  return (
    <CookieBannerContext.Provider value={{ showBanner, setShowBanner }}>
      {children}
      {showBanner && (
        <CookieBanner
          onAccept={handleAccept}
          onReject={handleReject}
          onCustomize={handleCustomize}
        />
      )}
    </CookieBannerContext.Provider>
  )
}
