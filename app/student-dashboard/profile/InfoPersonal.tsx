'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Mail, Phone, Calendar, Hash, MapPin, Settings } from 'lucide-react'
import { formatStudentCode } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAvatarCache } from '@/hooks/useAvatarCache'
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar'

interface StudentData {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  parent_phone?: string
  birth_date?: string
  student_code?: string
  start_date?: string
  parent_contact_type?: string
  dni?: string
  nif?: string
  address?: string
  postal_code?: string
  city?: string
  province?: string
  country?: string
  avatar_url?: string
  // Campos del receptor
  receptor_nombre?: string
  receptor_apellidos?: string
  receptor_email?: string
}

export default function InfoPersonal() {
  const { user } = useAuth()
  const router = useRouter()
  const { avatarUrl } = useAvatarCache()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (user?.studentId) {
      loadStudentData()
    }
  }, [user?.studentId])

  const loadStudentData = async () => {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user?.studentId)
        .single()

      if (error) {
        console.error('Error loading student:', error)
        return
      }

      setStudentData(student)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-student-primary mx-auto"></div>
          <p className="mt-4 text-foreground-muted text-sm sm:text-base">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground-muted">No se pudo cargar la información del estudiante.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Preload del avatar para caché */}
      {avatarUrl && (
        <link rel="preload" as="image" href={avatarUrl} />
      )}
      
      {/* Header del estudiante */}
      <div className="glass-effect rounded-xl shadow-lg overflow-hidden border border-border">
        <div className="bg-gradient-to-r from-primary to-primary/80 px-3 sm:px-4 py-4 sm:py-5">
          <div className="relative">
            {/* Avatar - Esquina superior izquierda */}
            <div className="absolute top-0 left-0">
              <OptimizedAvatar
                src={avatarUrl}
                alt={`Avatar de ${studentData.first_name} ${studentData.last_name}`}
                fallback={studentData.first_name.charAt(0) + studentData.last_name.charAt(0)}
                size="md"
              />
            </div>

            {/* Botón de configuración - Esquina superior derecha */}
            <div className="absolute top-0 right-0 flex items-center h-12 sm:h-14">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/student-dashboard/settings')}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-0"
                title="Configuración"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {/* Nombre y curso - Centrados */}
            <div className="text-center pt-2 sm:pt-4">
              <h1 className="text-lg sm:text-xl font-bold text-primary-foreground">
                {studentData.first_name} {studentData.last_name}
              </h1>
              <p className="text-primary-foreground/80 mt-1 text-xs sm:text-sm">{user?.courseName || 'Estudiante Profesor Eureka'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="glass-effect rounded-2xl shadow-lg p-4 sm:p-6 border border-border">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center">
          <User className="mr-2 text-primary" size={24} />
          Información Personal
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <InfoCard
            icon={<User size={20} />}
            label="Nombre Completo"
            value={`${studentData.first_name} ${studentData.last_name}`}
          />
          <InfoCard
            icon={<Mail size={20} />}
            label="Email"
            value={studentData.email}
          />
          <InfoCard
            icon={<Phone size={20} />}
            label="Teléfono"
            value={studentData.phone}
          />
          {studentData.parent_phone && (
            <InfoCard
              icon={<Phone size={20} />}
              label={`Teléfono ${studentData.parent_contact_type || 'Contacto'}`}
              value={studentData.parent_phone}
            />
          )}
          {studentData.birth_date && (
            <InfoCard
              icon={<Calendar size={20} />}
              label="Fecha de Nacimiento"
              value={new Date(studentData.birth_date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            />
          )}
          {studentData.start_date && (
            <InfoCard
              icon={<Calendar size={20} />}
              label="Fecha de Inicio"
              value={new Date(studentData.start_date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            />
          )}
        </div>
      </div>

      {/* Datos del Receptor */}
      {(studentData.receptor_nombre || studentData.receptor_apellidos || studentData.receptor_email) && (
        <div className="glass-effect rounded-2xl shadow-lg p-4 sm:p-6 border border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center">
            <User className="mr-2 text-primary" size={24} />
            Datos del Padre/Madre/Tutor
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {studentData.receptor_nombre && (
              <InfoCard
                icon={<User size={20} />}
                label="Nombre del Receptor"
                value={studentData.receptor_nombre}
              />
            )}
            {studentData.receptor_apellidos && (
              <InfoCard
                icon={<User size={20} />}
                label="Apellidos del Receptor"
                value={studentData.receptor_apellidos}
              />
            )}
            {studentData.receptor_email && (
              <InfoCard
                icon={<Mail size={20} />}
                label="Email del Receptor"
                value={studentData.receptor_email}
              />
            )}
          </div>
        </div>
      )}

      {/* Datos de Identificación */}
      {(studentData.student_code || studentData.dni || studentData.nif) && (
        <div className="glass-effect rounded-2xl shadow-lg p-4 sm:p-6 border border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center">
            <Hash className="mr-2 text-primary" size={24} />
            Datos de Identificación
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {studentData.student_code && (
              <InfoCard
                icon={<Hash size={20} />}
                label="Código de Estudiante"
                value={formatStudentCode(studentData.student_code)}
                mono
              />
            )}
            {studentData.dni && (
              <InfoCard
                icon={<Hash size={20} />}
                label="DNI"
                value={studentData.dni}
              />
            )}
            {studentData.nif && (
              <InfoCard
                icon={<Hash size={20} />}
                label="NIF"
                value={studentData.nif}
              />
            )}
          </div>
        </div>
      )}

      {/* Dirección */}
      {(studentData.address || studentData.city) && (
        <div className="glass-effect rounded-2xl shadow-lg p-4 sm:p-6 border border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center">
            <MapPin className="mr-2 text-primary" size={24} />
            Dirección
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {studentData.address && (
              <InfoCard
                icon={<MapPin size={20} />}
                label="Dirección"
                value={studentData.address}
                fullWidth
              />
            )}
            {studentData.postal_code && (
              <InfoCard
                label="Código Postal"
                value={studentData.postal_code}
              />
            )}
            {studentData.city && (
              <InfoCard
                label="Ciudad"
                value={studentData.city}
              />
            )}
            {studentData.province && (
              <InfoCard
                label="Provincia"
                value={studentData.province}
              />
            )}
            {studentData.country && (
              <InfoCard
                label="País"
                value={studentData.country}
              />
            )}
          </div>
        </div>
      )}

      {/* Ayuda */}
      <div className="glass-effect bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          ¿Necesitas actualizar tu información?
        </h3>
        <p className="text-foreground-secondary text-sm">
          Si necesitas modificar algún dato de tu perfil, por favor contacta con tu profesor.
        </p>
      </div>
    </div>
  )
}

// Helper component for info cards
function InfoCard({ 
  icon, 
  label, 
  value, 
  fullWidth = false,
  mono = false
}: { 
  icon?: React.ReactNode
  label: string
  value: string
  fullWidth?: boolean
  mono?: boolean
}) {
  return (
    <div className={fullWidth ? 'lg:col-span-2' : ''}>
      <div className="flex items-start space-x-3 p-3 sm:p-4 bg-background-tertiary rounded-xl hover:bg-background-tertiary/70 transition-colors border border-border/50">
        {icon && (
          <div className="flex-shrink-0 mt-1 text-primary">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <dt className="text-xs sm:text-sm font-medium text-foreground-muted mb-1">{label}</dt>
          <dd className={`text-sm sm:text-base text-foreground break-words ${mono ? 'font-mono' : ''}`}>
            {value}
          </dd>
        </div>
      </div>
    </div>
  )
}

