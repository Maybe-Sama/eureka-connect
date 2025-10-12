'use client'

import React, { useState, useEffect } from 'react'
import { verifyStudentCode, registerStudent, authenticateStudent } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserPlus, Check, X, Key, Lock, ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'

export default function RegisterForm() {
  const [step, setStep] = useState<'code' | 'password'>('code')
  const [studentCode, setStudentCode] = useState('')
  const [studentName, setStudentName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeValid, setCodeValid] = useState<boolean | null>(null)

  const router = useRouter()
  const { login } = useAuth()

  // Validación en tiempo real del código
  useEffect(() => {
    if (studentCode.length < 10) {
      setCodeValid(null)
      return
    }

    const timer = setTimeout(async () => {
      setCodeValidating(true)
      try {
        const result = await verifyStudentCode(studentCode)
        setCodeValid(result.success)
        if (result.success) {
          setStudentName(result.studentName || '')
          setError('')
        } else {
          setError(result.error || 'Código inválido')
        }
      } catch (err) {
        setCodeValid(false)
        setError('Error al verificar el código')
      } finally {
        setCodeValidating(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [studentCode])

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (codeValid === true && studentName) {
      setStep('password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await verifyStudentCode(studentCode)

      if (result.success) {
        setStudentName(result.studentName || '')
        setCodeValid(true)
        setStep('password')
      } else {
        setCodeValid(false)
        setError(result.error || 'Error al verificar el código')
      }
    } catch (err) {
      setCodeValid(false)
      setError('Error interno del servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await registerStudent(studentCode, password, confirmPassword)

      if (result.success) {
        setSuccess(true)
        // Login automático tras registro exitoso
        setTimeout(async () => {
          try {
            const loginResult = await authenticateStudent(studentCode, password)
            if (loginResult.success && loginResult.user && loginResult.token) {
              // Usar el contexto de autenticación para hacer login
              await login(loginResult.user, loginResult.token)
              // Redirigir al dashboard del estudiante
              router.push('/student-dashboard')
            } else {
              // Si falla el login automático, ir a login manual
              router.push('/student-login')
            }
          } catch (loginError) {
            console.error('Error en login automático:', loginError)
            // Si falla el login automático, ir a login manual
            router.push('/student-login')
          }
        }, 2000)
      } else {
        setError(result.error || 'Error al registrarse')
      }
    } catch (err) {
      setError('Error interno del servidor')
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de éxito
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 relative overflow-hidden">
        {/* Confeti animado */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="absolute top-40 right-20 w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-32 w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
          <div className="absolute top-60 right-40 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <div className="max-w-md w-full relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 p-12 text-center animate-scale-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6 animate-bounce-slow">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              ¡Registro Exitoso!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Tu cuenta ha sido creada correctamente. Iniciando sesión automáticamente...
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirigiendo al dashboard...
            </p>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800 font-medium">
                Redirigiendo al dashboard en 2 segundos...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de registro
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4 relative overflow-hidden">
      {/* Efectos de fondo únicos para registro */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 -left-10 w-72 h-72 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 -right-10 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Card principal */}
      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10">
          {/* Header con progreso */}
          <div className="mb-10">
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 rounded-2xl shadow-lg relative">
                <UserPlus className="w-10 h-10 text-white" />
                <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
              Registro de Estudiante
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Crea tu cuenta de estudiante en solo 2 pasos
            </p>

            {/* Indicador de progreso */}
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                  step === 'code'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-110'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                }`}>
                  {step === 'password' ? <Check className="w-6 h-6" /> : '1'}
                </div>
                <span className={`ml-3 text-sm font-semibold ${
                  step === 'code' ? 'text-orange-600' : 'text-emerald-600'
                }`}>
                  Verificar Código
                </span>
              </div>
              
              <div className={`h-1 w-16 rounded-full transition-all duration-500 ${
                step === 'password' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gray-300'
              }`}></div>
              
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                  step === 'password'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`ml-3 text-sm font-semibold ${
                  step === 'password' ? 'text-orange-600' : 'text-gray-400'
                }`}>
                  Crear Contraseña
                </span>
              </div>
            </div>
          </div>

          {/* Paso 1: Verificación de código */}
          {step === 'code' && (
            <form onSubmit={handleCodeVerification} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="studentCode" className="block text-base font-bold text-gray-800 flex items-center space-x-2">
                  <Key className="w-5 h-5 text-orange-600" />
                  <span>Código de Estudiante</span>
                </label>
                <div className="relative">
                  <input
                    id="studentCode"
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => {
                      setStudentCode(e.target.value)
                      setError('')
                    }}
                    className={`block w-full px-5 py-5 text-lg text-gray-900 bg-gray-50 border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-200 font-mono ${
                      codeValid === true
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200 bg-emerald-50'
                        : codeValid === false
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50'
                        : 'border-gray-300 focus:border-orange-500 focus:ring-orange-200'
                    }`}
                    placeholder="9999-9999-9999-9999-9999"
                  />
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                    {codeValidating && (
                      <DiagonalBoxLoader size="sm" color="hsl(var(--warning))" />
                    )}
                    {!codeValidating && codeValid === true && (
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-scale-in">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    {!codeValidating && codeValid === false && (
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-scale-in">
                        <X className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 flex items-center space-x-1">
                  <span>💡</span>
                  <span>Ingresa el código proporcionado por tu profesor (con o sin guiones)</span>
                </p>
                {codeValid === true && studentName && (
                  <div className="mt-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 animate-scale-in">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">¡Código válido!</p>
                        <p className="text-base font-bold text-emerald-900">{studentName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-800 px-5 py-4 rounded-xl flex items-start space-x-3 animate-shake">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || codeValidating}
                className={`w-full group relative inline-flex items-center justify-center px-6 py-5 text-lg font-bold text-white rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  codeValid === true
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:shadow-orange-500/50'
                }`}
              >
                <span className="relative flex items-center justify-center space-x-2">
                  {loading || codeValidating ? (
                    <>
                      <DiagonalBoxLoader size="sm" color="white" />
                      <span>Verificando...</span>
                    </>
                  ) : codeValid === true ? (
                    <>
                      <Check className="w-6 h-6" />
                      <span>Continuar al Paso 2</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Key className="w-6 h-6" />
                      <span>Verificar Código</span>
                    </>
                  )}
                </span>
              </button>
            </form>
          )}

          {/* Paso 2: Configurar contraseña */}
          {step === 'password' && (
            <form onSubmit={handleRegistration} className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Estudiante Verificado</p>
                    <p className="text-lg font-bold text-emerald-900">{studentName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-base font-bold text-gray-800 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <span>Contraseña</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-5 py-5 text-lg text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <p className="text-sm text-gray-500 flex items-center space-x-1">
                  <span>🔒</span>
                  <span>Debe tener al menos 6 caracteres</span>
                </p>
              </div>

              <div className="space-y-3">
                <label htmlFor="confirmPassword" className="block text-base font-bold text-gray-800 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  <span>Confirmar Contraseña</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-5 py-5 text-lg text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200"
                  placeholder="Repite tu contraseña"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-800 px-5 py-4 rounded-xl flex items-start space-x-3 animate-shake">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('code')
                    setPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  className="flex-1 inline-flex items-center justify-center px-6 py-5 text-base font-bold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-200 border-2 border-gray-300"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] group relative inline-flex items-center justify-center px-6 py-5 text-lg font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-2xl shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="relative flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <DiagonalBoxLoader size="sm" color="white" />
                        <span>Creando cuenta...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-6 h-6" />
                        <span>Crear Cuenta</span>
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Link de login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 hover:from-amber-700 hover:via-orange-700 hover:to-pink-700 transition-all duration-200"
              >
                Inicia sesión aquí →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
