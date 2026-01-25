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
import { supabase, isSupabaseConfigured, getDemoAccount, DEMO_ACCOUNTS, testSupabaseConnection } from "@/lib/supabase";

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

  // Check Supabase connection status on mount
  useEffect(() => {
    async function checkConnection() {
      if (!isSupabaseConfigured) {
        setConnectionStatus('demo-only');
        return;
      }
      
      const result = await testSupabaseConnection();
      setConnectionStatus(result.connected ? 'connected' : 'demo-only');
    }
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[SignIn] handleSubmit called', { username, password: '***' });
    e.preventDefault();
    e.stopPropagation();
    
    // Clear previous errors
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
      // Check for demo credentials first (bypass Supabase - works offline)
      const demoAccount = getDemoAccount(username, password);
      if (demoAccount) {
        console.log('[SignIn] Using demo account:', demoAccount.name);
        
        // Store demo user data for dashboard
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

      // Only try Supabase if properly configured
      if (!isSupabaseConfigured) {
        console.log('[SignIn] Supabase not configured, showing error');
        setLoginError('Invalid credentials. Try one of the demo accounts below.');
        toast({
          title: "Sign in failed",
          description: "Invalid credentials. Try one of the demo accounts listed below.",
          variant: "destructive",
        });
        return;
      }

      // Try Supabase authentication with timeout
      console.log('[SignIn] Calling supabase.auth.signInWithPassword');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - please try again')), 15000);
      });

      // Race between auth and timeout
      const authPromise = supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      const result = await Promise.race([authPromise, timeoutPromise]) as Awaited<typeof authPromise>;
      const { data, error } = result;

      console.log('[SignIn] Supabase response:', { 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message,
        errorName: (error as any)?.name,
        errorStatus: (error as any)?.status
      });

      if (!error && data.user) {
        console.log('[SignIn] Authentication successful, user:', data.user.id);
        
        // Check if profile exists and get onboarding status
        let onboardingComplete = false;
        let profileExists = false;
        
        try {
          console.log('[SignIn] Checking for existing profile...');
          
          // Check if profile exists and get onboarding status
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id, onboarding_complete')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            console.warn('[SignIn] Profile check error (non-fatal):', profileCheckError);
          }

          if (existingProfile) {
            profileExists = true;
            onboardingComplete = existingProfile.onboarding_complete === true;
            console.log('[SignIn] Profile found, onboarding_complete:', onboardingComplete);
          } else {
            // Profile doesn't exist, create it with onboarding_complete = false
            console.log('[SignIn] Profile not found, creating...');
            
            const profileData = {
              id: data.user.id,
              email: data.user.email || username,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              onboarding_complete: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
              .from('profiles')
              .insert(profileData);

            if (insertError) {
              console.error('[SignIn] Failed to create profile:', insertError);
            } else {
              console.log('[SignIn] Profile created successfully');
              profileExists = true;
              onboardingComplete = false;
            }
          }
        } catch (profileErr) {
          console.error('[SignIn] Profile check/create error:', profileErr);
          // Don't block login if profile check fails, default to dashboard
        }

        // Set user in auth context
        setUser({
          id: data.user.id,
          email: data.user.email || username,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        });

        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        });

        // Route based on onboarding status
        if (onboardingComplete) {
          console.log('[SignIn] Redirecting to dashboard (onboarding complete)');
          setLocation("/dashboard");
        } else {
          console.log('[SignIn] Redirecting to onboarding (onboarding not complete)');
          setLocation("/onboarding");
        }
        return;
      }

      // Supabase failed - show error
      console.error('[SignIn] Authentication failed:', error);
      let errorMessage = error?.message || "Invalid email or password";
      const errorName = (error as any)?.name || '';
      
      // Provide more helpful error messages
      if (errorName === 'AuthRetryableFetchError' || error?.message?.includes('Load failed') || (error as any)?.status === 0) {
        errorMessage = "Network error - try one of the demo accounts below";
        console.error('[SignIn] Network error - Supabase may be unreachable');
      } else if (error?.message?.includes('Invalid API key') || error?.message?.includes('401')) {
        errorMessage = "Configuration error: Invalid API key. Please check Supabase settings.";
        console.error('[SignIn] API key error - check VITE_SUPABASE_ANON_KEY');
      } else if (error?.message?.includes('Invalid login') || error?.message?.includes('Invalid credentials')) {
        errorMessage = "Invalid email or password";
      } else if (error?.message?.includes('Email not confirmed')) {
        errorMessage = "Please confirm your email before signing in";
      }
      
      setLoginError(errorMessage);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } catch (error: any) {
      console.error('[SignIn] Unexpected error:', error);
      let errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      
      // Check for network/fetch errors
      if (error?.name === 'AuthRetryableFetchError' || error?.message?.includes('Load failed') || error?.status === 0) {
        errorMessage = "Network error - please check your connection and try again";
        console.error('[SignIn] Network error - Supabase may be unreachable');
      } else if (error?.message?.includes('timeout')) {
        errorMessage = "Connection timeout - please try again";
      } else if (errorMessage.includes('Invalid API key') || errorMessage.includes('401')) {
        errorMessage = "Configuration error: Invalid API key. Please check Supabase settings.";
        console.error('[SignIn] API key error');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white relative overflow-hidden">

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-12">
        {/* Back Button */}
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
              {/* Signin Header with Logo */}
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
                
                {/* Connection Status Indicator */}
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


              {/* Sign In Form */}
              <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Email or Username Field */}
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

                {/* Password Field */}
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

                {/* Error Banner */}
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

                {/* Demo Accounts Info */}
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

                {/* Sign In Button */}
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