'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QrCode, 
  Download, 
  Copy, 
  Palette, 
  Settings, 
  ArrowLeft,
  Link as LinkIcon,
  Mail,
  Phone,
  Wifi,
  Text,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'
import QRCodeStyling from 'qr-code-styling'

interface QRConfig {
  type: 'text' | 'url' | 'email' | 'phone' | 'wifi'
  content: string
  size: number
  foregroundColor: string
  backgroundColor: string
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  margin: number
  logo?: string
}

const QR_TYPES = [
  { id: 'text', name: 'Texto', icon: Text, description: 'Texto libre' },
  { id: 'url', name: 'URL', icon: LinkIcon, description: 'Enlace web' },
  { id: 'email', name: 'Email', icon: Mail, description: 'Correo electrónico' },
  { id: 'phone', name: 'Teléfono', icon: Phone, description: 'Número de teléfono' },
  { id: 'wifi', name: 'WiFi', icon: Wifi, description: 'Red WiFi' }
]

const ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'Bajo (7%)', description: 'Para códigos simples' },
  { value: 'M', label: 'Medio (15%)', description: 'Recomendado' },
  { value: 'Q', label: 'Alto (25%)', description: 'Para códigos complejos' },
  { value: 'H', label: 'Máximo (30%)', description: 'Máxima corrección' }
]

const PRESET_COLORS = [
  { name: 'Clásico', foreground: '#000000', background: '#FFFFFF' },
  { name: 'Azul', foreground: '#1e40af', background: '#f8fafc' },
  { name: 'Verde', foreground: '#059669', background: '#f0fdf4' },
  { name: 'Rojo', foreground: '#dc2626', background: '#fef2f2' },
  { name: 'Púrpura', foreground: '#7c3aed', background: '#faf5ff' },
  { name: 'Naranja', foreground: '#ea580c', background: '#fff7ed' }
]

export default function CreadorQRPage() {
  const [config, setConfig] = useState<QRConfig>({
    type: 'text',
    content: '',
    size: 256,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    errorCorrectionLevel: 'M',
    margin: 4
  })
  
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'pdf'>('png')
  const qrRef = useRef<HTMLDivElement>(null)

  // Generar QR Code
  const generateQR = async () => {
    if (!config.content.trim()) return

    setIsGenerating(true)
    try {
      const qr = new QRCodeStyling({
        width: config.size,
        height: config.size,
        type: 'svg',
        data: getQRData(),
        image: config.logo,
        dotsOptions: {
          color: config.foregroundColor,
          type: 'rounded'
        },
        backgroundOptions: {
          color: config.backgroundColor
        },
        cornersSquareOptions: {
          color: config.foregroundColor,
          type: 'extra-rounded'
        },
        cornersDotOptions: {
          color: config.foregroundColor,
          type: 'dot'
        },
        margin: config.margin
      })

      setQrCode(qr)
      
      if (qrRef.current) {
        qrRef.current.innerHTML = ''
        qr.append(qrRef.current)
      }
    } catch (error) {
      console.error('Error generando QR:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Obtener datos formateados según el tipo
  const getQRData = (): string => {
    switch (config.type) {
      case 'url':
        return config.content.startsWith('http') ? config.content : `https://${config.content}`
      case 'email':
        return `mailto:${config.content}`
      case 'phone':
        return `tel:${config.content}`
      case 'wifi':
        return `WIFI:T:WPA;S:${config.content};P:password;H:false;;`
      default:
        return config.content
    }
  }

  // Generar QR al cambiar configuración
  useEffect(() => {
    if (config.content.trim()) {
      const timeoutId = setTimeout(() => {
        generateQR()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [config])

  // Descargar QR
  const downloadQR = async () => {
    if (!qrCode) return

    try {
      const dataUrl = await qrCode.getRawData(downloadFormat)
      const link = document.createElement('a')
      link.download = `qr-code.${downloadFormat}`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error descargando QR:', error)
    }
  }

  // Copiar al portapapeles
  const copyToClipboard = async () => {
    if (!config.content) return
    
    try {
      await navigator.clipboard.writeText(config.content)
      // Aquí podrías mostrar un toast de confirmación
    } catch (error) {
      console.error('Error copiando al portapapeles:', error)
    }
  }

  // Aplicar preset de colores
  const applyColorPreset = (preset: typeof PRESET_COLORS[0]) => {
    setConfig(prev => ({
      ...prev,
      foregroundColor: preset.foreground,
      backgroundColor: preset.background
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-primary/5 to-accent/5 py-8 sm:py-12 border-b border-border"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <Link href="/student-dashboard/herramientas" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Herramientas
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Creador de QR</h1>
          <p className="text-lg text-muted-foreground">
            Genera códigos QR personalizados para texto, URLs, emails y más.
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="container mx-auto px-4 py-8 max-w-6xl"
      >
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuración */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración
                </CardTitle>
                <CardDescription>
                  Personaliza tu código QR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tipo de QR */}
                <div>
                  <Label className="text-base font-medium">Tipo de contenido</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {QR_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <Button
                          key={type.id}
                          variant={config.type === type.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setConfig(prev => ({ ...prev, type: type.id as any }))}
                          className="flex flex-col items-center gap-1 h-auto py-3"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{type.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Contenido */}
                <div>
                  <Label htmlFor="content" className="text-base font-medium">
                    {QR_TYPES.find(t => t.id === config.type)?.description}
                  </Label>
                  <Input
                    id="content"
                    value={config.content}
                    onChange={(e) => setConfig(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={`Ingresa ${QR_TYPES.find(t => t.id === config.type)?.name.toLowerCase()}...`}
                    className="mt-2"
                  />
                </div>

                {/* Tamaño */}
                <div>
                  <Label className="text-base font-medium">
                    Tamaño: {config.size}px
                  </Label>
                  <Slider
                    value={[config.size]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, size: value }))}
                    min={128}
                    max={512}
                    step={32}
                    className="mt-2"
                  />
                </div>

                {/* Nivel de corrección de errores */}
                <div>
                  <Label className="text-base font-medium">Corrección de errores</Label>
                  <Select
                    value={config.errorCorrectionLevel}
                    onValueChange={(value: any) => setConfig(prev => ({ ...prev, errorCorrectionLevel: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ERROR_CORRECTION_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-sm text-muted-foreground">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Colores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Colores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Presets de colores */}
                <div>
                  <Label className="text-sm font-medium">Plantillas de color</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {PRESET_COLORS.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applyColorPreset(preset)}
                        className="flex items-center gap-2 h-auto py-2"
                      >
                        <div className="flex gap-1">
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: preset.foreground }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: preset.background }}
                          />
                        </div>
                        <span className="text-xs">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Colores personalizados */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="foreground" className="text-sm font-medium">Color principal</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="foreground"
                        type="color"
                        value={config.foregroundColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, foregroundColor: e.target.value }))}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={config.foregroundColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, foregroundColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="background" className="text-sm font-medium">Color de fondo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="background"
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={config.backgroundColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista previa y descarga */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Vista previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  {/* QR Code */}
                  <div className="bg-muted/30 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                    {isGenerating ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generando...
                      </div>
                    ) : config.content ? (
                      <div ref={qrRef} className="max-w-full max-h-full" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                        <p>Ingresa contenido para generar el QR</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {config.content && (
                    <div className="flex flex-wrap gap-2 w-full">
                      <Button onClick={copyToClipboard} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar texto
                      </Button>
                      
                      <Select value={downloadFormat} onValueChange={(value: any) => setDownloadFormat(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="svg">SVG</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button onClick={downloadQR} disabled={!qrCode}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
