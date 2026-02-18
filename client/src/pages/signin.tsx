import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import signinLogo from "@/assets/driiva-logo-CLEAR-FINAL.png";
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "../contexts/AuthContext";
import { auth, db, isFirebaseConfigured, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * SIGN-IN PAGE
 * ------------
 * This page handles REAL Firebase authentication only.
 * NO demo accounts - demo mode is accessed via /demo route.
 */

export default function SignIn() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'unavailable'>('checking');
  const [, setLocation] = useLocation();
  // Single field: user can enter email or username (e.g. driiva1 → driiva1@driiva.co.uk)
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const { ref: cardRef, style: cardParallaxStyle } = useParallax({ speed: 0.3 });
  const { setUser } = useAuth();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setConnectionStatus('unavailable');
    } else {
      setConnectionStatus('connected');
    }
  }, []);

  // Scroll error into view when it appears
  useEffect(() => {
    if (loginError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [loginError]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[SignIn] handleSubmit called');
    e.preventDefault();
    e.stopPropagation();
    
    setLoginError(null);
    
    if (!emailOrUsername.trim() || !password.trim()) {
      setLoginError('Please enter both email or username and password');
      toast({ title: "Missing credentials", description: "Please enter both email or username and password", variant: "destructive" });
      return;
    }

    // Show loading immediately so user sees feedback
    setIsLoading(true);
    setLoginError(null);

    // Resolve to email so johndoe and johndoe@abc.com map to the same user
    let email: string;
    const raw = emailOrUsername.trim();
    if (raw.includes('@')) {
      email = raw;
    } else {
      const usernameKey = raw.toLowerCase();
      if (db) {
        try {
          const usernameSnap = await getDoc(doc(db, 'usernames', usernameKey));
          if (usernameSnap.exists() && usernameSnap.data()?.email) {
            email = usernameSnap.data()!.email as string;
          } else {
            email = `${raw}@driiva.co.uk`;
          }
        } catch {
          email = `${raw}@driiva.co.uk`;
        }
      } else {
        email = `${raw}@driiva.co.uk`;
      }
    }

    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      setLoginError('Sign-in is currently unavailable. Please try demo mode.');
      toast({ title: "Service unavailable", description: "Try demo mode instead.", variant: "destructive" });
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('[SignIn] Authentication successful, user:', user.uid);

      let onboardingComplete = false;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          onboardingComplete = userData?.onboardingComplete === true;
          console.log('[SignIn] Profile found, onboardingComplete:', onboardingComplete);
        } else {
          console.log('[SignIn] Profile not found, creating...');
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email || email,
            fullName: user.displayName || user.email?.split('@')[0] || 'User',
            onboardingComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (profileErr) {
        console.error('[SignIn] Profile check/create error:', profileErr);
      }

      setUser({
        id: user.uid,
        email: user.email || email,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        onboardingComplete,
      });

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });

      // Navigate based on onboarding status
      const destination = onboardingComplete ? "/dashboard" : "/quick-onboarding";
      console.log('[SignIn] Redirecting to', destination);
      setLocation(destination);

    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('[SignIn] Authentication failed:', err);
      let errorMessage = "Invalid email or password. Try demo mode if you don't have an account yet.";

      if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key' ||
          err.code === 'auth/api-key-not-valid-please-pass-a-valid-api-key' ||
          err.message?.includes('api-key-not-valid')) {
        errorMessage = "Service configuration error. The Firebase API key is invalid or restricted.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Use one of the test accounts or try demo mode.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Check your connection and try again.";
      }

      setLoginError(errorMessage);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('[SignIn] handleSubmit completed');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setLoginError('Google Sign-In is currently unavailable.');
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    try {
      console.log('[SignIn] Starting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('[SignIn] Google auth successful, user:', user.uid);

      let onboardingComplete = false;

      try {
        if (!db) throw new Error('Firestore not initialized');
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          onboardingComplete = userData?.onboardingComplete === true;
          console.log('[SignIn] Google user profile found, onboardingComplete:', onboardingComplete);
        } else {
          console.log('[SignIn] Google user profile not found, creating...');
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email || '',
            fullName: user.displayName || user.email?.split('@')[0] || 'User',
            onboardingComplete: false,
            onboardingCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (profileErr) {
        console.error('[SignIn] Google user profile check/create error:', profileErr);
      }

      setUser({
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'User',
        onboardingComplete,
      });

      toast({
        title: "Welcome!",
        description: "Signed in with Google",
      });

      console.log('[SignIn] Redirecting after Google sign-in');
      setLocation(onboardingComplete ? "/dashboard" : "/quick-onboarding");

    } catch (error: any) {
      console.error('[SignIn] Google sign-in failed:', error);

      // User closed the popup — not an error worth showing
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }

      let errorMessage = "Google sign-in failed. Please try again.";
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email using a different sign-in method.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
      }

      setLoginError(errorMessage);
      toast({
        title: "Google sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onClick={() => setLocation("/welcome")}
          className="absolute top-6 left-4 z-20 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200"
          aria-label="Back to welcome"
        >
          <ArrowLeft className="w-5 h-5 text-white/90" />
        </motion.button>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.2,
          }}
          className="w-full max-w-sm"
        >
          <Card 
            ref={cardRef}
            className="w-full parallax-content" 
            style={{
              background: 'rgba(20, 20, 30, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              ...cardParallaxStyle,
            }}>
            <CardContent className="px-5 py-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  delay: 0.4,
                }}
                className="flex flex-col items-center mb-4"
              >
                <img 
                  src={signinLogo} 
                  alt="Driiva" 
                  className="h-10 w-auto mb-2" 
                />
                <p className="text-center text-white/70 text-sm">
                  Sign in to your telematics insurance account
                </p>
                
                {connectionStatus === 'unavailable' && (
                  <div className="mt-3 px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                    Service Unavailable
                  </div>
                )}
                {connectionStatus === 'connected' && (
                  <div className="mt-3 px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Connected
                  </div>
                )}
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">
                    Email or username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => {
                        setEmailOrUsername(e.target.value);
                        setLoginError(null);
                      }}
                      className="signin-input pl-10"
                      placeholder="e.g. you@example.com or driiva1"
                      required
                      autoComplete="username email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError(null);
                      }}
                      className="signin-input pl-10 pr-10"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <motion.div
                    ref={errorRef}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{
                      background: 'rgba(220, 38, 38, 0.15)',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-red-300 text-sm">{loginError}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || connectionStatus === 'unavailable'}
                  className="hero-cta-primary hero-cta-blue w-full"
                  style={{ maxWidth: '100%' }}
                  aria-label="Sign in to account"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </div>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/15" />
                  <span className="text-white/40 text-xs uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/15" />
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || connectionStatus === 'unavailable'}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  aria-label="Continue with Google"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Links */}
                <div className="text-center space-y-2 pt-2">
                  <p className="text-white/50 text-sm">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setLocation("/signup")}
                      className="text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                  <p className="text-white/50 text-sm">
                    Just exploring?{" "}
                    <button
                      type="button"
                      onClick={() => setLocation("/demo")}
                      className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Try demo mode
                    </button>
                  </p>
                </div>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
