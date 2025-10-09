'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import StudentLayout from '@/components/layout/student-layout'
import * as Tabs from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import { User, FileText } from 'lucide-react'
import InfoPersonal from './InfoPersonal'
import Documentos from './Documentos'

export default function StudentProfilePage() {
  const { user, loading, isStudent } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isStudent) {
      router.push('/login')
    }
  }, [loading, isStudent, router])

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground-muted">Cargando perfil...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (!isStudent) {
    return null
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs.Root defaultValue="info" className="space-y-6">
            {/* Tab List */}
            <div className="glass-effect rounded-2xl p-2 border border-border">
              <Tabs.List 
                className="flex space-x-1 bg-background-tertiary rounded-xl p-1"
                role="tablist"
                aria-label="Navegación del perfil del estudiante"
              >
                <Tabs.Trigger
                  value="info"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg hover:bg-background-tertiary/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="tab"
                  aria-selected="false"
                  aria-controls="info-panel"
                  id="info-tab"
                >
                  <User size={20} aria-hidden="true" />
                  <span className="font-medium">Información Personal</span>
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="docs"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg hover:bg-background-tertiary/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  role="tab"
                  aria-selected="false"
                  aria-controls="docs-panel"
                  id="docs-tab"
                >
                  <FileText size={20} aria-hidden="true" />
                  <span className="font-medium">Documentos</span>
                </Tabs.Trigger>
              </Tabs.List>
        </div>

            {/* Tab Content */}
            <Tabs.Content 
              value="info" 
              className="mt-6"
              role="tabpanel"
              aria-labelledby="info-tab"
              id="info-panel"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <InfoPersonal />
              </motion.div>
            </Tabs.Content>


            <Tabs.Content 
              value="docs" 
              className="mt-6"
              role="tabpanel"
              aria-labelledby="docs-tab"
              id="docs-panel"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Documentos />
              </motion.div>
            </Tabs.Content>
          </Tabs.Root>
        </motion.div>
      </div>
    </StudentLayout>
  )
}



