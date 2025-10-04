const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas')
  console.log('Asegúrate de que .env.local contenga:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStartDateColumn() {
  console.log('🔍 Verificando si el campo start_date existe en la tabla students...')
  
  try {
    // Try to query the students table with start_date to see if it exists
    const { data, error } = await supabase
      .from('students')
      .select('start_date')
      .limit(1)
    
    if (error) {
      if (error.message.includes('column "start_date" does not exist')) {
        console.log('❌ El campo start_date NO existe en la tabla students')
        return false
      } else {
        console.error('❌ Error verificando la tabla:', error)
        return false
      }
    }
    
    console.log('✅ El campo start_date ya existe en la tabla students')
    return true
  } catch (error) {
    console.error('❌ Error verificando la tabla:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Verificando migración para start_date...\n')
  
  const exists = await checkStartDateColumn()
  
  if (exists) {
    console.log('\n🎉 ¡El campo start_date ya existe!')
    console.log('Puedes crear estudiantes sin problemas.')
  } else {
    console.log('\n⚠️  El campo start_date NO existe en la tabla students.')
    console.log('\n📝 Para solucionarlo, ejecuta este SQL en el dashboard de Supabase:')
    console.log('\n1. Ve a https://supabase.com/dashboard')
    console.log('2. Selecciona tu proyecto')
    console.log('3. Ve a SQL Editor')
    console.log('4. Ejecuta este comando:')
    console.log('\n   ALTER TABLE students ADD COLUMN IF NOT EXISTS start_date DATE;')
    console.log('\n5. Luego ejecuta: pnpm dev')
  }
}

main().catch(console.error)
