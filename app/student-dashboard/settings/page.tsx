'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Camera,
  Upload,
  User,
  Check
} from 'lucide-react'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvatarCache } from '@/hooks/useAvatarCache'

export default function StudentSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { avatarUrl, refreshAvatar, updateAvatar } = useAvatarCache()

  // Estados para cuenta
  const [email, setEmail] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [changingPassword, setChangingPassword] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)

  // Estados para avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [predefinedAvatars, setPredefinedAvatars] = useState<string[]>([])

  // Estados para navegación
  const [activeTab, setActiveTab] = useState('account')

  // Cargar datos iniciales
  useEffect(() => {
    if (user && !authLoading) {
      loadUserData()
    }
  }, [user, authLoading])

  // Cargar datos del usuario
  const loadUserData = async () => {
    try {
      // Cargar datos de email (simulado por ahora)
      setEmail(user?.email || '')
      setEmailVerified(true) // Esto debería venir de la API
      
      // Cargar avatares predefinidos
      await loadPredefinedAvatars()
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }


  // Cargar avatares predefinidos
  const loadPredefinedAvatars = async () => {
    try {
      console.log('🔄 Cargando avatares predefinidos...')
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .list('defaults', {
          limit: 6,
          sortBy: { column: 'name', order: 'asc' }
        })

      console.log('📁 Datos de storage:', { data, error })

      if (error) {
        console.error('❌ Error loading predefined avatars:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los avatares predefinidos. Verifica que el bucket 'avatars' existe y tiene la carpeta 'defaults'.",
          variant: "destructive"
        })
        return
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No se encontraron avatares predefinidos')
        toast({
          title: "Información",
          description: "No hay avatares predefinidos disponibles. Sube algunas imágenes a la carpeta 'defaults' del bucket 'avatars'.",
          variant: "default"
        })
        return
      }

      const avatarUrls = data.map(file => {
        const url = supabase.storage.from('avatars').getPublicUrl(`defaults/${file.name}`).data.publicUrl
        console.log(`🖼️ Avatar URL: ${file.name} -> ${url}`)
        return url
      })

      console.log('✅ Avatares predefinidos cargados:', avatarUrls)
      setPredefinedAvatars(avatarUrls)
    } catch (error) {
      console.error('❌ Error loading predefined avatars:', error)
      toast({
        title: "Error",
        description: "Error al cargar los avatares predefinidos.",
        variant: "destructive"
      })
    }
  }


  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 8 caracteres.",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive"
      })
      return
    }

    try {
      setChangingPassword(true)
      const token = localStorage.getItem('session_token')
      if (!token) return

      const response = await fetch('/api/student/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          currentPassword,
          newPassword
        })
      })

      const result = await response.json()

      if (result.success) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast({
          title: "Contraseña cambiada",
          description: "Tu contraseña se ha actualizado correctamente.",
          variant: "default"
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo cambiar la contraseña.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: "Error al cambiar la contraseña.",
        variant: "destructive"
      })
    } finally {
      setChangingPassword(false)
    }
  }

  // Verificar email
  const handleVerifyEmail = async () => {
    try {
      setVerifyingEmail(true)
      const token = localStorage.getItem('session_token')
      if (!token) return

      const response = await fetch('/api/student/settings/initiate-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Email de verificación enviado",
          description: "Revisa tu correo y haz clic en el enlace para verificar tu email.",
          variant: "default"
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el email de verificación.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error verifying email:', error)
      toast({
        title: "Error",
        description: "Error al enviar el email de verificación.",
        variant: "destructive"
      })
    } finally {
      setVerifyingEmail(false)
    }
  }

  // Toggle mostrar contraseña
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  // Subir avatar personalizado
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido.",
        variant: "destructive"
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 5MB.",
        variant: "destructive"
      })
      return
    }

    try {
      setUploadingAvatar(true)

      // Convertir archivo a base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as string
          const fileExt = file.name.split('.').pop()
          const fileName = `user-${user.id}.${fileExt}`

          // Llamar a la API route
          const response = await fetch('/api/student/settings/upload-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: user.id,
              file: fileData,
              fileName: fileName
            })
          })

          const result = await response.json()

          if (result.success) {
            // Actualizar estado local y caché
            setSelectedAvatar('')
            updateAvatar(result.avatarUrl)

            toast({
              title: "Avatar actualizado",
              description: "Tu foto de perfil se ha actualizado correctamente.",
              variant: "default"
            })
          } else {
            throw new Error(result.error || 'Error al subir la imagen')
          }
        } catch (error) {
          console.error('Error uploading avatar:', error)
          toast({
            title: "Error",
            description: "No se pudo subir la imagen. Inténtalo de nuevo.",
            variant: "destructive"
          })
        } finally {
          setUploadingAvatar(false)
        }
      }

      reader.readAsDataURL(file)

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
        variant: "destructive"
      })
      setUploadingAvatar(false)
    }
  }

  // Seleccionar avatar predefinido
  const handleSelectPredefinedAvatar = async (avatarUrl: string) => {
    if (!user?.id) return

    try {
      setUploadingAvatar(true)
      setSelectedAvatar(avatarUrl)

      // Llamar a la API route
      const response = await fetch('/api/student/settings/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: user.id,
          avatarUrl: avatarUrl
        })
      })

      const result = await response.json()

      if (result.success) {
        // Actualizar estado local y caché
        updateAvatar(avatarUrl)

        toast({
          title: "Avatar actualizado",
          description: "Tu foto de perfil se ha actualizado correctamente.",
          variant: "default"
        })
      } else {
        throw new Error(result.error || 'Error al actualizar el avatar')
      }

    } catch (error) {
      console.error('Error updating avatar:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el avatar. Inténtalo de nuevo.",
        variant: "destructive"
      })
      setSelectedAvatar('')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
      </div>
    )
  }

  if (!user) {
    router.push('/student-login')
    return null
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Configuración de tu cuenta</h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y configuración de seguridad
        </p>
      </div>

      {/* Sección de Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Foto de perfil
          </CardTitle>
          <CardDescription>
            Personaliza tu foto de perfil subiendo una imagen o eligiendo un avatar predefinido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar actual */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-border bg-background-secondary"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {avatarUrl ? (
                    <motion.img
                      key={avatarUrl}
                      src={avatarUrl}
                      alt="Avatar del usuario"
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <motion.div
                      key="default"
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <User className="w-8 h-8 text-muted-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {uploadingAvatar && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DiagonalBoxLoader size="sm" color="white" />
                </motion.div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">Tu foto actual</p>
              <p className="text-xs text-muted-foreground">
                Haz clic en "Subir imagen" para cambiar
              </p>
            </div>
          </div>

          {/* Botón de subida */}
          <div className="flex justify-center">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingAvatar}
              />
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={uploadingAvatar}
              >
                <Upload className="w-4 h-4" />
                {uploadingAvatar ? 'Subiendo...' : 'Subir imagen'}
              </Button>
            </div>
          </div>

          {/* Avatares predefinidos */}
          {predefinedAvatars.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-base font-medium">O elige un avatar predefinido</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Haz clic en cualquier imagen para usarla como tu foto de perfil
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {predefinedAvatars.map((avatar, index) => (
                  <motion.button
                    key={index}
                    className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                      selectedAvatar === avatar
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectPredefinedAvatar(avatar)}
                    disabled={uploadingAvatar}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {selectedAvatar === avatar && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-primary/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Check className="w-6 h-6 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>• Formatos soportados: JPG, PNG, GIF</p>
            <p>• Tamaño máximo: 5MB</p>
            <p>• La imagen se redimensionará automáticamente</p>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Cuenta e inicio de sesión
          </CardTitle>
          <CardDescription>
            Gestiona tu cuenta y configuración de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
                  {/* Información de email */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Correo electrónico</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{email}</span>
                        {emailVerified ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Verificado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Pendiente de verificación</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!emailVerified && (
                      <Button
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {verifyingEmail ? (
                          <DiagonalBoxLoader size="sm" color="hsl(var(--primary))" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        Verificar correo electrónico
                      </Button>
                    )}
                  </div>

                  {/* Cambio de contraseña */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Cambiar contraseña</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Actualiza tu contraseña para mantener tu cuenta segura
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña actual</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPasswords.new ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Mínimo 8 caracteres
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2"
          >
            {changingPassword ? (
              <DiagonalBoxLoader size="sm" color="hsl(var(--primary))" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            Cambiar contraseña
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
