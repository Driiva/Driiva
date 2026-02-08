import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { AlertCircle, Loader2, Eye, EyeOff, ArrowLeft, User, Mail, Lock } from "lucide-react";
import { timing, easing, microInteractions } from "@/lib/animations";
import { auth, db, isFirebaseConfigured } from "../lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useParallax } from "@/hooks/useParallax";
import { useToast } from "@/hooks/use-toast";

/**
 * SIGNUP PAGE
 * -----------
 * This page handles REAL Firebase account creation only.
 * NO demo mode - demo is accessed via /demo route.
 * On success, navigates to /home (driver dashboard).
 */

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
      // Check if Firebase is configured
      if (!isFirebaseConfigured) {
        console.log('[Signup] Firebase not configured');
        setError("Account creation is currently unavailable. Please try the demo mode to explore the app.");
        return;
      }

      if (!auth) {
        setError("Firebase Auth is not initialized. Check your environment configuration.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.fullName,
      });

      // Create user document with onboarding NOT completed
      // User will be redirected to quick-onboarding flow
      if (!db) {
        console.error('[Signup] Firestore not initialized');
        setError("Database is not available. Please try again later.");
        return;
      }

      const now = new Date();
      const nowISO = now.toISOString();

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        fullName: formData.fullName,
        onboardingCompleted: false, // New users must complete onboarding
        onboardingComplete: false,  // Keep both fields for compatibility
        createdAt: nowISO,
        updatedAt: nowISO,
      });

      // Auto-create default policy with correct start/end dates
      const policyStart = new Date(now);
      const policyEnd = new Date(now);
      policyEnd.setFullYear(policyEnd.getFullYear() + 1);

      const policyNumber = `DRV-${now.getFullYear()}-${user.uid.slice(0, 6).toUpperCase()}`;

      try {
        await setDoc(doc(db, 'policies', `${user.uid}-policy`), {
          policyId: `${user.uid}-policy`,
          userId: user.uid,
          policyNumber,
          status: 'active',
          coverageType: 'comprehensive_plus',
          coverageDetails: {
            liabilityLimitCents: 2000000000, // £20M
            collisionDeductibleCents: 25000,  // £250
            comprehensiveDeductibleCents: 35000, // £350
            includesRoadside: true,
            includesRental: true,
          },
          basePremiumCents: 184000, // £1,840 default
          currentPremiumCents: 184000,
          discountPercentage: 0,
          effectiveDate: policyStart.toISOString(),
          expirationDate: policyEnd.toISOString(),
          renewalDate: policyEnd.toISOString(),
          vehicle: {
            vin: null,
            make: '',
            model: '',
            year: now.getFullYear(),
          },
          createdAt: nowISO,
          updatedAt: nowISO,
          created_by: 'client-signup',
        });
        console.log('[Signup] Policy auto-created for user:', user.uid);
      } catch (policyErr) {
        // Non-blocking — user can still proceed without policy
        console.error('[Signup] Policy auto-create failed:', policyErr);
      }

      console.log('[Signup] Success, user created:', user.uid);

      // Set user in context with onboarding NOT complete
      setUser({
        id: user.uid,
        email: user.email || formData.email,
        name: formData.fullName,
        onboardingComplete: false,
      });

      toast({
        title: "Account created!",
        description: "Let's get you set up.",
      });

      // Navigate to quick onboarding immediately after successful signup
      setLocation("/quick-onboarding");

    } catch (err: any) {
      console.error("Signup error:", err);

      if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key' ||
          err.code === 'auth/api-key-not-valid-please-pass-a-valid-api-key' ||
          err.message?.includes('api-key-not-valid')) {
        console.error('[Signup] API key rejected by Firebase. Check .env VITE_FIREBASE_API_KEY and Google Cloud API key restrictions.');
        setError(
          "Service configuration error. The Firebase API key is invalid or restricted. " +
          "Please contact the developer or check the API key in Google Cloud Console."
        );
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Use at least 8 characters with a mix of letters and numbers.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address format.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex flex-col p-6 text-white relative z-10">
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
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 
                         rounded-xl focus:border-orange-400/50 focus:ring-orange-400/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 
                         rounded-xl focus:border-orange-400/50 focus:ring-orange-400/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-12 pr-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 
                         rounded-xl focus:border-orange-400/50 focus:ring-orange-400/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-12 pr-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 
                         rounded-xl focus:border-orange-400/50 focus:ring-orange-400/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileTap={microInteractions.tap}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 
                     hover:from-orange-600 hover:to-orange-700 text-white font-semibold 
                     rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed mt-6"
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

        <div className="mt-8 text-center space-y-2">
          <p className="text-white/50 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/signin")}
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              Sign in
            </button>
          </p>
          <p className="text-white/50 text-sm">
            Just exploring?{" "}
            <button
              onClick={() => setLocation("/demo")}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Try demo mode
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
