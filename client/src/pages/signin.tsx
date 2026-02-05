import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import signinLogo from "@assets/ii_clear_1769111905071.png";
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "../contexts/AuthContext";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const { ref: cardRef, style: cardParallaxStyle } = useParallax({ speed: 0.3 });
  const { setUser } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setConnectionStatus('unavailable');
    } else {
      setConnectionStatus('connected');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[SignIn] handleSubmit called');
    e.preventDefault();
    e.stopPropagation();
    
    setLoginError(null);
    
    if (!email.trim() || !password.trim()) {
      console.log('[SignIn] Missing credentials');
      setLoginError('Please enter both email and password');
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured) {
      console.log('[SignIn] Firebase not configured');
      setLoginError('Sign-in is currently unavailable. Please try the demo mode to explore the app.');
      toast({
        title: "Service unavailable",
        description: "Sign-in is currently unavailable. Try demo mode instead.",
        variant: "destructive",
      });
      return;
    }

    console.log('[SignIn] Starting Firebase authentication...');
    setIsLoading(true);
    setLoginError(null);
    
    try {
      console.log('[SignIn] Calling Firebase signInWithEmailAndPassword');
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
      });

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });

      // Navigate to home (driver dashboard) - same destination as signup
      if (onboardingComplete) {
        console.log('[SignIn] Redirecting to /home (onboarding complete)');
        setLocation("/home");
      } else {
        console.log('[SignIn] Redirecting to quick-onboarding');
        setLocation("/quick-onboarding");
      }

    } catch (error: any) {
      console.error('[SignIn] Authentication failed:', error);
      let errorMessage = "Invalid email or password";

      if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Check your credentials or create a new account.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
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
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setLoginError(null);
                      }}
                      className="signin-input pl-10"
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
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
