import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Car, TrendingUp, Users, Trophy, Play, Loader2 } from "lucide-react";

/**
 * DEMO PAGE
 * ---------
 * This page activates demo mode and navigates to the dashboard.
 * It does NOT call Firebase Auth at all - completely isolated demo experience.
 */

// Demo user data - completely separate from real Firebase users
const DEMO_USER_DATA = {
  id: 'demo-user-1',
  email: 'demo@driiva.co.uk',
  name: 'Demo Driver',
  drivingScore: 82,
  premiumAmount: 1500,
  totalMiles: 1247,
  projectedRefund: 62.50,
  trips: [
    { id: 1, from: 'Home', to: 'Office', score: 92, distance: 12.4, date: '2026-02-04' },
    { id: 2, from: 'Office', to: 'Grocery', score: 88, distance: 3.2, date: '2026-02-03' }
  ],
  poolTotal: 105000,
  poolShare: 62.50,
  safetyFactor: 0.85,
};

export default function Demo() {
  const [, setLocation] = useLocation();
  const [isEntering, setIsEntering] = useState(false);

  /**
   * Enter demo mode - NO Firebase calls here!
   * Sets localStorage flags and navigates to dashboard.
   */
  const enterDemoMode = () => {
    setIsEntering(true);
    
    // Set demo mode flags in localStorage
    localStorage.setItem('driiva-demo-mode', 'true');
    localStorage.setItem('driiva-demo-user', JSON.stringify(DEMO_USER_DATA));
    
    // Small delay for UX feedback then navigate to dashboard
    setTimeout(() => {
      setLocation('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <button
            onClick={() => setLocation('/')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Try Driiva Demo</h1>
        </motion.div>

        {/* Demo Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Demo Notice */}
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-300 text-sm text-center">
              Demo mode uses sample data - no account required
            </p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Experience Smart Driving</h2>
            <p className="text-gray-300">See how Driiva tracks and rewards your driving</p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Trip Tracking</h3>
                  <p className="text-sm text-gray-300">Real-time monitoring of your driving habits</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Driving Score</h3>
                  <p className="text-sm text-gray-300">Get scored on safety and efficiency</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Community Pool</h3>
                  <p className="text-sm text-gray-300">Share rewards with safe drivers</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Earn Rewards</h3>
                  <p className="text-sm text-gray-300">Get refunds for safe driving</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3 pt-6"
          >
            <button
              onClick={enterDemoMode}
              disabled={isEntering}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isEntering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entering Demo...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Enter Demo Mode
                </>
              )}
            </button>
            <button
              onClick={() => setLocation('/signup')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Create Real Account
            </button>
            <button
              onClick={() => setLocation('/')}
              className="w-full bg-white/10 backdrop-blur-lg text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
            >
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
