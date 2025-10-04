import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/student-dashboard',
  '/students',
  '/courses',
  '/calendar',
  '/invoices',
  '/class-tracking',
  '/communications',
  '/stats',
  '/settings'
]

// Rutas de autenticación (redirigir si ya está autenticado)
const authRoutes = ['/auth/login', '/auth/register', '/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir acceso a rutas de API
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Permitir acceso a archivos estáticos
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Verificar si es una ruta de autenticación
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Si es una ruta protegida, permitir el acceso ya que el MainLayout manejará la autenticación
  if (isProtectedRoute) {
    return NextResponse.next()
  }

  // Si es una ruta de autenticación, permitir el acceso
  if (isAuthRoute) {
    return NextResponse.next()
  }

  // Para la ruta raíz, permitir el acceso ya que el MainLayout manejará la autenticación
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Para cualquier otra ruta, permitir el acceso
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
