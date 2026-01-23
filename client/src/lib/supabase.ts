import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// DEBUG: Log config status (only in development, no sensitive data)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config Check:', {
    urlConfigured: !!supabaseUrl && supabaseUrl.includes('supabase.co'),
    keyConfigured: !!supabaseAnonKey && supabaseAnonKey.length > 50,
  });
}

// Check if config is valid
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl.includes('supabase.co'));

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn('⚠️ Supabase not fully configured - demo mode available');
}

let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create client even if not fully configured (allows graceful degradation)
  const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co'
  const key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'driiva-auth-token',
    }
  })

  if (import.meta.env.DEV) {
    console.log('✓ Supabase client created');
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()

// Helper function to test Supabase connectivity
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { connected: false, error: 'Supabase not configured' }
  }

  try {
    // Race between auth check and timeout
    const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
      setTimeout(() => resolve({ timeout: true }), 5000)
    })
    
    const authPromise = supabase.auth.getSession().then(result => ({ ...result, timeout: false as const }))
    
    const result = await Promise.race([authPromise, timeoutPromise])
    
    if ('timeout' in result && result.timeout) {
      return { connected: false, error: 'Connection timeout' }
    }
    
    if ('error' in result && result.error) {
      return { connected: false, error: result.error.message }
    }
    
    return { connected: true }
  } catch (err: any) {
    return { connected: false, error: err.message || 'Unknown error' }
  }
}

// Demo user data for fallback mode
export const DEMO_USER = {
  id: 'demo-user-8',
  email: 'test@driiva.com',
  name: 'Test Driver',
}

export const DEMO_CREDENTIALS = {
  username: 'driiva1',
  password: 'driiva1',
}
