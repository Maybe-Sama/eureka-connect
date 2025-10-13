'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import StudentLayout from '@/components/layout/student-layout'

interface StudentDashboardLayoutProps {
  children: React.ReactNode
}

export default function StudentDashboardLayout({ children }: StudentDashboardLayoutProps) {
  return (
    <StudentLayout>
      {children}
    </StudentLayout>
  )
}

