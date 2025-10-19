// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// Configurar la ruta como dinámica para evitar errores de SSG
export const dynamic = 'force-dynamic'

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

// Función para normalizar URLs
function normalizeUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl)
      return `${base.protocol}//${base.host}${url}`
    }
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

// Función para extraer nombre de archivo de URL
function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || 'document.pdf'
    
    // Si no tiene extensión .pdf, agregarla
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return `${filename}.pdf`
    }
    
    return filename
  } catch {
    return 'document.pdf'
  }
}

// Función para obtener el tamaño del archivo
async function getFileSize(url: string): Promise<number | undefined> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    const contentLength = response.headers.get('content-length')
    return contentLength ? parseInt(contentLength) : undefined
  } catch {
    return undefined
  }
}

// Función mejorada para extraer PDFs del HTML
function extractPdfsFromHtml(html: string, baseUrl: string): PDFInfo[] {
  const pdfs: PDFInfo[] = []
  
  console.log('HTML length:', html.length)
  console.log('Base URL:', baseUrl)
  
  // Regex multilinea para encontrar enlaces a PDFs (incluyendo saltos de línea)
  const linkRegex = /<a[^>]*href=["']([^"']*\.pdf[^"']*)["'][^>]*>[\s\S]*?<\/a>/gi
  let match
  
  while ((match = linkRegex.exec(html)) !== null) {
    const fullMatch = match[0]
    const href = match[1]
    
    console.log('Found link match:', fullMatch.substring(0, 200) + '...')
    console.log('Extracted href:', href)
    
    if (href && href.toLowerCase().includes('.pdf')) {
      const fullUrl = normalizeUrl(href, baseUrl)
      const filename = extractFilename(fullUrl)
      
      // Extraer el texto del enlace (puede estar en múltiples líneas)
      const titleMatch = fullMatch.match(/>([^<]+)</)
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : filename
      
      pdfs.push({
        url: fullUrl,
        filename,
        title: title || filename
      })
    }
  }
  
  // Regex simple para enlaces de una línea
  const simpleLinkRegex = /<a[^>]+href=["']([^"']*\.pdf)["'][^>]*>([^<]*)<\/a>/gi
  
  while ((match = simpleLinkRegex.exec(html)) !== null) {
    const href = match[1]
    const title = match[2].trim()
    
    console.log('Found simple link:', href, 'Title:', title)
    
    const fullUrl = normalizeUrl(href, baseUrl)
    const filename = extractFilename(fullUrl)
    
    pdfs.push({
      url: fullUrl,
      filename,
      title: title || filename
    })
  }
  
  // Buscar enlaces que contengan "pdf" en el texto o href (multilinea)
  const generalRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>[\s\S]*?pdf[\s\S]*?<\/a>/gi
  
  while ((match = generalRegex.exec(html)) !== null) {
    const fullMatch = match[0]
    const href = match[1]
    
    console.log('Found general match:', fullMatch.substring(0, 200) + '...')
    
    if (href && href.toLowerCase().includes('.pdf')) {
      const fullUrl = normalizeUrl(href, baseUrl)
      const filename = extractFilename(fullUrl)
      
      const titleMatch = fullMatch.match(/>([^<]+)</)
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : filename
      
      pdfs.push({
        url: fullUrl,
        filename,
        title: title || filename
      })
    }
  }
  
  // Buscar enlaces que terminen en .pdf sin importar el contenido (multilinea)
  const pdfEndRegex = /<a[^>]*href=["']([^"']*\.pdf)["'][^>]*>[\s\S]*?<\/a>/gi
  
  while ((match = pdfEndRegex.exec(html)) !== null) {
    const fullMatch = match[0]
    const href = match[1]
    
    console.log('Found PDF end match:', fullMatch.substring(0, 200) + '...')
    
    const fullUrl = normalizeUrl(href, baseUrl)
    const filename = extractFilename(fullUrl)
    
    const titleMatch = fullMatch.match(/>([^<]+)</)
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : filename
    
    pdfs.push({
      url: fullUrl,
      filename,
      title: title || filename
    })
  }
  
  // Eliminar duplicados basados en URL
  const uniquePdfs = pdfs.filter((pdf, index, self) => 
    index === self.findIndex(p => p.url === pdf.url)
  )
  
  console.log('Total PDFs found:', uniquePdfs.length)
  
  return uniquePdfs
}

// POST - Buscar PDFs en una URL
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL es requerida' },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL no válida' },
        { status: 400 }
      )
    }

    console.log(`Buscando PDFs en: ${url}`)

    // Hacer scraping de la página usando fetch nativo
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const html = await response.text()
    const baseUrl = new URL(url).origin

    // Extraer PDFs usando regex
    const pdfs = extractPdfsFromHtml(html, url)

    // Eliminar duplicados
    const uniquePdfs = pdfs.filter((pdf, index, self) => 
      index === self.findIndex(p => p.url === pdf.url)
    )

    // Obtener tamaños de archivos (paralelo, limitado)
    const pdfsWithSize = await Promise.all(
      uniquePdfs.slice(0, 20).map(async (pdf) => {
        const size = await getFileSize(pdf.url)
        return { ...pdf, size }
      })
    )

    const result: ScrapingResult = {
      pdfs: pdfsWithSize,
      totalFound: uniquePdfs.length,
      baseUrl,
      scrapedAt: new Date().toISOString()
    }

    console.log(`Encontrados ${uniquePdfs.length} PDFs en ${url}`)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error en extractor PDF:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error procesando la URL',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// GET - Descargar PDFs seleccionados como ZIP
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pdfsData = searchParams.get('pdfs')
    const action = searchParams.get('action') // 'download' o 'proxy'
    
    if (!pdfsData) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron PDFs para descargar' },
        { status: 400 }
      )
    }

    const pdfs: PDFInfo[] = JSON.parse(decodeURIComponent(pdfsData))
    
    if (pdfs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay PDFs seleccionados' },
        { status: 400 }
      )
    }

    // Si es una solicitud de proxy para un PDF específico
    if (action === 'proxy') {
      const pdfUrl = searchParams.get('url')
      if (!pdfUrl) {
        return NextResponse.json(
          { success: false, error: 'URL de PDF no proporcionada' },
          { status: 400 }
        )
      }

      try {
        const response = await fetch(pdfUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const pdfBuffer = await response.arrayBuffer()
        const filename = pdfs.find(p => p.url === pdfUrl)?.filename || 'document.pdf'

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.byteLength.toString()
          }
        })
      } catch (error) {
        console.error('Error descargando PDF:', error)
        return NextResponse.json(
          { success: false, error: 'Error descargando PDF' },
          { status: 500 }
        )
      }
    }

    // Por ahora, devolver solo la lista de PDFs para descarga individual
    // TODO: Implementar ZIP cuando se resuelvan los problemas de compatibilidad
    const downloadLinks = pdfs.map(pdf => ({
      url: pdf.url,
      filename: pdf.filename,
      title: pdf.title
    }))

    return NextResponse.json({
      success: true,
      message: 'Descarga individual habilitada. ZIP temporalmente deshabilitado.',
      data: {
        pdfs: downloadLinks,
        downloadType: 'individual'
      }
    })

  } catch (error) {
    console.error('Error descargando PDFs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error procesando PDFs',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
