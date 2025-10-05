import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  throw new Error('Variables de entorno de Supabase no configuradas correctamente')
}

// Cliente simple que funciona sin RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey)