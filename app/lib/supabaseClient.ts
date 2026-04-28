// app/lib/supabaseClient.ts - SINGLETON PARA EVITAR WARNING EN DEV
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ✅ Singleton: solo se crea una instancia, incluso con hot reload
let supabaseInstance: SupabaseClient | undefined

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  }
  return supabaseInstance
}

// ✅ Exportar la instancia única
export const supabase = getSupabase()