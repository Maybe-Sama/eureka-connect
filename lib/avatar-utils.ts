/**
 * Utilidades para el manejo de avatares
 * Funciones compartidas entre las API routes de avatares
 */

// Función para verificar si una URL es un avatar personalizado (no predefinido)
export function isCustomAvatar(avatarUrl: string): boolean {
  if (!avatarUrl) return false
  // Los avatares personalizados tienen el formato: user-{userId}.{ext}
  // Los avatares predefinidos están en la carpeta 'defaults/'
  return !avatarUrl.includes('/defaults/') && avatarUrl.includes('user-')
}

// Función para extraer el nombre del archivo de una URL
export function getFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    return pathParts[pathParts.length - 1]
  } catch {
    return null
  }
}

// Función para generar el nombre de archivo para avatares personalizados
export function generateCustomAvatarFileName(userId: string, fileExtension: string): string {
  return `user-${userId}.${fileExtension}`
}

// Función para verificar si una URL es un avatar predefinido
export function isPredefinedAvatar(avatarUrl: string): boolean {
  if (!avatarUrl) return false
  return avatarUrl.includes('/defaults/')
}

// Función para obtener el tipo de avatar basado en la URL
export function getAvatarType(avatarUrl: string): 'custom' | 'predefined' | 'none' {
  if (!avatarUrl) return 'none'
  if (isCustomAvatar(avatarUrl)) return 'custom'
  if (isPredefinedAvatar(avatarUrl)) return 'predefined'
  return 'none'
}
