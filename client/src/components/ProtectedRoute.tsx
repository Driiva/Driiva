import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
    const isDemoMode = localStorage.getItem('driiva-demo-mode') === 'true';
    if (isDemoMode) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    if (user) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    if (!isFirebaseConfigured) {
      setIsAuthenticated(false);
      setIsChecking(false);
      setLocation('/signin');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setLocation('/signin');
      }
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [user, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
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
  redirectTo = '/dashboard' 
}) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('driiva-demo-mode') === 'true';
    if (isDemoMode) {
      setShouldRedirect(true);
      setIsChecking(false);
      setLocation(redirectTo);
      return;
    }

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
