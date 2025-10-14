'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Search, 
  ArrowLeft,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Filter,
  CheckSquare,
  Square,
  ExternalLink,
  Calendar,
  HardDrive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface PDFInfo {
  url: string
  filename: string
  size?: number
  title?: string
  description?: string
}

interface ScrapingResult {
  pdfs: PDFInfo[]
  totalFound: number
  baseUrl: string
  scrapedAt: string
}

export default function ExtractorPDFPage() {
  const [url, setUrl] = useState('')
  const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPdfs, setSelectedPdfs] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState('')

  // Buscar PDFs en la URL
  const searchPDFs = async () => {
    if (!url.trim()) {
      setError('Por favor ingresa una URL válida')
      return
    }

    setIsScraping(true)
    setError(null)
    setScrapingResult(null)
    setSelectedPdfs(new Set())

    try {
      const response = await fetch('/api/extractor-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error buscando PDFs')
      }

      setScrapingResult(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error buscando PDFs')
    } finally {
      setIsScraping(false)
    }
  }

  // Descargar PDFs seleccionados individualmente usando proxy del servidor
  const downloadSelectedPDFs = async () => {
    if (!scrapingResult || selectedPdfs.size === 0) return

    setIsDownloading(true)

    try {
      const selectedPdfData = scrapingResult.pdfs.filter(pdf => selectedPdfs.has(pdf.url))
      
      // Descargar cada PDF usando el proxy del servidor
      for (const pdf of selectedPdfData) {
        try {
          const pdfsData = encodeURIComponent(JSON.stringify(scrapingResult.pdfs))
          const proxyUrl = `/api/extractor-pdf?pdfs=${pdfsData}&action=proxy&url=${encodeURIComponent(pdf.url)}`
          
          const response = await fetch(proxyUrl)
          if (!response.ok) {
            console.warn(`Error HTTP ${response.status} para ${pdf.filename}`)
            continue
          }
          
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = pdf.filename
          link.click()
          
          window.URL.revokeObjectURL(downloadUrl)
          
          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (err) {
          console.warn(`Error descargando ${pdf.filename}:`, err)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error descargando PDFs')
    } finally {
      setIsDownloading(false)
    }
  }

  // Seleccionar/deseleccionar PDF
  const togglePdfSelection = (pdfUrl: string) => {
    const newSelection = new Set(selectedPdfs)
    if (newSelection.has(pdfUrl)) {
      newSelection.delete(pdfUrl)
    } else {
      newSelection.add(pdfUrl)
    }
    setSelectedPdfs(newSelection)
  }

  // Seleccionar todos los PDFs
  const selectAllPDFs = () => {
    if (!scrapingResult) return
    setSelectedPdfs(new Set(scrapingResult.pdfs.map(pdf => pdf.url)))
  }

  // Deseleccionar todos los PDFs
  const deselectAllPDFs = () => {
    setSelectedPdfs(new Set())
  }

  // Filtrar PDFs
  const filteredPdfs = scrapingResult?.pdfs.filter(pdf => 
    filterText === '' || 
    pdf.filename.toLowerCase().includes(filterText.toLowerCase()) ||
    pdf.title?.toLowerCase().includes(filterText.toLowerCase()) ||
    pdf.url.toLowerCase().includes(filterText.toLowerCase())
  ) || []

  // Formatear tamaño de archivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Tamaño desconocido'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Extractor de PDF</h1>
          <p className="text-lg text-muted-foreground">
            Descarga masiva de PDFs desde cualquier página web. Encuentra y descarga todos los PDFs de una URL.
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
        <div className="space-y-6">
          {/* URL Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Buscar PDFs en una URL
              </CardTitle>
              <CardDescription>
                Ingresa la URL de la página web donde quieres buscar PDFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url" className="text-base font-medium">
                    URL de la página web
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://ejemplo.com/documentos"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={searchPDFs} 
                      disabled={!url.trim() || isScraping}
                    >
                      {isScraping ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Buscar PDFs
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    La herramienta buscará enlaces directos a archivos PDF en la página
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {scrapingResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      PDFs Encontrados
                    </CardTitle>
                    <CardDescription>
                      {scrapingResult.totalFound} PDFs encontrados en {scrapingResult.baseUrl}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(scrapingResult.scrapedAt).toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Filtrar PDFs..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-64"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllPDFs}
                      >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Seleccionar Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAllPDFs}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Deseleccionar
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {selectedPdfs.size} seleccionados
                      </Badge>
                      <Button 
                        onClick={downloadSelectedPDFs}
                        disabled={selectedPdfs.size === 0 || isDownloading}
                        size="sm"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar PDFs ({selectedPdfs.size})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* PDFs List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredPdfs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron PDFs que coincidan con el filtro</p>
                      </div>
                    ) : (
                      filteredPdfs.map((pdf, index) => (
                        <motion.div
                          key={pdf.url}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedPdfs.has(pdf.url) 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => togglePdfSelection(pdf.url)}
                        >
                          <div className="flex-shrink-0">
                            {selectedPdfs.has(pdf.url) ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          <File className="w-8 h-8 text-red-500 flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">
                              {pdf.title || pdf.filename}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {pdf.filename}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <HardDrive className="w-3 h-3 mr-1" />
                                {formatFileSize(pdf.size)}
                              </Badge>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(pdf.url, '_blank')
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Ingresa la URL</h3>
                  <p className="text-sm text-muted-foreground">
                    Proporciona la URL de la página web donde quieres buscar PDFs
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Busca y selecciona</h3>
                  <p className="text-sm text-muted-foreground">
                    La herramienta encuentra todos los PDFs y tú seleccionas cuáles descargar
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Descarga masiva</h3>
                  <p className="text-sm text-muted-foreground">
                    Descarga todos los PDFs seleccionados individualmente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}