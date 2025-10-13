'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Settings, 
  Plus, 
  Edit,
  Trash2,
  Send,
  Clock,
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

interface MessageTemplate {
  id: string
  name: string
  type: 'reminder' | 'invoice' | 'general'
  subject: string
  content: string
  variables: string[]
  createdAt: string
}

interface Notification {
  id: string
  type: 'email' | 'whatsapp' | 'sms'
  recipient: string
  subject: string
  content: string
  status: 'pending' | 'sent' | 'failed'
  scheduledFor: string
  sentAt?: string
  createdAt: string
}

const CommunicationsPage = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'notifications' | 'settings'>('templates')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch templates
        const templatesResponse = await fetch('/api/communications/templates')
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          setTemplates(templatesData)
        }

        // Fetch notifications
        const notificationsResponse = await fetch('/api/communications/notifications')
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateTemplate = async (templateData: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/communications/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (response.ok) {
        toast.success('Plantilla creada exitosamente')
        // Refresh templates
        const templatesResponse = await fetch('/api/communications/templates')
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          setTemplates(templatesData)
        }
        setIsCreateModalOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear la plantilla')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Error al crear la plantilla')
    }
  }

  const handleUpdateTemplate = async (templateData: MessageTemplate) => {
    try {
      const response = await fetch(`/api/communications/templates/${templateData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (response.ok) {
        toast.success('Plantilla actualizada exitosamente')
        // Refresh templates
        const templatesResponse = await fetch('/api/communications/templates')
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          setTemplates(templatesData)
        }
        setIsEditModalOpen(false)
        setSelectedTemplate(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar la plantilla')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Error al actualizar la plantilla')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) return

    try {
      const response = await fetch(`/api/communications/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Plantilla eliminada exitosamente')
        setTemplates(templates.filter(t => t.id !== templateId))
      } else {
        toast.error('Error al eliminar la plantilla')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar la plantilla')
    }
  }

  const handleSendNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/communications/notifications/${notificationId}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Notificación enviada exitosamente')
        // Refresh notifications
        const notificationsResponse = await fetch('/api/communications/notifications')
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData)
        }
      } else {
        toast.error('Error al enviar la notificación')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Error al enviar la notificación')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-success/20 text-success border-success/30'
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/30'
      case 'failed':
        return 'bg-destructive/20 text-destructive border-destructive/30'
      default:
        return 'bg-foreground-muted/20 text-foreground-muted border-foreground-muted/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado'
      case 'pending':
        return 'Pendiente'
      case 'failed':
        return 'Fallido'
      default:
        return 'Desconocido'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} />
      case 'whatsapp':
        return <Smartphone size={16} />
      case 'sms':
        return <MessageSquare size={16} />
      default:
        return <Bell size={16} />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
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
            <MessageSquare size={32} className="mr-3 text-primary" />
            Comunicaciones
          </h1>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center">
            <Plus size={20} className="mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-effect rounded-lg p-4 text-center">
            <MessageSquare size={24} className="text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{templates.length}</p>
            <p className="text-sm text-foreground-muted">Plantillas</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <Bell size={24} className="text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
            <p className="text-sm text-foreground-muted">Notificaciones</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <CheckCircle size={24} className="text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {notifications.filter(n => n.status === 'sent').length}
            </p>
            <p className="text-sm text-foreground-muted">Enviadas</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <Clock size={24} className="text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {notifications.filter(n => n.status === 'pending').length}
            </p>
            <p className="text-sm text-foreground-muted">Pendientes</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex space-x-1 bg-background-secondary rounded-lg p-1">
          <Button
            variant={activeTab === 'templates' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('templates')}
            className="flex-1"
          >
            <MessageSquare size={16} className="mr-2" />
            Plantillas
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('notifications')}
            className="flex-1"
          >
            <Bell size={16} className="mr-2" />
            Notificaciones
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('settings')}
            className="flex-1"
          >
            <Settings size={16} className="mr-2" />
            Configuración
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {templates.length > 0 ? (
              templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-effect rounded-xl p-6 border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                      <p className="text-sm text-foreground-muted">{template.subject}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        template.type === 'reminder' ? 'bg-blue/20 text-blue border-blue/30' :
                        template.type === 'invoice' ? 'bg-green/20 text-green border-green/30' :
                        'bg-purple/20 text-purple border-purple/30'
                      }`}>
                        {template.type === 'reminder' ? 'Recordatorio' :
                         template.type === 'invoice' ? 'Factura' : 'General'}
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedTemplate(template)
                          setIsEditModalOpen(true)
                        }}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-foreground-muted mb-2">Contenido:</p>
                    <p className="text-foreground">{template.content}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-foreground-muted">Variables: </span>
                      <span className="text-foreground">{template.variables.join(', ')}</span>
                    </div>
                    <span className="text-foreground-muted">
                      Creada: {formatDate(template.createdAt)}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-foreground-muted">
                <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No hay plantillas</h3>
                <p>Comienza creando tu primera plantilla de comunicación</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-effect rounded-xl p-6 border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{notification.subject}</h3>
                        <p className="text-sm text-foreground-muted">{notification.recipient}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(notification.status)}`}>
                        {getStatusText(notification.status)}
                      </span>
                      {notification.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => handleSendNotification(notification.id)}>
                          <Send size={16} className="mr-2" />
                          Enviar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-foreground-muted mb-2">Mensaje:</p>
                    <p className="text-foreground">{notification.content}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-foreground-muted">
                    <div className="flex items-center space-x-4">
                      <span>Programado: {formatDate(notification.scheduledFor)}</span>
                      {notification.sentAt && (
                        <span>Enviado: {formatDate(notification.sentAt)}</span>
                      )}
                    </div>
                    <span>Creado: {formatDate(notification.createdAt)}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-foreground-muted">
                <Bell size={64} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No hay notificaciones</h3>
                <p>Las notificaciones aparecerán aquí cuando se programen</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Configuración de Notificaciones</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Recordatorios por Email</p>
                    <p className="text-sm text-foreground-muted">Enviar recordatorios de clase por email</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings size={16} className="mr-2" />
                    Configurar
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Notificaciones WhatsApp</p>
                    <p className="text-sm text-foreground-muted">Configurar integración con WhatsApp</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings size={16} className="mr-2" />
                    Configurar
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Horario de Envío</p>
                    <p className="text-sm text-foreground-muted">Configurar horarios para envío automático</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings size={16} className="mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <CreateTemplateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateTemplate}
        />
      )}

      {/* Edit Template Modal */}
      {isEditModalOpen && selectedTemplate && (
        <EditTemplateModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedTemplate(null)
          }}
          onSave={handleUpdateTemplate}
          template={selectedTemplate}
        />
      )}
    </div>
  )
}

// Modal components would be implemented here
const CreateTemplateModal = ({ isOpen, onClose, onSave }: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<MessageTemplate, 'id' | 'createdAt'>) => void
}) => {
  // Implementation would go here
  return null
}

const EditTemplateModal = ({ isOpen, onClose, onSave, template }: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: MessageTemplate) => void
  template: MessageTemplate
}) => {
  // Implementation would go here
  return null
}

export default CommunicationsPage

