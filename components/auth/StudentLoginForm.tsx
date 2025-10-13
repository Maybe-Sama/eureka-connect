'use client'

import React, { useState } from 'react'
import { authenticateStudent } from '@/lib/auth-client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Key, LogIn, ArrowRight, User, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'

export default function StudentLoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authenticateStudent(identifier, password)

      if (result.success && result.user && result.token) {
        login(result.user, result.token)
        router.push('/student-dashboard')
      } else {
        setError(result.error || 'Error de autenticación')
      }
    } catch (err) {
      setError('Error interno del servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 -left-4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Efectos de luz adicionales */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-primary/30 rounded-full filter blur-2xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-accent/30 rounded-full filter blur-2xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary/40 rounded-full filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Más efectos de luz */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-1/6 right-1/3 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-accent/25 rounded-full filter blur-xl animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/6 left-1/3 w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 bg-primary/25 rounded-full filter blur-2xl animate-pulse animation-delay-3000"></div>
        <div className="absolute top-2/3 left-1/6 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-accent/35 rounded-full filter blur-lg animate-pulse animation-delay-5000"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15"></div>
      
      {/* Gradiente de luz más intenso */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      
      {/* Luz central adicional */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.05) 0%, transparent 70%)'
      }}></div>
      
      {/* Card principal con glassmorphism */}
      <div className="max-w-md w-full relative z-10">
        <div className="glass-effect rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 lg:p-10">
          {/* Botón de regreso */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/login')}
              className="group inline-flex items-center text-foreground-muted hover:text-foreground transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Volver a la selección</span>
            </button>
          </div>

          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-accent to-primary rounded-2xl shadow-lg mb-4 sm:mb-6 relative">
              <User className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Acceso Estudiante
            </h1>
            <p className="text-sm sm:text-base text-foreground-muted">
              Inicia sesión con tu código de estudiante
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="identifier" className="block text-sm font-semibold text-foreground flex items-center space-x-2">
                <User className="w-4 h-4 text-accent" />
                <span>Código de Estudiante o Email</span>
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full px-4 py-4 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-foreground transition-all duration-200 hover:border-accent/50 placeholder-foreground-muted"
                  placeholder="9999-9999-9999-9999 o tu@email.com"
                />
              </div>
              <p className="text-xs text-foreground-muted">
                Puedes usar tu código de estudiante o tu dirección de email
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-foreground flex items-center space-x-2">
                <Lock className="w-4 h-4 text-accent" />
                <span>Contraseña</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-4 pr-12 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-foreground transition-all duration-200 hover:border-accent/50 placeholder-foreground-muted"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm flex items-center space-x-2 animate-shake">
                <svg className="w-5 h-5 text-destructive flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative inline-flex items-center justify-center px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-accent via-primary to-accent rounded-xl shadow-lg hover:shadow-xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-accent-hover via-primary-hover to-accent-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <DiagonalBoxLoader size="sm" color="white" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    
                    <span>Iniciar Sesión</span>
                    <LogIn className="w-5 h-5" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Link de registro */}
          <div className="mt-8 text-center">
            <p className="text-sm text-foreground-muted">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary hover:from-accent-hover hover:to-primary-hover transition-all duration-200"
              >
                Regístrate aquí →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
