import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// Configuración simple que funciona sin RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente simple que funciona con RLS deshabilitado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Re-exportar tipos
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
