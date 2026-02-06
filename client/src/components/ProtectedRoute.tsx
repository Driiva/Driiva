import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
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
 * PERFORMANCE FIX: Resolves synchronously from AuthContext.user when available.
 * No Firestore reads here — onboarding status is already on the user object.
 * Only shows a spinner during the initial AuthProvider bootstrap (loading=true).
 * 
 * Flow:
 *   1. If AuthContext is still loading → brief spinner
 *   2. Demo mode → allow access
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

  // Demo mode — instant pass-through
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('driiva-demo-mode') === 'true';

  useEffect(() => {
    // Don't redirect while AuthProvider is still bootstrapping
    if (loading) return;
    // Don't redirect more than once per mount
    if (hasRedirected.current) return;

    if (isDemoMode) return; // demo users always pass

    if (!user) {
      hasRedirected.current = true;
      setLocation('/signin');
      return;
    }

    // Check onboarding (from context, no Firestore read needed)
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

  // Not authenticated (and not demo) — render nothing (redirect in useEffect)
  if (!isDemoMode && !user) {
    return null;
  }

  // Onboarding not completed — render nothing (redirect in useEffect)
  if (!isDemoMode && !skipOnboardingCheck && user && user.onboardingComplete !== true) {
    return null;
  }

  // All checks pass — render children immediately, no delay
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
 * PERFORMANCE FIX: Synchronous resolution from AuthContext.
 */
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectTo = '/home' 
}) => {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Demo mode should NOT block access to auth pages
    const isDemoMode = localStorage.getItem('driiva-demo-mode') === 'true';
    if (isDemoMode) return;

    if (user) {
      setLocation(redirectTo);
    }
  }, [loading, user, setLocation, redirectTo]);

  // While auth is loading, show content immediately (no spinner for public pages)
  if (loading) {
    return <>{children}</>;
  }

  // Demo mode — always show auth pages
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('driiva-demo-mode') === 'true';
  if (isDemoMode) {
    return <>{children}</>;
  }

  // Authenticated real user — render nothing (redirect happens in useEffect)
  if (user) {
    return null;
  }

  return <>{children}</>;
};
