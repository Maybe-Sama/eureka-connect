'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, 
  Calendar, 
  FileText, 
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Navigation will be generated dynamically based on student name

interface StudentSidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobile: boolean
}

export default function StudentSidebar({ isCollapsed, setIsCollapsed, isMobile }: StudentSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Generate navigation dynamically with student name
  const studentName = user?.studentName ?? 'Perfil'
  const studentNavigation = [
    { name: studentName, href: '/student-dashboard/profile', icon: User },
    { name: 'Calendario', href: '/student-dashboard/calendar', icon: Calendar },
    { name: 'Facturas', href: '/student-dashboard/invoices', icon: FileText },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className={cn(
            "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
            isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ 
          x: isMobile && isCollapsed ? -280 : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-70 bg-background-secondary border-r border-border",
          "lg:relative lg:translate-x-0 lg:border-r-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EurekaProfe
            </span>
          </motion.div>
          
          {isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            >
              {isCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {studentNavigation.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                    "hover:bg-background-tertiary hover:shadow-lg hover:shadow-primary/10",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "text-foreground-secondary hover:text-foreground"
                  )}
                  onClick={() => {
                    // Solo colapsar en móvil, no en desktop
                    if (isMobile) {
                      setIsCollapsed(true)
                    }
                  }}
                >
                  <Icon 
                    size={20} 
                    className={cn(
                      "transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-foreground-muted group-hover:text-foreground"
                    )} 
                  />
                  <span className="font-medium">{item.name}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-4 py-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group",
              "hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100",
              "hover:border-red-200 hover:text-red-700",
              "border border-transparent hover:shadow-lg hover:shadow-red-200/50",
              "text-foreground-secondary hover:text-red-700",
              "focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2"
            )}
          >
            <LogOut 
              size={20} 
              className={cn(
                "transition-all duration-300 group-hover:scale-110 group-hover:rotate-12",
                "text-foreground-muted group-hover:text-red-600"
              )} 
            />
            <span className="font-medium group-hover:font-semibold transition-all duration-300">
              Cerrar Sesión
            </span>
          </motion.button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-center text-sm text-foreground-muted">
            <p>© 2025 EurekaProfe</p>
            <p className="text-xs mt-1">Portal del Estudiante</p>
          </div>
        </div>
      </motion.div>
    </>
  )
}


