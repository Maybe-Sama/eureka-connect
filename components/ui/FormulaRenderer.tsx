'use client'

import React from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

interface FormulaRendererProps {
  formula: string
  display?: 'inline' | 'block'
  className?: string
}

// Función para convertir notación matemática común a LaTeX
const convertToLatex = (formula: string): string => {
  let latex = formula

  // 1. PRIMERO: Si ya es LaTeX válido, no hacer conversiones
  if (latex.includes('\\frac') || latex.includes('\\cdot') || latex.includes('\\sqrt') || latex.includes('\\sin') || latex.includes('\\cos')) {
    // Solo limpiar errores conocidos
    latex = latex.replace(/\\cdott/g, '\\cdot t')
    latex = latex.replace(/\\cdota/g, '\\cdot a')
    return latex.trim()
  }

  // 2. Convertir símbolos griegos (debe ir antes de otras conversiones)
  const greekSymbols = {
    'alpha': '\\alpha', 'beta': '\\beta', 'gamma': '\\gamma', 'delta': '\\delta',
    'epsilon': '\\epsilon', 'zeta': '\\zeta', 'eta': '\\eta', 'theta': '\\theta',
    'iota': '\\iota', 'kappa': '\\kappa', 'lambda': '\\lambda', 'mu': '\\mu',
    'nu': '\\nu', 'xi': '\\xi', 'omicron': '\\omicron', 'pi': '\\pi',
    'rho': '\\rho', 'sigma': '\\sigma', 'tau': '\\tau', 'upsilon': '\\upsilon',
    'phi': '\\phi', 'chi': '\\chi', 'psi': '\\psi', 'omega': '\\omega',
    'Gamma': '\\Gamma', 'Delta': '\\Delta', 'Theta': '\\Theta', 'Lambda': '\\Lambda',
    'Xi': '\\Xi', 'Pi': '\\Pi', 'Sigma': '\\Sigma', 'Upsilon': '\\Upsilon',
    'Phi': '\\Phi', 'Psi': '\\Psi', 'Omega': '\\Omega'
  }
  
  Object.entries(greekSymbols).forEach(([symbol, latexSymbol]) => {
    const regex = new RegExp(`\\b${symbol}\\b`, 'g')
    latex = latex.replace(regex, latexSymbol)
  })

  // 3. Convertir funciones trigonométricas y matemáticas
  const mathFunctions = {
    'sin': '\\sin', 'cos': '\\cos', 'tan': '\\tan', 'cot': '\\cot',
    'sec': '\\sec', 'csc': '\\csc', 'arcsin': '\\arcsin', 'arccos': '\\arccos',
    'arctan': '\\arctan', 'sinh': '\\sinh', 'cosh': '\\cosh', 'tanh': '\\tanh',
    'log': '\\log', 'ln': '\\ln', 'exp': '\\exp', 'sqrt': '\\sqrt',
    'sum': '\\sum', 'int': '\\int', 'lim': '\\lim', 'max': '\\max',
    'min': '\\min', 'inf': '\\inf', 'sup': '\\sup'
  }
  
  Object.entries(mathFunctions).forEach(([func, latexFunc]) => {
    const regex = new RegExp(`\\b${func}(?=\\()`, 'g')
    latex = latex.replace(regex, latexFunc)
  })

  // 4. Convertir raíces n-ésimas: sqrt(n){a} -> \sqrt[n]{a}
  latex = latex.replace(/sqrt\((\d+)\)\{([^}]+)\}/g, '\\sqrt[$1]{$2}')
  
  // 5. Convertir raíces cuadradas: sqrt(x) -> \sqrt{x}
  latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')

  // 6. Convertir fracciones con paréntesis: (1/2) -> \frac{1}{2}
  latex = latex.replace(/\((\d+)\/(\d+)\)/g, '\\frac{$1}{$2}')
  
  // 7. Convertir fracciones con variables: (a/b) -> \frac{a}{b}
  latex = latex.replace(/\(([a-zA-Z0-9\s\^_]+)\/([a-zA-Z0-9\s\^_]+)\)/g, '\\frac{$1}{$2}')
  
  // 8. Convertir fracciones simples: a/b -> \frac{a}{b} (solo si no contiene comandos LaTeX)
  latex = latex.replace(/([a-zA-Z0-9\s\(\)\^_]+)\/([a-zA-Z0-9\s\(\)\^_]+)/g, (match, num, den) => {
    if (match.includes('\\')) return match
    return `\\frac{${num.trim()}}{${den.trim()}}`
  })

  // 9. Convertir exponentes: x^2 -> x^{2}, x^y -> x^{y}
  latex = latex.replace(/\^(\d+)/g, '^{$1}')
  latex = latex.replace(/\^([a-zA-Z]+)/g, '^{$1}')
  
  // 10. Convertir superíndices especiales: ² -> ^2, ³ -> ^3, etc.
  latex = latex.replace(/²/g, '^2')
  latex = latex.replace(/³/g, '^3')
  latex = latex.replace(/¹/g, '^1')
  latex = latex.replace(/⁴/g, '^4')
  latex = latex.replace(/⁵/g, '^5')
  latex = latex.replace(/⁶/g, '^6')
  latex = latex.replace(/⁷/g, '^7')
  latex = latex.replace(/⁸/g, '^8')
  latex = latex.replace(/⁹/g, '^9')
  latex = latex.replace(/⁰/g, '^0')
  
  // 11. Convertir subíndices: x_2 -> x_{2}, x_i -> x_{i}
  latex = latex.replace(/_(\d+)/g, '_{$1}')
  latex = latex.replace(/_([a-zA-Z]+)/g, '_{$1}')
  
  // 12. Convertir subíndices especiales: ₀ -> _0, ₁ -> _1, etc.
  latex = latex.replace(/₀/g, '_0')
  latex = latex.replace(/₁/g, '_1')
  latex = latex.replace(/₂/g, '_2')
  latex = latex.replace(/₃/g, '_3')
  latex = latex.replace(/₄/g, '_4')
  latex = latex.replace(/₅/g, '_5')
  latex = latex.replace(/₆/g, '_6')
  latex = latex.replace(/₇/g, '_7')
  latex = latex.replace(/₈/g, '_8')
  latex = latex.replace(/₉/g, '_9')

  // 13. Convertir multiplicación: · -> \cdot
  latex = latex.replace(/·/g, '\\cdot')
  latex = latex.replace(/\*/g, '\\cdot')

  // 14. Convertir símbolos especiales
  latex = latex.replace(/∞/g, '\\infty')
  latex = latex.replace(/±/g, '\\pm')
  latex = latex.replace(/∓/g, '\\mp')
  latex = latex.replace(/×/g, '\\times')
  latex = latex.replace(/÷/g, '\\div')
  latex = latex.replace(/≤/g, '\\leq')
  latex = latex.replace(/≥/g, '\\geq')
  latex = latex.replace(/≠/g, '\\neq')
  latex = latex.replace(/≈/g, '\\approx')
  latex = latex.replace(/≡/g, '\\equiv')
  latex = latex.replace(/∝/g, '\\propto')
  latex = latex.replace(/→/g, '\\rightarrow')
  latex = latex.replace(/←/g, '\\leftarrow')
  latex = latex.replace(/↔/g, '\\leftrightarrow')
  latex = latex.replace(/⇒/g, '\\Rightarrow')
  latex = latex.replace(/⇐/g, '\\Leftarrow')
  latex = latex.replace(/⇔/g, '\\Leftrightarrow')
  latex = latex.replace(/∈/g, '\\in')
  latex = latex.replace(/∉/g, '\\notin')
  latex = latex.replace(/⊂/g, '\\subset')
  latex = latex.replace(/⊃/g, '\\supset')
  latex = latex.replace(/∪/g, '\\cup')
  latex = latex.replace(/∩/g, '\\cap')
  latex = latex.replace(/∅/g, '\\emptyset')
  latex = latex.replace(/∇/g, '\\nabla')
  latex = latex.replace(/∂/g, '\\partial')
  latex = latex.replace(/∫/g, '\\int')
  latex = latex.replace(/∑/g, '\\sum')
  latex = latex.replace(/∏/g, '\\prod')
  latex = latex.replace(/√/g, '\\sqrt')

  // 15. Limpiar espacios extra
  latex = latex.replace(/\s+/g, ' ')

  return latex.trim()
}

export function FormulaRenderer({ formula, display = 'inline', className = '' }: FormulaRendererProps) {
  const latexFormula = convertToLatex(formula)
  
  try {
    if (display === 'block') {
      return (
        <div className={`formula-block ${className}`}>
          <BlockMath math={latexFormula} />
        </div>
      )
    } else {
      return (
        <span className={`formula-inline ${className}`}>
          <InlineMath math={latexFormula} />
        </span>
      )
    }
  } catch (error) {
    // Si hay un error en el renderizado de LaTeX, mostrar la fórmula original
    console.warn('Error rendering LaTeX formula:', error)
    return (
      <span className={`formula-fallback ${className}`}>
        {formula}
      </span>
    )
  }
}

// Componente específico para fórmulas en tarjetas
export function FormulaCard({ formula, className = '' }: { formula: string; className?: string }) {
  return (
    <div className={`bg-muted/30 rounded-lg p-4 text-center break-words ${className}`}>
      <FormulaRenderer formula={formula} display="block" />
    </div>
  )
}
