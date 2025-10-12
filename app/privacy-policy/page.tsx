'use client'

import React from 'react'
import { ArrowLeft, Shield, Eye, Database, Lock, Users, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Política de Privacidad
            </h1>
            <p className="text-foreground-muted">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Información que recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Recopilamos información que nos proporcionas directamente, como cuando creas una cuenta, 
                te registras para recibir comunicaciones o te pones en contacto con nosotros.
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground-muted">
                <li>Información de contacto (nombre, dirección de correo electrónico, número de teléfono)</li>
                <li>Información de la cuenta (nombre de usuario, contraseña)</li>
                <li>Información de perfil (foto de perfil, preferencias)</li>
                <li>Comunicaciones que nos envías</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Cómo utilizamos tu información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Utilizamos la información que recopilamos para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground-muted">
                <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                <li>Procesar transacciones y enviar información relacionada</li>
                <li>Enviar comunicaciones técnicas, actualizaciones y notificaciones</li>
                <li>Responder a tus comentarios y preguntas</li>
                <li>Personalizar tu experiencia en nuestros servicios</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Protección de datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Implementamos medidas de seguridad técnicas, administrativas y físicas apropiadas 
                para proteger tu información personal contra acceso no autorizado, alteración, 
                divulgación o destrucción.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Encriptación</h4>
                  <p className="text-sm text-foreground-muted">
                    Todos los datos sensibles se encriptan en tránsito y en reposo.
                  </p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Acceso limitado</h4>
                  <p className="text-sm text-foreground-muted">
                    Solo personal autorizado puede acceder a tu información.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Compartir información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                No vendemos, alquilamos ni compartimos tu información personal con terceros, 
                excepto en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground-muted">
                <li>Con tu consentimiento explícito</li>
                <li>Para cumplir con obligaciones legales</li>
                <li>Con proveedores de servicios que nos ayudan a operar nuestro negocio</li>
                <li>En caso de fusión, adquisición o venta de activos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Tus derechos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Tienes derecho a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground-muted">
                <li>Acceder a tu información personal</li>
                <li>Corregir información inexacta</li>
                <li>Solicitar la eliminación de tu información</li>
                <li>Oponerte al procesamiento de tu información</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
                <li>Portabilidad de datos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-muted mb-4">
                Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos:
              </p>
              <div className="space-y-2 text-foreground-muted">
                <p><strong>Email:</strong> privacy@eureka-connect.com</p>
                <p><strong>Teléfono:</strong> +34 123 456 789</p>
                <p><strong>Dirección:</strong> Calle Ejemplo, 123, 28001 Madrid, España</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
