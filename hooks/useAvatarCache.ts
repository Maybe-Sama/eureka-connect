import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Cache simple en memoria
const avatarCache = new Map<string, string>()

export function useAvatarCache() {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const loadAvatar = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Verificar caché primero
    const cacheKey = `avatar_${user.id}`
    if (avatarCache.has(cacheKey)) {
      setAvatarUrl(avatarCache.get(cacheKey)!)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Obtener student_id desde system_users
      const { data: userData, error: userError } = await supabase
        .from('system_users')
        .select('student_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData?.student_id) {
        console.error('Error loading user data:', userError)
        return
      }

      // Obtener avatar_url desde students
      const { data: studentData, error } = await supabase
        .from('students')
        .select('avatar_url')
        .eq('id', userData.student_id)
        .single()

      if (error) {
        console.error('Error loading avatar:', error)
        return
      }

      const avatar = studentData?.avatar_url || ''
      
      // Guardar en caché
      avatarCache.set(cacheKey, avatar)
      setAvatarUrl(avatar)
    } catch (error) {
      console.error('Error loading avatar:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updateAvatar = useCallback((newAvatarUrl: string) => {
    if (!user?.id) return

    const cacheKey = `avatar_${user.id}`
    avatarCache.set(cacheKey, newAvatarUrl)
    setAvatarUrl(newAvatarUrl)
  }, [user?.id])

  const clearCache = useCallback(() => {
    if (!user?.id) return

    const cacheKey = `avatar_${user.id}`
    avatarCache.delete(cacheKey)
    setAvatarUrl('')
  }, [user?.id])

  useEffect(() => {
    loadAvatar()
  }, [loadAvatar])

  return {
    avatarUrl,
    loading,
    refreshAvatar: loadAvatar,
    updateAvatar,
    clearCache
  }
}

// Función para precargar avatares
export const preloadAvatar = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve()
      return
    }

    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// Función para limpiar caché de avatares no utilizados
export const cleanupAvatarCache = () => {
  // En una implementación más avanzada, podrías limpiar avatares antiguos
  // Por ahora, mantenemos todos en memoria
  console.log(`Avatar cache size: ${avatarCache.size}`)
}
