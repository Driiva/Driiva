import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for demo mode first
      const isDemoMode = localStorage.getItem('driiva-demo-mode') === 'true';
      if (isDemoMode) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Check auth context
      if (user) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Check Supabase session
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
          }
        } catch (error) {
          console.error('[ProtectedRoute] Session check error:', error);
        }
      }

      // No valid session found - redirect to signin
      console.log('[ProtectedRoute] No valid session, redirecting to signin');
      setIsAuthenticated(false);
      setIsChecking(false);
      setLocation('/signin');
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setLocation('/signin');
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, setLocation]);

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

/**
 * HOC to redirect authenticated users away from public pages (signin/signup)
 */
interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for demo mode
      const isDemoMode = localStorage.getItem('driiva-demo-mode') === 'true';
      if (isDemoMode) {
        setShouldRedirect(true);
        setIsChecking(false);
        setLocation(redirectTo);
        return;
      }

      // Check auth context
      if (user) {
        setShouldRedirect(true);
        setIsChecking(false);
        setLocation(redirectTo);
        return;
      }

      // Check Supabase session
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setShouldRedirect(true);
            setIsChecking(false);
            setLocation(redirectTo);
            return;
          }
        } catch (error) {
          console.error('[PublicOnlyRoute] Session check error:', error);
        }
      }

      // No session - allow access to public page
      setShouldRedirect(false);
      setIsChecking(false);
    };

    checkAuth();
  }, [user, setLocation, redirectTo]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  return <>{children}</>;
};
