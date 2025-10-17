/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración por defecto para Next.js 14
  experimental: {
    esmExternals: 'loose'
  },
  // Mejorar Fast Refresh
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Ignorar warnings durante el build (solo fallar en errores)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Configuración para manejar dependencias modernas
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Configuración para archiver y dependencias del servidor
    if (isServer) {
      config.externals.push('archiver')
    }
    
    return config
  },
  // Configuración para transpilar dependencias específicas
  transpilePackages: ['archiver', 'cheerio', 'axios'],
  
  // 🔒 Headers de seguridad para producción
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Previene clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Previene MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Controla información del referrer
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Protección XSS del navegador
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Fuerza HTTPS (solo en producción)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
          // Política de contenido (CSP) - compatible con todas las librerías
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "upgrade-insecure-requests"
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

