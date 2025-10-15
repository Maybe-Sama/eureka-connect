/**
 * SERVER-ONLY MODULE
 * 
 * CRITICAL SECURITY WARNING:
 * This module should NEVER be imported in client-side code!
 * It uses the service role key which bypasses all Row Level Security.
 * 
 * Use ONLY in:
 * - API routes (app/api/route.ts files)
 * - Server Components
 * - Server Actions
 * 
 * NEVER import in:
 * - Client Components (use client directive)
 * - Contexts
 * - Hooks
 */

import { createClient } from '@supabase/supabase-js'

// Type definition for Database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, unknown>
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, unknown>
  }
}

// Detect if running in browser
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY ERROR: supabase-server.ts is being imported in client-side code! ' +
    'This exposes the service role key. Use API routes instead.'
  )
}

// Cliente para operaciones del servidor con autenticación automática
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Verificar que la service role key esté configurada
if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local')
  console.error('Por favor, agrega SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui a tu archivo .env.local')
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not configured')
}

// Cliente con service role key (bypassa RLS) - para operaciones del servidor
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Cliente normal para el cliente - con autenticación automática
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Re-exportar tipos
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
