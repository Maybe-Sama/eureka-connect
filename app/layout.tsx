import './globals.css'
import MainLayout from '@/components/layout/main-layout'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
  title: 'EurekaProfe - CRM Profesional',
  description: 'Sistema de gestión para profesores autónomos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
