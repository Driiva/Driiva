import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
 * Flow:
 *   1. Check demo mode → allow access if demo
 *   2. Check Firebase auth → redirect to /signin if not authenticated
 *   3. Check onboarding status → redirect to /quick-onboarding if not completed
 *   4. Allow access if all checks pass
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  skipOnboardingCheck = false
}) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    // Check demo mode first
    const isDemoMode = localStorage.getItem('driiva-demo-mode') === 'true';
    if (isDemoMode) {
      setIsAuthenticated(true);
      setOnboardingCompleted(true); // Demo users skip onboarding
      setIsChecking(false);
      return;
    }

    // If we have user from context, use that
    if (user) {
      setIsAuthenticated(true);
      const completed = user.onboardingComplete === true;
      setOnboardingCompleted(completed);
      
      // Redirect to onboarding if not completed (unless skipped)
      if (!completed && !skipOnboardingCheck) {
        setLocation('/quick-onboarding');
      }
      setIsChecking(false);
      return;
    }

    // Firebase not configured
    if (!isFirebaseConfigured) {
      setIsAuthenticated(false);
      setIsChecking(false);
      setLocation('/signin');
      return;
    }

    // Listen to auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setIsAuthenticated(false);
        setIsChecking(false);
        setLocation('/signin');
        return;
      }

      setIsAuthenticated(true);

      // Skip onboarding check if requested
      if (skipOnboardingCheck) {
        setOnboardingCompleted(true);
        setIsChecking(false);
        return;
      }

      // Check onboarding status in Firestore
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        // Check both field names for compatibility
        const completed = userData?.onboardingCompleted === true || 
                          userData?.onboardingComplete === true;
        
        setOnboardingCompleted(completed);

        if (!completed) {
          setLocation('/quick-onboarding');
        }
      } catch (error) {
        console.error('[ProtectedRoute] Error checking onboarding status:', error);
        // On error, redirect to onboarding to be safe
        setOnboardingCompleted(false);
        setLocation('/quick-onboarding');
      }

      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [user, setLocation, skipOnboardingCheck]);

  // Show loading spinner while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated but onboarding not completed (and not skipped)
  if (!onboardingCompleted && !skipOnboardingCheck) {
    return null;
  }

  return <>{children}</>;
};

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectTo = '/home' 
}) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // NOTE: Demo mode should NOT block access to auth pages (signup/signin)
    // Users in demo mode should be able to create a real account
    // Only real Firebase authentication should redirect away from auth pages

    if (user) {
      setShouldRedirect(true);
      setIsChecking(false);
      setLocation(redirectTo);
      return;
    }

    if (!isFirebaseConfigured) {
      setShouldRedirect(false);
      setIsChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setShouldRedirect(true);
        setLocation(redirectTo);
      } else {
        setShouldRedirect(false);
      }
      setIsChecking(false);
    });

    return () => unsubscribe();
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
