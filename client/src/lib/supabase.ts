import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase'))

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (!isSupabaseConfigured) {
    console.warn('[Supabase] Not configured - using placeholder client');
    supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key')
    return supabaseInstance
  }

  console.log('[Supabase] Initializing client:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
    keyLength: supabaseAnonKey.length
  })

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'driiva-auth-token',
    }
  })

  return supabaseInstance
}

export const supabase: SupabaseClient = getSupabaseClient()

