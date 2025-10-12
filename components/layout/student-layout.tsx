'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Calendar,
  FileText,
  FolderOpen,
  Menu,
  X,
  LogOut,
  Settings,
  BookOpen
} from 'lucide-react'
import { DiagonalBoxLoader } from '@/components/ui/DiagonalBoxLoader'
import { cn } from '@/lib/utils'
import ErrorBoundary from '@/components/ErrorBoundary'

interface StudentLayoutProps {
  children: React.ReactNode
}

function StudentLayoutContent({ children }: StudentLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, loading, isStudent, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !isStudent) {
      router.push('/login')
    }
  }, [mounted, loading, isStudent, router])

  useEffect(() => {
    if (!mounted) return
    
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setIsCollapsed(false)
      } else {
        setIsCollapsed(true) // En móvil, el sidebar debe estar cerrado por defecto
      }
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [mounted])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const studentName = user?.studentName ?? 'Perfil'
  const studentNavigation = [
    { name: studentName, href: '/student-dashboard/profile', icon: User },
    { name: 'Clases', href: '/student-dashboard/classes', icon: BookOpen },
    { name: 'Calendario', href: '/student-dashboard/calendar', icon: Calendar },
    { name: 'Documentos', href: '/student-dashboard/documentos', icon: FolderOpen },
    { name: 'Facturas', href: '/student-dashboard/invoices', icon: FileText },
    { name: 'Configuración', href: '/student-dashboard/settings', icon: Settings },
  ]

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
      </div>
    )
  }

  if (!isStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center">
          <DiagonalBoxLoader size="lg" color="hsl(var(--primary))" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile hamburger button */}
      <AnimatePresence>
        {isMobile && isCollapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCollapsed(false)}
            className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 sm:p-3 rounded-lg glass-effect border border-border shadow-lg hover:bg-muted transition-colors"
          >
            <Menu size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsCollapsed(true)}
            onTouchEnd={() => setIsCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || !isCollapsed) && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 z-50 h-full w-64 sm:w-70 glass-effect border-l border-border",
              "lg:relative lg:translate-x-0 lg:border-l-0"
            )}
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 border-b border-border relative overflow-hidden"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
              
              <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center overflow-hidden glass-effect border border-primary/20"
                >
                  <img
                    src="/logo1.png"
                    alt="Eureka Connect Logo"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-bold text-base sm:text-xl wave-text-slow">
                    Eureka Connect
                  </span>
               
                </div>
              </div>

              {isMobile && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors relative z-10"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </motion.button>
              )}
            </motion.div>

            {/* Navigation */}
            <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2">
              {studentNavigation.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                        "hover:bg-muted/50 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]",
                        isActive
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => {
                        if (isMobile) {
                          setIsCollapsed(true)
                        }
                      }}
                    >
                      {/* Hover effect background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Active state background */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
                      )}
                      
                      <Icon
                        size={20}
                        className={cn(
                          "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="font-medium text-sm sm:text-base relative z-10 group-hover:font-semibold transition-all duration-300">
                        {item.name}
                      </span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Logout Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-3 sm:px-4 py-3 sm:py-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className={cn(
                  "w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  "hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-100/50",
                  "hover:border-red-200 hover:text-red-700",
                  "border border-transparent hover:shadow-lg hover:shadow-red-200/50",
                  "text-muted-foreground hover:text-red-700",
                  "focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2"
                )}
              >
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-400/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <LogOut
                  size={20}
                  className={cn(
                    "transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10",
                    "text-muted-foreground group-hover:text-red-600"
                  )}
                />
                <span className="font-medium group-hover:font-semibold transition-all duration-300 text-sm sm:text-base relative z-10">
                  Cerrar Sesión
                </span>
              </motion.button>
            </motion.div>

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-3 sm:p-4 border-t border-border relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
              <div className="text-center text-xs sm:text-sm text-muted-foreground relative z-10">
                <p className="font-medium">© 2025 Eureka Connect</p>
                <p className="text-xs mt-1 opacity-80">Portal del Estudiante</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 lg:ml-0">
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <ErrorBoundary>
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </ErrorBoundary>
  )
}