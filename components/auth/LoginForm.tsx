'use client'

import React, { useState } from 'react'
import { authenticateTeacher, authenticateStudent } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [isTeacher, setIsTeacher] = useState(true)
  const [email, setEmail] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (isTeacher) {
        result = await authenticateTeacher(email, password)
      } else {
        result = await authenticateStudent(studentCode, password)
      }

      if (result.success && result.user && result.token) {
        login(result.user, result.token)
        router.push(isTeacher ? '/dashboard' : '/student-dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isTeacher ? 'Acceso Profesor' : 'Acceso Estudiante'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isTeacher 
              ? 'Inicia sesión con tu email y contraseña' 
              : 'Inicia sesión con tu código de estudiante y contraseña'
            }
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setIsTeacher(true)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isTeacher 
                  ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              👨‍🏫 Profesor
            </button>
            <button
              type="button"
              onClick={() => setIsTeacher(false)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isTeacher 
                  ? 'bg-white text-indigo-600 shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              👨‍🎓 Estudiante
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isTeacher ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-200 hover:border-gray-400"
                placeholder="profesor@eureka.com"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">
                Código de Estudiante
              </label>
              <input
                id="studentCode"
                type="text"
                required
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-200 hover:border-gray-400"
                placeholder="07871621705058065942"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-200 hover:border-gray-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {!isTeacher && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => router.push('/(auth)/register')}
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200 hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
