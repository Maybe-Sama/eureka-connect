'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Building, 
  CreditCard, 
  Bell,
  Palette,
  Shield,
  Save,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TeacherProfile, NotificationSettings } from '@/types'
import { toast } from 'sonner'

const SettingsPage = () => {
  const [profile, setProfile] = useState<TeacherProfile>({
    id: '',
    name: '',
    nif: '',
    fiscalAddress: '',
    bankAccount: '',
    logo: '',
    email: '',
    phone: '',
    createdAt: '',
    updatedAt: ''
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    id: '',
    emailReminders: false,
    whatsappReminders: false,
    reminderAdvance: 2,
    invoiceNotifications: false,
    createdAt: '',
    updatedAt: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch teacher profile
        const profileResponse = await fetch('/api/settings/profile')
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setProfile(profileData)
        }

        // Fetch notification settings
        const notificationsResponse = await fetch('/api/settings/notifications')
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Error al cargar la configuración')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleProfileUpdate = (field: keyof TeacherProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationUpdate = (field: keyof NotificationSettings, value: boolean | number) => {
    setNotifications(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Save profile
      const profileResponse = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      // Save notification settings
      const notificationsResponse = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      })

      if (profileResponse.ok && notificationsResponse.ok) {
        toast.success('Configuración guardada exitosamente')
      } else {
        toast.error('Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  const SettingsSection = ({ 
    title, 
    icon: Icon, 
    children, 
    className = '' 
  }: {
    title: string
    icon: any
    children: React.ReactNode
    className?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-effect rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Settings size={32} className="mr-3 text-primary" />
            Configuración
          </h1>
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center">
            <Save size={20} className="mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <SettingsSection title="Perfil del Profesor" icon={User}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileUpdate('name', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                NIF/CIF
              </label>
              <input
                type="text"
                value={profile.nif}
                onChange={(e) => handleProfileUpdate('nif', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="12345678A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Dirección Fiscal
              </label>
              <textarea
                value={profile.fiscalAddress}
                onChange={(e) => handleProfileUpdate('fiscalAddress', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Calle, número, código postal, ciudad, país"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cuenta Bancaria
              </label>
              <input
                type="text"
                value={profile.bankAccount}
                onChange={(e) => handleProfileUpdate('bankAccount', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ES91 2100 0418 4502 0005 1332"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileUpdate('email', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+34 612 345 678"
              />
            </div>
          </div>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection title="Configuración de Notificaciones" icon={Bell}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Recordatorios por Email</p>
                <p className="text-sm text-foreground-muted">Enviar recordatorios de clase por email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailReminders}
                  onChange={(e) => handleNotificationUpdate('emailReminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-background peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Recordatorios por WhatsApp</p>
                <p className="text-sm text-foreground-muted">Enviar recordatorios por WhatsApp</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.whatsappReminders}
                  onChange={(e) => handleNotificationUpdate('whatsappReminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-background peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Notificaciones de Facturas</p>
                <p className="text-sm text-foreground-muted">Enviar notificaciones cuando se generen facturas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.invoiceNotifications}
                  onChange={(e) => handleNotificationUpdate('invoiceNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-background peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Anticipación de Recordatorios (horas)
              </label>
              <select
                value={notifications.reminderAdvance}
                onChange={(e) => handleNotificationUpdate('reminderAdvance', Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={4}>4 horas</option>
                <option value={24}>1 día</option>
              </select>
            </div>
          </div>
        </SettingsSection>

        {/* Security Settings */}
        <SettingsSection title="Seguridad" icon={Shield}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <Button variant="outline" className="w-full">
              <Shield size={16} className="mr-2" />
              Cambiar Contraseña
            </Button>
          </div>
        </SettingsSection>

        {/* Appearance Settings */}
        <SettingsSection title="Apariencia" icon={Palette}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tema
              </label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="system">Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Color Principal
              </label>
              <div className="flex space-x-2">
                {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Logo de la Empresa
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload size={24} className="mx-auto mb-2 text-foreground-muted" />
                <p className="text-sm text-foreground-muted">Haz clic para subir o arrastra aquí</p>
                <p className="text-xs text-foreground-muted mt-1">PNG, JPG hasta 2MB</p>
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

export default SettingsPage

