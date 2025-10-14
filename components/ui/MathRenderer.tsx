'use client'

import { useEffect, useState } from 'react'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  expression: string
  displayMode?: boolean
  className?: string
}

export default function MathRenderer({ expression, displayMode = false, className = '' }: MathRendererProps) {
  const [rendered, setRendered] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const renderMath = async () => {
      try {
        const katex = await import('katex')
        
        // Convert common mathematical expressions to LaTeX
        let latexExpression = expression
          .replace(/\^/g, '^') // Keep powers as is
          .replace(/\*\*/g, '^') // Convert ** to ^
          .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}') // Convert sqrt(x) to \sqrt{x}
          .replace(/cbrt\(([^)]+)\)/g, '\\sqrt[3]{$1}') // Convert cbrt(x) to \sqrt[3]{x}
          .replace(/log\(([^)]+)\)/g, '\\ln($1)') // Convert log(x) to \ln(x)
          .replace(/log2\(([^)]+)\)/g, '\\log_2($1)') // Convert log2(x) to \log_2(x)
          .replace(/exp\(([^)]+)\)/g, 'e^{$1}') // Convert exp(x) to e^{x}
          .replace(/sin\(([^)]+)\)/g, '\\sin($1)') // Convert sin(x) to \sin(x)
          .replace(/cos\(([^)]+)\)/g, '\\cos($1)') // Convert cos(x) to \cos(x)
          .replace(/tan\(([^)]+)\)/g, '\\tan($1)') // Convert tan(x) to \tan(x)
          .replace(/asin\(([^)]+)\)/g, '\\arcsin($1)') // Convert asin(x) to \arcsin(x)
          .replace(/acos\(([^)]+)\)/g, '\\arccos($1)') // Convert acos(x) to \arccos(x)
          .replace(/atan\(([^)]+)\)/g, '\\arctan($1)') // Convert atan(x) to \arctan(x)
          .replace(/abs\(([^)]+)\)/g, '|$1|') // Convert abs(x) to |x|
          .replace(/pi/g, '\\pi') // Convert pi to \pi
          .replace(/e\^/g, 'e^') // Keep e^ as is
          .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}') // Convert fractions to \frac{num}{den}
          .replace(/([a-zA-Z]+)\/([a-zA-Z]+)/g, '\\frac{$1}{$2}') // Convert variable fractions
          .replace(/([a-zA-Z]+)\/(\d+)/g, '\\frac{$1}{$2}') // Convert variable/num fractions
          .replace(/(\d+)\/([a-zA-Z]+)/g, '\\frac{$1}{$2}') // Convert num/variable fractions
          .replace(/\*/g, '') // Remove explicit multiplication signs
          .replace(/Math\./g, '') // Remove Math. prefix
          .replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, '{$1}^{$2}') // Convert Math.pow to LaTeX
          .replace(/Math\.sqrt\(([^)]+)\)/g, '\\sqrt{$1}') // Convert Math.sqrt to LaTeX
          .replace(/Math\.log\(([^)]+)\)/g, '\\ln($1)') // Convert Math.log to LaTeX
          .replace(/Math\.exp\(([^)]+)\)/g, 'e^{$1}') // Convert Math.exp to LaTeX
          .replace(/Math\.sin\(([^)]+)\)/g, '\\sin($1)') // Convert Math.sin to LaTeX
          .replace(/Math\.cos\(([^)]+)\)/g, '\\cos($1)') // Convert Math.cos to LaTeX
          .replace(/Math\.tan\(([^)]+)\)/g, '\\tan($1)') // Convert Math.tan to LaTeX
          .replace(/Math\.PI/g, '\\pi') // Convert Math.PI to LaTeX
          .replace(/Math\.E/g, 'e') // Convert Math.E to LaTeX

        const html = katex.renderToString(latexExpression, {
          displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
          trust: true
        })
        
        setRendered(html)
        setError(null)
      } catch (err) {
        console.error('Error rendering math:', err)
        setError('Error rendering mathematical expression')
        setRendered(expression) // Fallback to original expression
      }
    }

    renderMath()
  }, [expression, displayMode])

  if (error) {
    return (
      <span className={`text-red-500 ${className}`} title={error}>
        {expression}
      </span>
    )
  }

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}
