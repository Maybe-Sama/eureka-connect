/**
 * Rate Limiter para proteger rutas de autenticación
 * 
 * Implementa limitación de intentos por IP para prevenir ataques de fuerza bruta
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Almacenamiento en memoria de intentos por IP
// En producción, considerar usar Redis para escalabilidad
const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxAttempts: number // Número máximo de intentos
  windowMs: number // Ventana de tiempo en milisegundos
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  error?: string
}

/**
 * Verifica si una IP ha excedido el límite de intentos
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000 // 15 minutos
  }
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Si no hay entrada o la ventana ha expirado, crear nueva entrada
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime
    })

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime
    }
  }

  // Si ya alcanzó el límite
  if (entry.count >= config.maxAttempts) {
    const minutesRemaining = Math.ceil((entry.resetTime - now) / 60000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: `Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en ${minutesRemaining} minuto${minutesRemaining !== 1 ? 's' : ''}.`
    }
  }

  // Incrementar contador
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Resetea el contador para una IP (útil después de login exitoso)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Obtiene la IP del cliente desde los headers de la request
 */
export function getClientIP(request: Request): string {
  // Intentar obtener IP de headers comunes (proxies, load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback (no debería llegar aquí en producción)
  return 'unknown'
}

