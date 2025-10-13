import { useState, useEffect } from 'react'
import { CookiePreferences, getCookiePreferences, getCookieConsent, initializeAllServices } from '@/lib/cookie-utils'

export type { CookiePreferences }

export function useCookieConsent() {
  const [consent, setConsent] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar preferencias guardadas
    const savedConsent = getCookieConsent()
    const savedPreferences = getCookiePreferences()
    
    if (savedConsent) {
      setConsent(savedConsent)
    }
    
    if (savedPreferences) {
      setPreferences(savedPreferences)
      // Inicializar servicios según las preferencias guardadas
      initializeAllServices(savedPreferences)
    }
    
    setIsLoading(false)
  }, [])

  const acceptAll = () => {
    const newPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    
    setConsent('accepted')
    setPreferences(newPreferences)
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-preferences', JSON.stringify(newPreferences))
    
    // Inicializar todos los servicios
    initializeAllServices(newPreferences)
  }

  const rejectAll = () => {
    const newPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    
    setConsent('rejected')
    setPreferences(newPreferences)
    localStorage.setItem('cookie-consent', 'rejected')
    localStorage.setItem('cookie-preferences', JSON.stringify(newPreferences))
  }

  const customize = (newPreferences: CookiePreferences) => {
    setConsent('customized')
    setPreferences(newPreferences)
    localStorage.setItem('cookie-consent', 'customized')
    localStorage.setItem('cookie-preferences', JSON.stringify(newPreferences))
    
    // Inicializar servicios según preferencias
    initializeAllServices(newPreferences)
  }

  const clearConsent = () => {
    setConsent(null)
    localStorage.removeItem('cookie-consent')
    localStorage.removeItem('cookie-preferences')
  }

  return {
    consent,
    preferences,
    isLoading,
    acceptAll,
    rejectAll,
    customize,
    clearConsent,
    hasConsent: consent !== null
  }
}
