const fs = require('fs')
const path = require('path')

console.log('🔍 Verificando configuración de Supabase...\n')

// Verificar si existe .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ Archivo .env.local no encontrado')
  console.log('\n📝 Necesitas crear el archivo .env.local con:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui')
  console.log('\n💡 Puedes copiar supabase-config.example y editarlo:')
  console.log('cp supabase-config.example .env.local')
  process.exit(1)
}

// Leer y verificar variables
const envContent = fs.readFileSync(envPath, 'utf8')
const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))

console.log('✅ Archivo .env.local encontrado')
console.log('\n📋 Variables encontradas:')

let hasUrl = false
let hasKey = false

lines.forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    console.log(`  ${key}: ${value.substring(0, 20)}...`)
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') hasUrl = true
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') hasKey = true
  }
})

console.log('\n🔍 Verificación:')
if (hasUrl) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL configurada')
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL no encontrada')
}

if (hasKey) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurada')
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no encontrada')
}

if (hasUrl && hasKey) {
  console.log('\n🎉 ¡Configuración completa!')
  console.log('Ahora puedes ejecutar: pnpm dev')
} else {
  console.log('\n⚠️  Configuración incompleta')
  console.log('Edita .env.local con tus credenciales de Supabase')
}
