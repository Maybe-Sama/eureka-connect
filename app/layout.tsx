import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { CookieBannerProvider } from '@/components/ui/CookieBannerProvider'

export const metadata = {
  title: 'Profesor Eureka - CRM Profesional',
  description: 'Sistema de gestión para profesores autónomos',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
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
          <CookieBannerProvider>
            {children}
            <Toaster />
          </CookieBannerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
