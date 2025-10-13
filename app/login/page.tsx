'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GraduationCap, User, ArrowRight } from 'lucide-react'
// El CookieBanner ahora se maneja globalmente en el layout

export default function LoginSelectionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Efectos de fondo animados - Distribuidos por toda la pantalla */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 -left-4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 -left-8 w-72 h-72 sm:w-88 sm:h-88 lg:w-[24rem] lg:h-[24rem] bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-1000"></div>
        <div className="absolute top-1/2 -right-8 w-72 h-72 sm:w-88 sm:h-88 lg:w-[24rem] lg:h-[24rem] bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-3000"></div>
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-80 h-80 sm:w-96 sm:h-96 lg:w-[28rem] lg:h-[28rem] bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-5000"></div>
      </div>
      
      {/* Luces principales distribuidas */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-primary/35 rounded-full filter blur-2xl animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 bg-accent/35 rounded-full filter blur-2xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-3/4 left-1/4 w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 bg-primary/30 rounded-full filter blur-2xl animate-pulse animation-delay-4000"></div>
        <div className="absolute top-3/4 right-1/4 w-30 h-30 sm:w-38 sm:h-38 lg:w-46 lg:h-46 bg-accent/30 rounded-full filter blur-2xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-primary/40 rounded-full filter blur-xl animate-pulse animation-delay-3000"></div>
      </div>
      
      {/* Luces secundarias - Más pequeñas distribuidas */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-1/6 left-1/6 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-accent/30 rounded-full filter blur-xl animate-pulse animation-delay-1500"></div>
        <div className="absolute top-1/6 right-1/6 w-22 h-22 sm:w-26 sm:h-26 lg:w-30 lg:h-30 bg-primary/30 rounded-full filter blur-xl animate-pulse animation-delay-2500"></div>
        <div className="absolute top-2/3 left-1/6 w-18 h-18 sm:w-22 sm:h-22 lg:w-26 lg:h-26 bg-accent/35 rounded-full filter blur-lg animate-pulse animation-delay-3500"></div>
        <div className="absolute top-2/3 right-1/6 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-primary/35 rounded-full filter blur-lg animate-pulse animation-delay-4500"></div>
        <div className="absolute top-1/3 left-1/2 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-accent/40 rounded-full filter blur-lg animate-pulse animation-delay-500"></div>
        <div className="absolute top-2/3 left-1/2 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-primary/40 rounded-full filter blur-lg animate-pulse animation-delay-1500"></div>
      </div>
      
      {/* Luces de esquinas y bordes */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-accent/25 rounded-full filter blur-2xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-0 right-0 w-26 h-26 sm:w-34 sm:h-34 lg:w-42 lg:h-42 bg-primary/25 rounded-full filter blur-2xl animate-pulse animation-delay-3000"></div>
        <div className="absolute bottom-0 left-0 w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 bg-accent/25 rounded-full filter blur-2xl animate-pulse animation-delay-4000"></div>
        <div className="absolute bottom-0 right-0 w-22 h-22 sm:w-30 sm:h-30 lg:w-38 lg:h-38 bg-primary/25 rounded-full filter blur-2xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-0 w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 bg-accent/30 rounded-full filter blur-xl animate-pulse animation-delay-2500"></div>
        <div className="absolute top-1/2 right-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-primary/30 rounded-full filter blur-xl animate-pulse animation-delay-3500"></div>
      </div>
      
      {/* Luces adicionales para llenar espacios */}
      <div className="absolute inset-0 opacity-35">
        <div className="absolute top-1/5 left-1/3 w-14 h-14 sm:w-18 sm:h-18 lg:w-22 lg:h-22 bg-accent/30 rounded-full filter blur-lg animate-pulse animation-delay-600"></div>
        <div className="absolute top-1/5 right-1/3 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary/30 rounded-full filter blur-lg animate-pulse animation-delay-1200"></div>
        <div className="absolute top-4/5 left-1/3 w-18 h-18 sm:w-22 sm:h-22 lg:w-26 lg:h-26 bg-accent/30 rounded-full filter blur-lg animate-pulse animation-delay-1800"></div>
        <div className="absolute top-4/5 right-1/3 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-primary/30 rounded-full filter blur-lg animate-pulse animation-delay-2400"></div>
        <div className="absolute top-1/2 left-1/5 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-accent/35 rounded-full filter blur-lg animate-pulse animation-delay-3000"></div>
        <div className="absolute top-1/2 right-1/5 w-14 h-14 sm:w-18 sm:h-18 lg:w-22 lg:h-22 bg-primary/35 rounded-full filter blur-lg animate-pulse animation-delay-3600"></div>
      </div>
      
      {/* Luces de fondo grandes detrás de la ventana central */}
      <div className="absolute inset-0 opacity-60">
        {/* Luz principal grande detrás del centro */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[28rem] sm:h-[28rem] lg:w-[32rem] lg:h-[32rem] bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-[24rem] sm:h-[24rem] lg:w-[28rem] lg:h-[28rem] bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        
        {/* Luces adicionales grandes para crear más profundidad */}
        <div className="absolute top-1/3 left-1/3 w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-primary/60 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-1000"></div>
        <div className="absolute top-2/3 right-1/3 w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 bg-accent/60 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-3000"></div>
        
        {/* Luces de respaldo más grandes */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 sm:w-96 sm:h-96 lg:w-[28rem] lg:h-[28rem] bg-primary/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-accent/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-5000"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15"></div>
      
      {/* Gradiente de luz más intenso */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      
      {/* Luz central adicional - Más intensa */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 30%, transparent 70%)'
      }}></div>
      
      {/* Luz central de respaldo */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.06) 0%, transparent 60%)'
      }}></div>
      
      {/* Card principal con glassmorphism */}
      <div className="max-w-xs sm:max-w-lg lg:max-w-2xl w-full relative z-10">
        <div className="glass-effect rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 lg:p-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-card rounded-2xl shadow-lg mb-4 sm:mb-6 relative overflow-hidden border border-border">
              <Image 
                src="/logo1.png" 
                alt="EurekaConnect Logo" 
                width={80} 
                height={80} 
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-2xl animate-pulse"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-4">
              Eureka-Connect
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-foreground-muted">
              Selecciona tu tipo de usuario
            </p>
          </div>

          {/* Opciones de login */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Login Profesor */}
            <div 
              onClick={() => router.push('/teacher-login')}
              className="group cursor-pointer bg-card/50 hover:bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] card-hover"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-accent rounded-lg sm:rounded-xl shadow-lg mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                  Profesor
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-foreground-muted text-center">
                  Accede a tu panel de administración para gestionar estudiantes, clases y facturas
                </p>
              </div>
            </div>

            {/* Login Estudiante */}
            <div 
              onClick={() => router.push('/student-login')}
              className="group cursor-pointer bg-card/50 hover:bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/20 hover:scale-[1.02] card-hover"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-accent to-primary rounded-lg sm:rounded-xl shadow-lg mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                  Estudiante
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-foreground-muted text-center">
                  Accede a tu perfil para ver tu horario, facturas y información personal
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
            <p className="text-xs sm:text-sm text-foreground-muted">
              ¿Eres estudiante y no tienes cuenta?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover transition-all duration-200"
              >
                Regístrate aquí →
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* El banner de cookies ahora se maneja globalmente */}
    </div>
  )
}