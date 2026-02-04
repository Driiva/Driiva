import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, User, Lock, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import signinLogo from "@assets/ii_clear_1769111905071.png";
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "../contexts/AuthContext";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DEMO_ACCOUNTS: Record<string, { id: string; email: string; name: string; password: string; drivingScore: number; }> = {
  'driiva1': { id: 'demo-user-1', email: 'demo@driiva.co.uk', name: 'Demo Driver', password: 'driiva1', drivingScore: 82 },
  'alex': { id: 'demo-user-2', email: 'alex@driiva.co.uk', name: 'Alex Thompson', password: 'alex123', drivingScore: 92 },
  'sarah': { id: 'demo-user-3', email: 'sarah@driiva.co.uk', name: 'Sarah Williams', password: 'sarah123', drivingScore: 78 },
  'james': { id: 'demo-user-4', email: 'james@driiva.co.uk', name: 'James Miller', password: 'james123', drivingScore: 88 },
  'test': { id: 'demo-user-5', email: 'test@driiva.co.uk', name: 'Test User', password: 'test123', drivingScore: 72 },
};

function getDemoAccount(username: string, password: string) {
  const account = DEMO_ACCOUNTS[username.toLowerCase()];
  if (account && account.password === password) {
    return account;
  }
  return null;
}

export default function SignIn() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'demo-only'>('checking');
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("driiva1");
  const [password, setPassword] = useState("driiva1");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const { ref: cardRef, style: cardParallaxStyle } = useParallax({ speed: 0.3 });
  const { setUser } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setConnectionStatus('demo-only');
    } else {
      setConnectionStatus('connected');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[SignIn] handleSubmit called', { username, password: '***' });
    e.preventDefault();
    e.stopPropagation();
    
    setLoginError(null);
    
    if (!username.trim() || !password.trim()) {
      console.log('[SignIn] Missing credentials');
      setLoginError('Please enter both email/username and password');
      toast({
        title: "Missing credentials",
        description: "Please enter both email/username and password",
        variant: "destructive",
      });
      return;
    }

    console.log('[SignIn] Starting authentication...');
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const demoAccount = getDemoAccount(username, password);
      if (demoAccount) {
        console.log('[SignIn] Using demo account:', demoAccount.name);
        
        localStorage.setItem('driiva-demo-mode', 'true');
        localStorage.setItem('driiva-demo-user', JSON.stringify(demoAccount));
        
        setUser({
          id: demoAccount.id,
          email: demoAccount.email,
          name: demoAccount.name,
          onboardingComplete: true,
        });

        toast({
          title: "Welcome back!",
          description: `Signed in as ${demoAccount.name}`,
        });

        setLocation("/dashboard");
        return;
      }

      if (!isFirebaseConfigured) {
        console.log('[SignIn] Firebase not configured, showing error');
        setLoginError('Invalid credentials. Try one of the demo accounts below.');
        toast({
          title: "Sign in failed",
          description: "Invalid credentials. Try one of the demo accounts listed below.",
          variant: "destructive",
        });
        return;
      }

      console.log('[SignIn] Calling Firebase signInWithEmailAndPassword');
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
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
            email: user.email || username,
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
        email: user.email || username,
        name: user.displayName || user.email?.split('@')[0] || 'User',
      });

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });

      if (onboardingComplete) {
        console.log('[SignIn] Redirecting to dashboard (onboarding complete)');
        setLocation("/dashboard");
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
        errorMessage = "Invalid email or password";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error - try one of the demo accounts below";
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
                
                {connectionStatus === 'demo-only' && (
                  <div className="mt-3 px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Demo Mode Only
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
                    Email or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setLoginError(null);
                      }}
                      className="signin-input pl-10"
                      placeholder="Email or Username"
                      required
                      autoComplete="username"
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
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{
                      background: 'rgba(220, 38, 38, 0.15)',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    <span className="text-red-400 text-sm flex-shrink-0">⚠</span>
                    <span className="text-red-300 text-sm">{loginError}</span>
                  </motion.div>
                )}

                <div 
                  className="px-3 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <p className="text-xs text-white/60 mb-1.5 text-center">
                    Beta Demo Accounts:
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-white/50">
                    <div>driiva1 / driiva1</div>
                    <div>alex / alex123</div>
                    <div>sarah / sarah123</div>
                    <div>james / james123</div>
                    <div className="col-span-2 text-center">test / test123</div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
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
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
