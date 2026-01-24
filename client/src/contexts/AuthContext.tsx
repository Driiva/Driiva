import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface User {
  id: string;
  name: string;
  email: string;
  onboardingComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  checkOnboardingStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        // Check for demo mode first
        const demoModeActive = localStorage.getItem('driiva-demo-mode') === 'true';
        if (demoModeActive) {
          const demoUserData = localStorage.getItem('driiva-demo-user');
          if (demoUserData) {
            try {
              const parsedUser = JSON.parse(demoUserData);
              setUser({
                id: parsedUser.id,
                email: parsedUser.email,
                name: parsedUser.name || parsedUser.first_name || 'Demo User',
                onboardingComplete: true,
              });
              setLoading(false);
              return;
            } catch (e) {
              console.error('[AuthContext] Failed to parse demo user:', e);
            }
          }
        }

        if (!isSupabaseConfigured) {
          console.log('[AuthContext] Supabase not configured, skipping session check');
          setLoading(false);
          return;
        }

        // Check active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch profile to get onboarding status
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, onboarding_complete')
            .eq('id', session.user.id)
            .maybeSingle();

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.full_name || session.user.user_metadata?.name || session.user.email!.split("@")[0],
            onboardingComplete: profile?.onboarding_complete === true,
          });
        }
      } catch (error) {
        console.error('[AuthContext] Init error:', error);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch profile to get onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.full_name || session.user.user_metadata?.name || session.user.email!.split("@")[0],
          onboardingComplete: profile?.onboarding_complete === true,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    // Clear demo mode data
    localStorage.removeItem('driiva-demo-mode');
    localStorage.removeItem('driiva-demo-user');
    localStorage.removeItem('driiva-auth-token');
    
    await supabase.auth.signOut();
    setUser(null);
  };

  const checkOnboardingStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();
      
      return profile?.onboarding_complete === true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setIsAuthenticated: () => {},
        setUser,
        checkOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
