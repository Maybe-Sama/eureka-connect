import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function useAvatar() {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const loadAvatar = async () => {
    if (!user?.id) {
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

      setAvatarUrl(studentData?.avatar_url || '')
    } catch (error) {
      console.error('Error loading avatar:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvatar()
  }, [user?.id])

  return {
    avatarUrl,
    loading,
    refreshAvatar: loadAvatar
  }
}
