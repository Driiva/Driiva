/**
 * QUICK ONBOARDING PAGE
 * =====================
 * A 3-step onboarding flow that must be completed before accessing the dashboard.
 * 
 * Steps:
 *   1. Welcome - Explain what Driiva does
 *   2. Location - Request GPS permission and test a single read
 *   3. Confirm - User acknowledges "drive to earn rewards" concept
 * 
 * On completion, sets `onboardingCompleted: true` in Firestore.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  MapPin, 
  Car, 
  ChevronRight, 
  Check, 
  Loader2, 
  Shield,
  Wallet,
  Users,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import driivaLogo from '@/assets/driiva-logo-CLEAR-FINAL.png';

const TOTAL_STEPS = 3;

interface GpsTestResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
}

export default function QuickOnboarding() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  
  // GPS state
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [gpsResult, setGpsResult] = useState<GpsTestResult | null>(null);

  // Use AuthContext instead of a separate onAuthStateChanged listener.
  // AuthContext already tracks the user and their onboarding status,
  // so we avoid a redundant Firebase + Firestore round-trip.
  useEffect(() => {
    if (authLoading) return; // Wait for AuthContext to resolve

    // Check demo mode
    const isDemoMode = localStorage.getItem('driiva-demo-mode') === 'true';
    if (isDemoMode) {
      setLocation('/dashboard');
      return;
    }

    if (!user) {
      // Not logged in, redirect to signin
      setLocation('/signin');
      return;
    }

    // If user already completed onboarding, skip to dashboard
    if (user.onboardingComplete) {
      setLocation('/dashboard');
      return;
    }
    // Otherwise, user needs onboarding — let them through
  }, [user, authLoading, setLocation]);

  /**
   * Test GPS by requesting a single position read
   */
  const testGpsPermission = async () => {
    setGpsStatus('testing');
    setGpsResult(null);

    try {
      // First check if geolocation is available
      if (!navigator.geolocation) {
        setGpsStatus('error');
        setGpsResult({ success: false, error: 'GPS not available on this device' });
        return;
      }

      // Request a single position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      });

      setGpsStatus('success');
      setGpsResult({
        success: true,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
      });
    } catch (error: any) {
      setGpsStatus('error');
      
      let errorMessage = 'Could not get your location';
      if (error.code === 1) {
        errorMessage = 'Location permission denied. Please enable it in your browser settings.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your device settings.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      
      setGpsResult({ success: false, error: errorMessage });
    }
  };

  /**
   * Complete onboarding and navigate to dashboard
   */
  const handleComplete = async () => {
    if (!confirmed) return;

    setIsLoading(true);

    // 1. Update AuthContext FIRST so ProtectedRoute won't bounce back
    if (user) {
      setUser({
        ...user,
        onboardingComplete: true,
      });
    }

    // 2. Navigate immediately — don't block on Firestore write
    setLocation('/dashboard');

    // 3. Persist to Firestore in background
    try {
      const firebaseUser = auth?.currentUser;
      if (firebaseUser && isFirebaseConfigured && db) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Use setDoc with merge: true — works whether the doc exists or not,
        // and avoids the extra getDoc round-trip.
        await setDoc(userDocRef, {
          onboardingCompleted: true,
          onboardingComplete: true, // Keep both for compatibility
          gpsPermissionGranted: gpsStatus === 'success',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.error('[QuickOnboarding] Failed to update onboarding status:', err);
      // Non-blocking — user is already on the dashboard
    }
  };

  /**
   * Handle navigation between steps
   */
  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Show loading only while AuthContext is resolving (typically instant after signup)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= currentStep 
                    ? 'bg-emerald-500 w-10' 
                    : 'bg-white/20 w-6'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-white/50">Step {currentStep} of {TOTAL_STEPS}</span>
        </div>

        {/* Step content */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* STEP 1: Welcome / Explain Driiva */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Logo */}
                <div className="w-48 h-20 mx-auto mb-6 overflow-hidden">
                  <img 
                    src={driivaLogo} 
                    alt="Driiva" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">Welcome to Driiva</h1>
                <p className="text-white/60 mb-8 max-w-sm mx-auto">
                  The insurance app that rewards safe driving. Here's how it works:
                </p>

                {/* Feature cards */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl text-left">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">AI-Powered Safety</h3>
                      <p className="text-white/50 text-sm">Track trips and get a real-time safety score</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl text-left">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Earn Refunds</h3>
                      <p className="text-white/50 text-sm">Safe drivers get up to 15% back at renewal</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl text-left">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Community Pool</h3>
                      <p className="text-white/50 text-sm">Join thousands of drivers sharing rewards</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: GPS Permission Test */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-emerald-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">Enable Location Access</h1>
                <p className="text-white/60 mb-8 max-w-sm mx-auto">
                  Driiva uses GPS to track your trips and calculate your safety score. 
                  Your location data is encrypted and never sold.
                </p>

                {/* GPS Test Result */}
                {gpsStatus === 'idle' && (
                  <button
                    onClick={testGpsPermission}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
                  >
                    <Navigation className="w-5 h-5" />
                    Test Location Access
                  </button>
                )}

                {gpsStatus === 'testing' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                    <p className="text-white/60">Testing GPS access...</p>
                  </div>
                )}

                {gpsStatus === 'success' && gpsResult && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-4">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
                      <Check className="w-6 h-6" />
                      <span className="font-medium">GPS Working!</span>
                    </div>
                    <p className="text-white/50 text-sm">
                      Location detected with {gpsResult.accuracy}m accuracy
                    </p>
                  </div>
                )}

                {gpsStatus === 'error' && gpsResult && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-4">
                    <div className="flex items-center justify-center gap-2 text-amber-400 mb-3">
                      <AlertCircle className="w-6 h-6" />
                      <span className="font-medium">GPS Issue</span>
                    </div>
                    <p className="text-white/60 text-sm mb-4">{gpsResult.error}</p>
                    <button
                      onClick={testGpsPermission}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                <p className="text-white/40 text-xs mb-6">
                  You can continue without GPS, but trip tracking will be limited.
                </p>

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-white/10 hover:bg-white/15 text-white font-semibold py-4 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className={`flex-1 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      gpsStatus === 'success'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-white/10 hover:bg-white/15 text-white/80'
                    }`}
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Confirm Understanding */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Car className="w-12 h-12 text-purple-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-3">Drive to Earn Rewards</h1>
                <p className="text-white/60 mb-6 max-w-sm mx-auto">
                  Every trip you take builds your safety score. The safer you drive, the more you earn.
                </p>

                {/* How it works summary */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-6 text-left">
                  <h3 className="text-white font-medium mb-4">Here's what happens:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-xs font-bold">1</span>
                      </div>
                      <p className="text-white/70 text-sm">
                        <strong className="text-white">Start a trip</strong> – We track speed, braking, and acceleration
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-xs font-bold">2</span>
                      </div>
                      <p className="text-white/70 text-sm">
                        <strong className="text-white">Get scored</strong> – Each trip adds to your overall safety score
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-400 text-xs font-bold">3</span>
                      </div>
                      <p className="text-white/70 text-sm">
                        <strong className="text-white">Earn refunds</strong> – Higher scores mean bigger refunds at renewal
                      </p>
                    </li>
                  </ul>
                </div>

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer mb-6 text-left bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      confirmed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-white/30 bg-transparent hover:border-white/50'
                    }`}>
                      {confirmed && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <span className="text-white/80 text-sm">
                    I understand that Driiva tracks my driving to calculate my safety score, and that safe driving earns me refunds from the community pool.
                  </span>
                </label>

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-white/10 hover:bg-white/15 text-white font-semibold py-4 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!confirmed || isLoading}
                    className={`flex-1 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      confirmed && !isLoading
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Let's Go!
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
