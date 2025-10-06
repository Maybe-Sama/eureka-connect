'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, User, ArrowRight, Lock } from 'lucide-react'

export default function LoginSelectionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Card principal con glassmorphism */}
      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-6 relative">
              <Lock className="w-12 h-12 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Bienvenido a EurekaConnect
            </h1>
            <p className="text-xl text-gray-600">
              Selecciona tu tipo de usuario para continuar
            </p>
          </div>

          {/* Opciones de login */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Login Profesor */}
            <div 
              onClick={() => router.push('/teacher-login')}
              className="group cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02]"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Profesor
                </h3>
                <p className="text-gray-600 mb-6">
                  Accede a tu panel de administración para gestionar estudiantes, clases y facturas
                </p>
                <div className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                  <span>Iniciar sesión</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Login Estudiante */}
            <div 
              onClick={() => router.push('/student-login')}
              className="group cursor-pointer bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.02]"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Estudiante
                </h3>
                <p className="text-gray-600 mb-6">
                  Accede a tu perfil para ver tu horario, facturas y información personal
                </p>
                <div className="inline-flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700 transition-colors">
                  <span>Iniciar sesión</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              ¿Eres estudiante y no tienes cuenta?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
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
