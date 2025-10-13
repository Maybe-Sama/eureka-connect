'use client'

import { useEffect, useRef, useState } from 'react'

interface SimpleGraphProps {
  functions: Array<{
    fn: string
    color?: string
  }>
  xDomain: [number, number]
  yDomain: [number, number]
  height?: number
  className?: string
}

export default function SimpleGraph({ 
  functions, 
  xDomain, 
  yDomain, 
  height = 400,
  className = '' 
}: SimpleGraphProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [svgContent, setSvgContent] = useState<string>('')

  // Function evaluator
  const evaluateFunction = (fn: string, x: number): number => {
    try {
      let jsFn = fn
        .replace(/\^/g, '**')
        .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/cbrt\(([^)]+)\)/g, 'Math.cbrt($1)')
        .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
        .replace(/log2\(([^)]+)\)/g, 'Math.log2($1)')
        .replace(/exp\(([^)]+)\)/g, 'Math.exp($1)')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
        .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)')
        .replace(/asin\(([^)]+)\)/g, 'Math.asin($1)')
        .replace(/acos\(([^)]+)\)/g, 'Math.acos($1)')
        .replace(/atan\(([^)]+)\)/g, 'Math.atan($1)')
        .replace(/abs\(([^)]+)\)/g, 'Math.abs($1)')
        .replace(/pi/g, 'Math.PI')
        .replace(/e\^/g, 'Math.exp(')
        .replace(/e\*\*/g, 'Math.exp(')

      return new Function('x', 'Math', `return ${jsFn}`)(x, Math)
    } catch (err) {
      return NaN
    }
  }

  useEffect(() => {
    const generateSVG = () => {
      try {
        setIsLoading(true)
        setError(null)

        const width = 600
        const padding = 40
        const plotWidth = width - 2 * padding
        const plotHeight = height - 2 * padding

        // Calculate scale factors
        const xScale = plotWidth / (xDomain[1] - xDomain[0])
        const yScale = plotHeight / (yDomain[1] - yDomain[0])

        // Helper functions
        const xToPixel = (x: number) => padding + (x - xDomain[0]) * xScale
        const yToPixel = (y: number) => height - padding - (y - yDomain[0]) * yScale

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" class="bg-white border rounded-lg">`

        // Draw grid
        svg += `<defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        </pattern></defs>`
        svg += `<rect width="100%" height="100%" fill="url(#grid)"/>`

        // Draw axes
        if (yDomain[0] <= 0 && yDomain[1] >= 0) {
          const y = yToPixel(0)
          svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#374151" stroke-width="2"/>`
        }
        
        if (xDomain[0] <= 0 && xDomain[1] >= 0) {
          const x = xToPixel(0)
          svg += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="#374151" stroke-width="2"/>`
        }

        // Draw functions
        const validFunctions = functions.filter(f => f.fn && f.fn.trim() !== '')
        
        validFunctions.forEach((func, index) => {
          try {
            const color = func.color || `hsl(${index * 60}, 70%, 50%)`
            let pathData = ''
            let firstPoint = true
            const step = (xDomain[1] - xDomain[0]) / (plotWidth * 2)

            for (let x = xDomain[0]; x <= xDomain[1]; x += step) {
              const y = evaluateFunction(func.fn, x)
              
              if (!isNaN(y) && isFinite(y) && y >= yDomain[0] && y <= yDomain[1]) {
                const pixelX = xToPixel(x)
                const pixelY = yToPixel(y)
                
                if (firstPoint) {
                  pathData += `M ${pixelX} ${pixelY}`
                  firstPoint = false
                } else {
                  pathData += ` L ${pixelX} ${pixelY}`
                }
              } else {
                firstPoint = true
              }
            }

            if (pathData) {
              svg += `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="3"/>`
            }
          } catch (err) {
            console.error('Error drawing function:', func.fn, err)
          }
        })

        svg += '</svg>'
        setSvgContent(svg)
        setIsLoading(false)
      } catch (err) {
        console.error('Error generating SVG:', err)
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setIsLoading(false)
      }
    }

    generateSVG()
  }, [functions, xDomain, yDomain, height])

  if (error) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-center text-red-600">
          <p className="font-semibold">Error al graficar</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] bg-muted/20 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Cargando gráfico...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`rounded-lg bg-white border ${className}`}
      style={{ height: `${height}px` }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
