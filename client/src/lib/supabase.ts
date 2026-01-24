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

// Demo accounts for beta users (works without Supabase)
export const DEMO_ACCOUNTS: Record<string, {
  id: string;
  email: string;
  name: string;
  password: string;
  drivingScore: number;
  premiumAmount: number;
  totalMiles: number;
  projectedRefund: number;
}> = {
  'driiva1': {
    id: 'demo-user-1',
    email: 'demo@driiva.co.uk',
    name: 'Demo Driver',
    password: 'driiva1',
    drivingScore: 85,
    premiumAmount: 1500,
    totalMiles: 1247,
    projectedRefund: 150,
  },
  'alex': {
    id: 'demo-user-2',
    email: 'alex@driiva.co.uk',
    name: 'Alex Thompson',
    password: 'alex123',
    drivingScore: 92,
    premiumAmount: 1200,
    totalMiles: 2340,
    projectedRefund: 180,
  },
  'sarah': {
    id: 'demo-user-3',
    email: 'sarah@driiva.co.uk',
    name: 'Sarah Mitchell',
    password: 'sarah123',
    drivingScore: 78,
    premiumAmount: 1800,
    totalMiles: 890,
    projectedRefund: 126,
  },
  'james': {
    id: 'demo-user-4',
    email: 'james@driiva.co.uk',
    name: 'James Wilson',
    password: 'james123',
    drivingScore: 88,
    premiumAmount: 1400,
    totalMiles: 1650,
    projectedRefund: 154,
  },
  'test': {
    id: 'demo-user-5',
    email: 'test@driiva.co.uk',
    name: 'Test User',
    password: 'test123',
    drivingScore: 72,
    premiumAmount: 1840,
    totalMiles: 560,
    projectedRefund: 100,
  },
};

// Legacy exports for backward compatibility
export const DEMO_USER = DEMO_ACCOUNTS['driiva1'];

export const DEMO_CREDENTIALS = {
  username: 'driiva1',
  password: 'driiva1',
};

// Helper to check if credentials match a demo account
export function getDemoAccount(username: string, password: string) {
  const normalizedUsername = username.toLowerCase().replace('@driiva.co.uk', '').trim();
  const account = DEMO_ACCOUNTS[normalizedUsername];
  if (account && account.password === password) {
    return account;
  }
  return null;
}
