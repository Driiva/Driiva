import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, User, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DRIBackgroundView from "@/components/DRIBackgroundView";
import signinLogo from "@assets/ii_clear_1769111905071.png";
import { useParallax } from "@/hooks/useParallax";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("driiva1");
  const [password, setPassword] = useState("driiva1");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const { ref: cardRef, style: cardParallaxStyle } = useParallax({ speed: 0.3 });
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[SignIn] handleSubmit called', { username, password: '***' });
    e.preventDefault();
    e.stopPropagation();
    
    // Clear previous errors
    setLoginError(null);
    
    if (!username.trim() || !password.trim()) {
      console.log('[SignIn] Missing credentials');
      setLoginError('Please enter both email and password');
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    console.log('[SignIn] Starting authentication...');
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Check for demo credentials first (bypass Supabase)
      if (username === "driiva1" && password === "driiva1") {
        console.log('[SignIn] Using demo credentials');
        setUser({
          id: "demo-user-8",
          email: "test@driiva.com",
          name: "Test Driver",
        });

        toast({
          title: "Welcome back!",
          description: "Signed in as Test Driver",
        });

        setLocation("/dashboard");
        return;
      }

      // Only try Supabase if properly configured
      if (!isSupabaseConfigured) {
        console.log('[SignIn] Supabase not configured, showing error');
        setLoginError('Invalid credentials. Use demo account: driiva1 / driiva1');
        toast({
          title: "Sign in failed",
          description: "Invalid credentials. Use demo account: driiva1 / driiva1",
          variant: "destructive",
        });
        return;
      }

      // Try Supabase authentication
      console.log('[SignIn] Calling supabase.auth.signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      console.log('[SignIn] Supabase response:', { 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (!error && data.user) {
        console.log('[SignIn] Authentication successful, user:', data.user.id);
        
        // Ensure profile exists - check and create if needed
        try {
          console.log('[SignIn] Checking for existing profile...');
          
          // Check if profile exists (try both id and user_id patterns)
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .or(`id.eq.${data.user.id},user_id.eq.${data.user.id}`)
            .maybeSingle();

          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            console.warn('[SignIn] Profile check error (non-fatal):', profileCheckError);
          }

          if (!existingProfile) {
            // Profile doesn't exist, create it
            console.log('[SignIn] Profile not found, creating...');
            
            // Try with id as primary key (standard Supabase pattern)
            const profileData: any = {
              email: data.user.email || username,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Try id first (most common Supabase pattern)
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                ...profileData,
              });

            if (insertError) {
              // If id fails, try user_id instead
              console.log('[SignIn] Insert with id failed, trying user_id...', insertError.message);
              const { error: insertByUserIdError } = await supabase
                .from('profiles')
                .insert({
                  user_id: data.user.id,
                  ...profileData,
                });

              if (insertByUserIdError) {
                console.error('[SignIn] Failed to create profile with both methods:', insertByUserIdError);
              } else {
                console.log('[SignIn] Profile created successfully with user_id');
              }
            } else {
              console.log('[SignIn] Profile created successfully with id');
            }
          } else {
            console.log('[SignIn] Profile already exists');
          }
        } catch (profileErr) {
          console.error('[SignIn] Profile check/create error:', profileErr);
          // Don't block login if profile creation fails
        }

        // Supabase auth succeeded - populate user data
        setUser({
          id: data.user.id,
          email: data.user.email || username,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        });

        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        });
        console.log('[SignIn] Redirecting to dashboard');
        setLocation("/dashboard");
        return;
      }

      // Supabase failed - show error
      console.error('[SignIn] Authentication failed:', error);
      let errorMessage = error?.message || "Invalid email or password";
      
      // Provide more helpful error messages
      if (error?.message?.includes('Invalid API key') || error?.message?.includes('401')) {
        errorMessage = "Configuration error: Invalid API key. Please check Supabase settings.";
        console.error('[SignIn] API key error - check VITE_SUPABASE_ANON_KEY in client/.env');
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
    } catch (error) {
      console.error('[SignIn] Unexpected error:', error);
      let errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      
      // Check for API key issues in catch block too
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('401')) {
        errorMessage = "Configuration error: Invalid API key. Please check Supabase settings.";
        console.error('[SignIn] API key error - check VITE_SUPABASE_ANON_KEY in client/.env');
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
      <DRIBackgroundView variant="welcome" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 page-transition">
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
        >
          <Card 
            ref={cardRef}
            className="w-full max-w-md mx-auto parallax-content" 
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              ...cardParallaxStyle,
            }}>
            <CardContent className="p-4">
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
                className="signin-header"
              >
                <img 
                  src={signinLogo} 
                  alt="Driiva" 
                  className="signin-logo" 
                />
                <p className="signin-tagline">
                  Sign in to your telematics insurance account
                </p>
              </motion.div>


              {/* Sign In Form */}
              <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90" style={{ 
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                      type="email"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setLoginError(null); // Clear error when user types
                      }}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50"
                      style={{
                        backdropFilter: 'blur(10px)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/90" style={{ 
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError(null); // Clear error when user types
                      }}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-white/50"
                      style={{
                        backdropFilter: 'blur(10px)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Demo Account Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-center p-2 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <p className="text-xs text-white/70" style={{ 
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Demo Account: <span className="font-mono text-white/90">driiva1 / driiva1</span>
                  </p>
                </motion.div>

                {/* Sign In Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    onClick={() => {
                      console.log('[SignIn] Button clicked', { isLoading, hasUsername: !!username, hasPassword: !!password });
                    }}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full font-medium rounded-[28px] transition-all min-h-[56px] shimmer-pulse-btn"
                    style={{
                      background: loginError ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                      color: loginError ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                      fontSize: '18px',
                      fontWeight: 500,
                      height: '56px',
                      border: loginError 
                        ? '1px solid rgba(220, 38, 38, 0.5)' 
                        : '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                    aria-label="Sign in to account"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Signing in...</span>
                      </div>
                    ) : loginError ? (
                      <span>⚠️ Log in failed!</span>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}