import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// DEBUG: Log the credentials (safely)
console.log('🔍 Supabase Config Check:', {
  urlExists: !!supabaseUrl,
  urlLength: supabaseUrl.length,
  urlPreview: supabaseUrl.slice(0, 30) + '...',
  keyExists: !!supabaseAnonKey,
  keyLength: supabaseAnonKey.length,
  keyPreview: supabaseAnonKey.slice(0, 20) + '...',
});

// Check if config is valid
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl.includes('supabase.co'));

if (!isSupabaseConfigured) {
  console.error('❌ Supabase not configured! Check your .env file');
  console.error('Expected format:');
  console.error('VITE_SUPABASE_URL=https://xxxxx.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=eyJxxx...');
}

let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'driiva-auth-token',
    }
  })

  console.log('✓ Supabase client created');
  return supabaseInstance
}

export const supabase = getSupabaseClient()
