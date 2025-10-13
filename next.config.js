/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración por defecto para Next.js 14
  experimental: {
    esmExternals: 'loose'
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
  transpilePackages: ['archiver', 'cheerio', 'axios']
}

module.exports = nextConfig

