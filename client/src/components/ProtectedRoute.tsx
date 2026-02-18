import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, skip onboarding check (for onboarding pages themselves) */
  skipOnboardingCheck?: boolean;
}

/**
 * PROTECTED ROUTE COMPONENT
 * =========================
 * Guards routes that require authentication.
 * 
 * PERFORMANCE FIX (v2):
 *   - useLayoutEffect for redirect → fires BEFORE browser paint, zero flicker
 *   - Resolves synchronously from AuthContext.user (no Firestore reads)
 *   - Demo mode is a fast localStorage check
 * 
 * Flow:
 *   1. If AuthContext is still loading → brief spinner
 *   2. Demo mode → allow access instantly
 *   3. AuthContext.user exists → check onboarding, redirect if needed
 *   4. No user → redirect to /signin
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  skipOnboardingCheck = false
}) => {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const hasRedirected = useRef(false);

  // Demo mode — instant pass-through (synchronous check)
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('driiva-demo-mode') === 'true';

  // useLayoutEffect fires synchronously after DOM mutation but BEFORE paint.
  // This eliminates the flash of blank content that useEffect causes.
  useLayoutEffect(() => {
    if (loading) return;
    if (hasRedirected.current) return;
    if (isDemoMode) return;

    if (!user) {
      hasRedirected.current = true;
      setLocation('/signin');
      return;
    }

    if (!skipOnboardingCheck && user.onboardingComplete !== true) {
      hasRedirected.current = true;
      setLocation('/quick-onboarding');
    }
  }, [loading, user, isDemoMode, skipOnboardingCheck, setLocation]);

  // AuthProvider still bootstrapping — show a BRIEF spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Demo mode → render immediately
  if (isDemoMode) return <>{children}</>;

  // Not authenticated → render nothing (redirect fires in useLayoutEffect)
  if (!user) return null;

  // Onboarding not completed → render nothing (redirect fires in useLayoutEffect)
  if (!skipOnboardingCheck && user.onboardingComplete !== true) return null;

  // All checks pass → render children immediately
  return <>{children}</>;
};

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * PUBLIC ONLY ROUTE
 * =================
 * Redirects authenticated users away from auth pages (signin, signup).
 * Demo mode does NOT count — users should be able to create real accounts from demo.
 *
 * PERFORMANCE FIX (v2): useLayoutEffect for zero-flicker redirects.
 */
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('driiva-demo-mode') === 'true';

  useLayoutEffect(() => {
    if (loading) return;
    if (isDemoMode) return;
    if (user) {
      setLocation(redirectTo);
    }
  }, [loading, user, setLocation, redirectTo, isDemoMode]);

  // While auth is loading, show content immediately (no spinner for public pages)
  if (loading) return <>{children}</>;

  // Demo mode — always show auth pages (so user can create real account)
  if (isDemoMode) return <>{children}</>;

  // Authenticated real user — render nothing (redirect fires in useLayoutEffect)
  if (user) return null;

  return <>{children}</>;
};
