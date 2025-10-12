// Utilidades para gestión de cookies

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

/**
 * Verifica si se pueden usar cookies de un tipo específico
 * @param type Tipo de cookie a verificar
 * @param preferences Preferencias de cookies del usuario
 * @returns true si se pueden usar, false en caso contrario
 */
export function canUseCookie(type: keyof CookiePreferences, preferences: CookiePreferences): boolean {
  if (type === 'necessary') return true
  return preferences[type] === true
}

/**
 * Obtiene las preferencias de cookies guardadas en localStorage
 * @returns Preferencias de cookies o null si no existen
 */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem('cookie-preferences')
    if (!saved) return null
    
    const parsed = JSON.parse(saved)
    return parsed as CookiePreferences
  } catch (error) {
    console.error('Error parsing cookie preferences:', error)
    return null
  }
}

/**
 * Obtiene el estado de consentimiento de cookies
 * @returns Estado de consentimiento o null si no existe
 */
export function getCookieConsent(): string | null {
  if (typeof window === 'undefined') return null
  
  return localStorage.getItem('cookie-consent')
}

/**
 * Verifica si el usuario ha dado consentimiento para cookies
 * @returns true si ha dado consentimiento, false en caso contrario
 */
export function hasCookieConsent(): boolean {
  return getCookieConsent() !== null
}

/**
 * Inicializa servicios de analytics si están habilitados
 * @param preferences Preferencias de cookies del usuario
 */
export function initializeAnalytics(preferences: CookiePreferences): void {
  if (!preferences.analytics) return
  
  console.log('Analytics initialized with user consent')
  
  // Aquí puedes agregar la inicialización de Google Analytics u otros servicios
  // Ejemplo:
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('consent', 'update', {
  //     analytics_storage: 'granted'
  //   })
  // }
}

/**
 * Inicializa servicios de marketing si están habilitados
 * @param preferences Preferencias de cookies del usuario
 */
export function initializeMarketing(preferences: CookiePreferences): void {
  if (!preferences.marketing) return
  
  console.log('Marketing services initialized with user consent')
  
  // Aquí puedes agregar la inicialización de servicios de marketing
  // Ejemplo: Facebook Pixel, Google Ads, etc.
}

/**
 * Inicializa servicios funcionales si están habilitados
 * @param preferences Preferencias de cookies del usuario
 */
export function initializeFunctional(preferences: CookiePreferences): void {
  if (!preferences.functional) return
  
  console.log('Functional services initialized with user consent')
  
  // Aquí puedes agregar la inicialización de servicios funcionales
  // Ejemplo: recordar preferencias de usuario, temas, etc.
}

/**
 * Inicializa todos los servicios según las preferencias del usuario
 * @param preferences Preferencias de cookies del usuario
 */
export function initializeAllServices(preferences: CookiePreferences): void {
  initializeAnalytics(preferences)
  initializeMarketing(preferences)
  initializeFunctional(preferences)
}
