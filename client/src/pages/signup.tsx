import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { AlertCircle, Loader2 } from "lucide-react";
import { timing, easing, microInteractions } from "@/lib/animations";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Please sign in instead.");
        } else if (signUpError.message.includes("password")) {
          setError("Password is too weak. Use at least 8 characters with a mix of letters and numbers.");
        } else if (signUpError.message.includes("network") || signUpError.message.includes("fetch")) {
          setError("Network error. Please check your connection and try again.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        setLocation("/onboarding");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col p-6">
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
              {error.includes("Network") && (
                <button
                  onClick={handleSubmit}
                  className="text-red-400 text-sm underline mt-1"
                >
                  Try again
                </button>
              )}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       px-4 py-3 text-white placeholder-white/40 
                       focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       px-4 py-3 text-white placeholder-white/40 
                       focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
              placeholder="Minimum 8 characters"
              required
              disabled={isLoading}
            />
            <p className="text-white/40 text-xs mt-1">At least 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       px-4 py-3 text-white placeholder-white/40 
                       focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
              placeholder="Re-enter your password"
              required
              disabled={isLoading}
            />
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
