import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  redirectTo: '/dashboard' | '/onboarding';
  error: AuthError | null;
}

export interface AuthError {
  code: string;
  message: string;
}

export type AuthRedirectPath = '/dashboard' | '/onboarding';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// PROFILE HELPERS
// ============================================================================

/**
 * Check if a user profile exists and is complete
 */
async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

/**
 * Check if profile has required onboarding fields completed
 */
function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  
  return Boolean(
    profile.full_name &&
    profile.phone_number &&
    profile.date_of_birth
  );
}

/**
 * Determine redirect path based on profile status
 */
function getRedirectPath(profile: Profile | null): AuthRedirectPath {
  if (!profile || !isProfileComplete(profile)) {
    return '/onboarding';
  }
  return '/dashboard';
}

// ============================================================================
// AUTH HANDLER
// ============================================================================

/**
 * Handle post-login authentication flow
 * - Checks if user has a profile
 * - Determines redirect based on profile completeness
 * - Returns user, session, profile, and redirect path
 */
export async function handlePostLogin(
  accessToken?: string
): Promise<AuthResult> {
  try {
    let user: User | null = null;
    let session: Session | null = null;

    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error) {
        return {
          user: null,
          session: null,
          profile: null,
          redirectTo: '/onboarding',
          error: {
            code: 'AUTH_ERROR',
            message: error.message,
          },
        };
      }
      user = data.user;
    } else {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        return {
          user: null,
          session: null,
          profile: null,
          redirectTo: '/onboarding',
          error: {
            code: 'SESSION_ERROR',
            message: sessionError.message,
          },
        };
      }
      session = sessionData.session;
      user = session?.user ?? null;
    }

    if (!user) {
      return {
        user: null,
        session: null,
        profile: null,
        redirectTo: '/onboarding',
        error: {
          code: 'NO_USER',
          message: 'No authenticated user found',
        },
      };
    }

    const profile = await getProfile(user.id);
    const redirectTo = getRedirectPath(profile);

    return {
      user,
      session,
      profile,
      redirectTo,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      user: null,
      session: null,
      profile: null,
      redirectTo: '/onboarding',
      error: {
        code: 'UNEXPECTED_ERROR',
        message,
      },
    };
  }
}

/**
 * Callback handler for OAuth redirects
 * Use this in your auth callback route
 */
export async function handleAuthCallback(
  code: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        user: null,
        session: null,
        profile: null,
        redirectTo: '/onboarding',
        error: {
          code: 'CODE_EXCHANGE_ERROR',
          message: error.message,
        },
      };
    }

    const { user, session } = data;

    if (!user) {
      return {
        user: null,
        session: null,
        profile: null,
        redirectTo: '/onboarding',
        error: {
          code: 'NO_USER',
          message: 'No user returned from code exchange',
        },
      };
    }

    const profile = await getProfile(user.id);
    const redirectTo = getRedirectPath(profile);

    return {
      user,
      session,
      profile,
      redirectTo,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      user: null,
      session: null,
      profile: null,
      redirectTo: '/onboarding',
      error: {
        code: 'UNEXPECTED_ERROR',
        message,
      },
    };
  }
}

/**
 * Create or update user profile
 */
export async function upsertProfile(
  userId: string,
  profileData: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ profile: Profile | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return {
        profile: null,
        error: {
          code: 'UPSERT_ERROR',
          message: error.message,
        },
      };
    }

    return { profile: data as Profile, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      profile: null,
      error: {
        code: 'UNEXPECTED_ERROR',
        message,
      },
    };
  }
}

export { supabase, getProfile, isProfileComplete, getRedirectPath };
