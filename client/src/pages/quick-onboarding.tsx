import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { MapPin, Smartphone, Car, ChevronRight, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TOTAL_STEPS = 3;

export default function QuickOnboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [gpsGranted, setGpsGranted] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestGpsPermission = async () => {
    setGpsError(null);
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        setGpsGranted(true);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        () => setGpsGranted(true),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError('GPS permission denied. You can enable it later in settings.');
          } else {
            setGpsError('Could not get location. Please try again.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch {
      setGpsError('GPS not available on this device.');
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Failed to update onboarding status:', err);
    }
    setIsLoading(false);
    setLocation('/dashboard');
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Failed to update onboarding status:', err);
    }
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col relative">
      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`w-10 h-1.5 rounded-full transition-colors ${
                  i + 1 <= currentStep ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Skip for now
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Enable GPS Tracking</h1>
                <p className="text-white/60 mb-8 max-w-sm mx-auto">
                  Allow Driiva to track your driving to calculate your safety score and earn refunds.
                </p>

                {gpsGranted ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6">
                    <Check className="w-5 h-5" />
                    <span>GPS enabled successfully!</span>
                  </div>
                ) : gpsError ? (
                  <div className="mb-6">
                    <p className="text-amber-400 text-sm mb-4">{gpsError}</p>
                    <button
                      onClick={requestGpsPermission}
                      className="text-emerald-400 underline text-sm"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={requestGpsPermission}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl transition-colors mb-4"
                  >
                    Enable GPS Access
                  </button>
                )}

                <button
                  onClick={() => setCurrentStep(2)}
                  className={`w-full font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    gpsGranted
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-white/10 hover:bg-white/15 text-white/80'
                  }`}
                >
                  {gpsGranted ? 'Continue' : 'Continue without GPS'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Install Driiva App</h1>
                <p className="text-white/60 mb-8 max-w-sm mx-auto">
                  For the best experience, add Driiva to your home screen for automatic trip tracking.
                </p>

                <div className="space-y-3 mb-8">
                  <button
                    onClick={() => {
                      alert('Add to Home Screen instructions: Tap the share button and select "Add to Home Screen"');
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl transition-colors"
                  >
                    Add to Home Screen
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-4 rounded-xl transition-colors"
                  >
                    Continue in Browser
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Car className="w-10 h-10 text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">How Driiva Works</h1>
                <p className="text-white/60 mb-6 max-w-sm mx-auto">
                  Track your trips to earn refunds. Safe driving rewards you!
                </p>

                <div className="space-y-4 mb-8 text-left max-w-sm mx-auto">
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Drive Safely</h3>
                      <p className="text-white/50 text-sm">Your trips are automatically tracked and scored</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Build Your Score</h3>
                      <p className="text-white/50 text-sm">Good braking, acceleration, and speed improve your score</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Earn Refunds</h3>
                      <p className="text-white/50 text-sm">Up to 15% back at renewal from the community pool</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Start Driving
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
