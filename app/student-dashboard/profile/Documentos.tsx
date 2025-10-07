'use client'

import { motion } from 'framer-motion'
import { FileText, Construction, Clock } from 'lucide-react'

export default function Documentos() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          📁 Documentos
        </h2>
        <p className="text-foreground-muted">
          Gestión de documentos académicos y certificados
        </p>
      </div>

      {/* Mensaje de construcción */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-8 border border-border text-center"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Construction className="w-10 h-10 text-primary" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground">
            Sección en Construcción
          </h3>
          
          <p className="text-foreground-muted max-w-md">
            Esta sección está siendo desarrollada para permitir la gestión 
            completa de documentos académicos, certificados y facturas.
          </p>

          <div className="flex items-center space-x-2 text-sm text-foreground-muted">
            <Clock className="w-4 h-4" />
            <span>Próximamente disponible</span>
          </div>
        </div>
      </motion.div>

      {/* Funcionalidades futuras */}
      <div className="glass-effect rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          🚀 Funcionalidades Próximas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 p-4 bg-background-tertiary rounded-lg">
            <FileText className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <h4 className="font-medium text-foreground">Certificados</h4>
              <p className="text-sm text-foreground-muted">
                Descarga automática de certificados de asistencia y finalización
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-background-tertiary rounded-lg">
            <FileText className="w-5 h-5 text-green-500 mt-1" />
            <div>
              <h4 className="font-medium text-foreground">Facturas</h4>
              <p className="text-sm text-foreground-muted">
                Acceso a todas tus facturas y comprobantes de pago
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-background-tertiary rounded-lg">
            <FileText className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <h4 className="font-medium text-foreground">Reportes</h4>
              <p className="text-sm text-foreground-muted">
                Reportes de progreso y calificaciones detalladas
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-background-tertiary rounded-lg">
            <FileText className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <h4 className="font-medium text-foreground">Materiales</h4>
              <p className="text-sm text-foreground-muted">
                Descarga de materiales de estudio y recursos adicionales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="glass-effect bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          📞 ¿Necesitas un documento?
        </h3>
        <div className="space-y-2 text-sm text-foreground-muted">
          <p>• Contacta con tu profesor para solicitar documentos específicos</p>
          <p>• Los certificados se generan automáticamente al completar cursos</p>
          <p>• Las facturas están disponibles en tu panel de facturación</p>
          <p>• Si tienes problemas, contacta con el soporte técnico</p>
        </div>
      </div>
    </div>
  )
}

