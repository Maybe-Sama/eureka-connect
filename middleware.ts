import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas exclusivas para profesores
const teacherRoutes = [
  '/dashboard',
  '/students',
  '/courses',
  '/calendar',
  '/invoices',
  '/class-tracking',
  '/communications',
  '/stats',
  '/settings'
]

// Rutas exclusivas para estudiantes
const studentRoutes = [
  '/student-dashboard'
]

// Rutas de autenticación (públicas)
const authRoutes = ['/auth/login', '/auth/register', '/login', '/register', '/logout']

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

  // Permitir acceso a rutas de autenticación
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  if (isAuthRoute) {
    return NextResponse.next()
  }

  // Verificar si es una ruta de profesor
  const isTeacherRoute = teacherRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Verificar si es una ruta de estudiante
  const isStudentRoute = studentRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Obtener el tipo de usuario de las cookies o localStorage
  // Nota: En middleware no podemos acceder a localStorage, pero podemos usar cookies
  const userType = request.cookies.get('user_type')?.value

  // Si es una ruta de profesor y el usuario es estudiante, redirigir
  if (isTeacherRoute && userType === 'student') {
    const url = request.nextUrl.clone()
    url.pathname = '/student-dashboard/profile'
    return NextResponse.redirect(url)
  }

  // Si es una ruta de estudiante y el usuario es profesor, redirigir
  if (isStudentRoute && userType === 'teacher') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Para la ruta raíz, permitir el acceso (será manejado por el layout)
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
