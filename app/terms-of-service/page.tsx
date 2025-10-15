'use client'

import React from 'react'
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function TermsOfServicePage() {
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
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Términos de Servicio
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
                <FileText className="w-5 h-5 text-primary" />
                Aceptación de los términos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Al acceder y utilizar Eureka-Connect, aceptas estar sujeto a estos Términos de Servicio 
                y a todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos 
                términos, no debes utilizar nuestro servicio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Uso permitido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Puedes utilizar Eureka-Connect para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground-muted">
                <li>Gestionar tu perfil de estudiante o profesor</li>
                <li>Acceder a horarios y calendarios de clases</li>
                <li>Ver y descargar facturas</li>
                <li>Comunicarte con otros usuarios del sistema</li>
                <li>Utilizar las herramientas educativas disponibles</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Uso prohibido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                No puedes utilizar Eureka-Connect para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground-muted">
                <li>Actividades ilegales o no autorizadas</li>
                <li>Interferir con el funcionamiento del servicio</li>
                <li>Intentar acceder a cuentas de otros usuarios</li>
                <li>Distribuir malware o contenido malicioso</li>
                <li>Violar derechos de propiedad intelectual</li>
                <li>Spam o comunicaciones no deseadas</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Responsabilidades del usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Como usuario de Eureka-Connect, eres responsable de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground-muted">
                <li>Mantener la confidencialidad de tu cuenta y contraseña</li>
                <li>Proporcionar información precisa y actualizada</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de tu cuenta</li>
                <li>Cumplir con todas las leyes y regulaciones aplicables</li>
                <li>Respetar los derechos de otros usuarios</li>
                <li>No compartir contenido inapropiado o ofensivo</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propiedad intelectual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Eureka-Connect y su contenido original, características y funcionalidad son propiedad 
                de Eureka Corp y están protegidos por leyes de derechos de autor, marcas registradas 
                y otras leyes de propiedad intelectual.
              </p>
              <p className="text-foreground-muted">
                No puedes reproducir, distribuir, modificar, crear trabajos derivados, mostrar públicamente, 
                ejecutar públicamente, republicar, descargar, almacenar o transmitir cualquiera de nuestros 
                materiales sin nuestro permiso previo por escrito.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitación de responsabilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                En la máxima medida permitida por la ley, Eureka-Connect no será responsable de daños 
                directos, indirectos, incidentales, especiales, consecuenciales o punitivos, incluyendo 
                pero no limitado a pérdida de beneficios, datos, uso, buena voluntad u otras pérdidas 
                intangibles.
              </p>
              <p className="text-foreground-muted">
                Nuestro servicio se proporciona &quot;tal como está&quot; y &quot;según disponibilidad&quot; sin garantías 
                de ningún tipo, ya sean expresas o implícitas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Nos reservamos el derecho de modificar o reemplazar estos Términos de Servicio en 
                cualquier momento. Si una revisión es material, intentaremos proporcionar al menos 
                30 días de aviso antes de que entren en vigor los nuevos términos.
              </p>
              <p className="text-foreground-muted">
                El uso continuado de nuestro servicio después de cualquier revisión constituye tu 
                aceptación de los nuevos términos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terminación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-muted">
                Podemos terminar o suspender tu cuenta inmediatamente, sin previo aviso o responsabilidad, 
                por cualquier motivo, incluyendo sin limitación si violas los Términos de Servicio.
              </p>
              <p className="text-foreground-muted">
                Al terminar, tu derecho a usar el servicio cesará inmediatamente. Si deseas terminar 
                tu cuenta, puedes simplemente dejar de usar el servicio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ley aplicable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-muted">
                Estos Términos de Servicio se regirán e interpretarán de acuerdo con las leyes de España, 
                sin consideración a sus disposiciones sobre conflictos de leyes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-muted mb-4">
                Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos:
              </p>
              <div className="space-y-2 text-foreground-muted">
                <p><strong>Email:</strong> legal@eureka-connect.com</p>
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
