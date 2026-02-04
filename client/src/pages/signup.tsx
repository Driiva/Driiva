import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { AlertCircle, Loader2, Info, Eye, EyeOff, ArrowLeft, User, Mail, Lock } from "lucide-react";
import { timing, easing, microInteractions } from "@/lib/animations";
import { supabase, isSupabaseConfigured, DEMO_CREDENTIALS } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useParallax } from "@/hooks/useParallax";
import { useToast } from "@/hooks/use-toast";
import signinLogo from "@assets/ii_clear_1769111905071.png";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoHint, setShowDemoHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { ref: cardRef, style: cardParallaxStyle } = useParallax({ speed: 0.3 });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured) {
        console.log('[Signup] Supabase not configured, showing demo mode hint');
        setError("Account creation is currently unavailable. Please use the demo account to explore the app.");
        setShowDemoHint(true);
        return;
      }

      // Create timeout for the request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 15000);
      });

      const signupPromise = supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      const result = await Promise.race([signupPromise, timeoutPromise]) as Awaited<typeof signupPromise>;
      const { data, error: signUpError } = result;

      if (signUpError) {
        console.error('[Signup] Error:', signUpError);
        
        // Handle specific error types
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Please sign in instead.");
        } else if (signUpError.message.includes("password")) {
          setError("Password is too weak. Use at least 8 characters with a mix of letters and numbers.");
        } else if (
          signUpError.message.includes("network") || 
          signUpError.message.includes("fetch") ||
          signUpError.message.includes("Load failed") ||
          (signUpError as any)?.name === 'AuthRetryableFetchError'
        ) {
          setError("Network error. The service may be temporarily unavailable. Try the demo account instead.");
          setShowDemoHint(true);
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        console.log('[Signup] Success, creating profile and redirecting to onboarding');
        
        // Create profile for the new user
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email || formData.email,
              full_name: formData.fullName || data.user.email?.split('@')[0] || 'User',
              onboarding_complete: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          
          if (profileError) {
            console.warn('[Signup] Profile creation error (non-fatal):', profileError);
          }
        } catch (profileErr) {
          console.warn('[Signup] Profile creation failed (non-fatal):', profileErr);
        }
        
        // Set user in auth context
        setUser({
          id: data.user.id,
          email: data.user.email || formData.email,
          name: formData.fullName || data.user.email?.split('@')[0] || 'User',
        });
        
        // Show success message briefly then redirect to onboarding
        toast({
          title: "Account created!",
          description: "Welcome to Driiva! Let's get you set up.",
        });
        
        setTimeout(() => {
          setLocation("/quick-onboarding");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      
      if (err.message?.includes('timeout')) {
        setError("Connection timeout. The service may be temporarily unavailable. Try the demo account instead.");
        setShowDemoHint(true);
      } else if (err.message?.includes('Load failed') || err.message?.includes('network')) {
        setError("Network error. Please check your connection or try the demo account.");
        setShowDemoHint(true);
      } else {
        setError("Something went wrong. Please try again or use the demo account.");
        setShowDemoHint(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUser({
      id: "demo-user-8",
      email: "test@driiva.com",
      name: "Test Driver",
    });
    setLocation("/dashboard");
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex flex-col p-6 text-white">
      <div className="flex items-center justify-between mb-8">
        <motion.button
          onClick={handleBack}
          whileTap={microInteractions.tap}
          transition={{ duration: timing.quick / 1000 }}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 
                   flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        >
          <span className="text-white">←</span>
        </motion.button>
        <span className="text-sm text-white/50">Step 1 of 2</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
        className="flex-1"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/60 mb-8">Join thousands of safer drivers</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm">{error}</p>
              {(error.includes("Network") || error.includes("timeout")) && (
                <button
                  onClick={() => {
                    setError(null);
                    setShowDemoHint(true);
                  }}
                  className="text-red-400 text-sm underline mt-1"
                >
                  Try demo mode instead
                </button>
              )}
            </div>
          </motion.div>
        )}

        {showDemoHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-300 text-sm font-medium">Try Demo Mode</p>
                <p className="text-emerald-300/80 text-sm mt-1">
                  Explore Driiva with our demo account: <span className="font-mono">{DEMO_CREDENTIALS.username} / {DEMO_CREDENTIALS.password}</span>
                </p>
                <button
                  onClick={handleDemoLogin}
                  className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Enter Demo Mode
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="signin-input pl-10"
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="signin-input pl-10"
                placeholder="you@example.com"
                required
                disabled={isLoading}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="signin-input pl-10 pr-10"
                placeholder="Minimum 8 characters"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/40 text-xs mt-1">At least 8 characters</p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="signin-input pl-10 pr-10"
                placeholder="Re-enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={!isLoading ? microInteractions.tap : undefined}
            transition={{ duration: timing.quick / 1000 }}
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 
                     text-white font-semibold py-4 rounded-xl transition-colors mt-6 min-h-[56px]
                     flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          Already have an account?{" "}
          <button
            onClick={() => setLocation("/signin")}
            className="text-emerald-400 hover:underline"
          >
            Sign in
          </button>
        </p>

        <p className="text-center text-sm text-white/50 mt-4">
          By continuing, you agree to our{" "}
          <a href="#" className="text-emerald-400 hover:underline">Terms</a>
          {" "}and{" "}
          <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
}
