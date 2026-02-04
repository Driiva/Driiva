import { useEffect, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Car, FileText, AlertCircle, TrendingUp, ChevronRight, Bell, ChevronDown, MapPin, Users, Trophy, Target } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from "@/contexts/AuthContext";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import MapLoader from '../components/MapLoader';

const LeafletMap = lazy(() => import('../components/LeafletMap'));

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
}

interface Trip {
  id: number;
  from: string;
  to: string;
  score: number;
  distance: number;
  date: string;
}

interface DemoUser {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  premium_amount?: number;
  premiumAmount?: number;
  personal_score?: number;
  community_score?: number;
  overall_score?: number;
  drivingScore?: number;
  totalMiles?: number;
  projectedRefund?: number;
  trips?: Trip[];
  poolTotal?: number;
  poolShare?: number;
  safetyFactor?: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const policyNumber = "DRV-2025-000001";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    setLocation("/");
  };

  useEffect(() => {
    const demoModeActive = localStorage.getItem('driiva-demo-mode') === 'true';
    if (demoModeActive) {
      const demoUserData = localStorage.getItem('driiva-demo-user');
      if (demoUserData) {
        try {
          const parsedUser = JSON.parse(demoUserData);
          console.log('📊 Demo mode active, loading mock data:', parsedUser);
          setDemoUser(parsedUser);
          setIsDemoMode(true);
          setAuthChecked(true);
          setLoading(false);
        } catch (e) {
          console.error('Failed to parse demo user data:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isDemoMode) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          if (user) {
            setAuthChecked(true);
            setLoading(false);
            return;
          }
          console.log('[Dashboard] No session, redirecting to signin');
          setLocation('/signin');
          return;
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        if (userData) {
          setProfile({
            id: firebaseUser.uid,
            full_name: userData.fullName || null,
            avatar_url: userData.avatarUrl || null,
            onboarding_complete: userData.onboardingComplete === true,
          });
          
          if (!userData.onboardingComplete) {
            console.log('[Dashboard] Onboarding not complete, redirecting to quick-onboarding');
            setLocation('/quick-onboarding');
            return;
          }
        } else {
          console.log('[Dashboard] No profile found, redirecting to quick-onboarding');
          setLocation('/quick-onboarding');
          return;
        }
      } catch (error) {
        console.error('[Dashboard] Auth/profile fetch error:', error);
        if (user) {
          setAuthChecked(true);
          setLoading(false);
          return;
        }
        setLocation('/signin');
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setLocation, user, isDemoMode]);

  const displayName = isDemoMode 
    ? (demoUser?.first_name && demoUser?.last_name 
        ? `${demoUser.first_name} ${demoUser.last_name}` 
        : demoUser?.name || 'Driver')
    : (profile?.full_name || user?.name || 'Driver');

  const drivingScore = isDemoMode ? (demoUser?.drivingScore || demoUser?.overall_score || 82) : 0;
  const premiumAmount = isDemoMode ? (demoUser?.premiumAmount || demoUser?.premium_amount || 1500) : 1500;
  const totalMiles = isDemoMode ? (demoUser?.totalMiles || 0) : 0;
  const trips = isDemoMode ? (demoUser?.trips || []) : [];
  const poolTotal = isDemoMode ? (demoUser?.poolTotal || 105000) : 105000;
  const poolShare = isDemoMode ? (demoUser?.poolShare || 0) : 0;
  const safetyFactor = isDemoMode ? (demoUser?.safetyFactor || 0.85) : 0.85;
  const isNewUser = !isDemoMode && drivingScore === 0;
  
  const calculateSurplus = (score: number, premium: number): number => {
    if (score < 70) return 0;
    const scoreRange = Math.max(0, score - 70);
    const baseRefund = 5;
    const additionalRefund = (scoreRange / 30) * 10;
    const totalPercentage = Math.min(baseRefund + additionalRefund, 15);
    return Math.round((totalPercentage / 100) * premium);
  };

  // Use demo projectedRefund if available, otherwise calculate
  const surplusProjection = isDemoMode && demoUser?.projectedRefund 
    ? demoUser.projectedRefund 
    : calculateSurplus(drivingScore, premiumAmount);

  if (loading || !authChecked) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="pb-24 text-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between mb-6"
        >
          {/* Left side - Logo and greeting */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-700/30 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Driiva" className="w-full h-full object-cover" />
            </div>
            <div style={{ marginTop: '2px' }}>
              <h1 className="text-xl font-bold text-white">Driiva</h1>
              <p className="text-sm text-white/50">{getGreeting()}, {displayName}</p>
              {isDemoMode && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  Demo Mode
                </span>
              )}
            </div>
          </div>

          {/* Right side - Bell and avatar with dropdown */}
          <div className="flex items-center gap-3 relative">
            <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
            </button>
            
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg italic">d</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDropdown(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-12 right-0 w-56 z-50 backdrop-blur-2xl bg-[#1a1a2e]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-4">
                      <p className="text-xs text-white/50 mb-1">Policy No:</p>
                      <p className="text-sm font-medium text-white">{policyNumber}</p>
                    </div>
                    <div className="border-t border-white/10">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="dashboard-glass-card mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Driving Score</h2>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-white">{drivingScore}</span>
            <span className="text-xl text-white/60 mb-1">/100</span>
          </div>
          <p className="text-sm text-white/60 mt-2">
            {drivingScore >= 80 
              ? "Great driving! Keep it up to maximise your refund."
              : drivingScore >= 70 
                ? "Good progress! A few more safe trips will boost your score."
                : "Keep practising safe driving to unlock rewards."}
          </p>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${drivingScore}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="dashboard-glass-card mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">GPS Location</h2>
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
          <Suspense fallback={<MapLoader />}>
            <LeafletMap 
              location={{ lat: 51.5074, lng: -0.1278, label: 'London, UK' }}
              className="border border-white/10"
            />
          </Suspense>
          <p className="text-white/40 text-xs mt-3 text-center">
            Live GPS tracking enabled
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="dashboard-glass-card mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Trips</h2>
            <Car className="w-5 h-5 text-white/60" />
          </div>
          {trips.length > 0 ? (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div key={trip.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{trip.from} → {trip.to}</span>
                    <span className={`text-sm font-bold ${trip.score >= 90 ? 'text-emerald-400' : trip.score >= 80 ? 'text-blue-400' : 'text-amber-400'}`}>
                      {trip.score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{trip.distance} mi</span>
                    <span>{trip.date}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Total Miles</span>
                  <span className="text-white font-semibold">{totalMiles.toLocaleString()} mi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <Car className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 text-sm">Start driving to see your first trip!</p>
              <p className="text-white/40 text-xs mt-1">Your journey data will appear here</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="dashboard-glass-card mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Community Pool</h2>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Total Pool</span>
              <span className="text-white font-semibold">£{poolTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Your Share</span>
              <span className="text-emerald-400 font-bold">£{poolShare.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Safety Factor</span>
              <span className="text-white font-semibold">{Math.round(safetyFactor * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${safetyFactor * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="dashboard-glass-card mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Refund Goals</h2>
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Current Refund</span>
              <span className="text-emerald-400 font-bold text-xl">£{surplusProjection}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Based on {drivingScore}% score</span>
              <span>Max £{Math.round(premiumAmount * 0.15)}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((surplusProjection / (premiumAmount * 0.15)) * 100, 100)}%` }}
              />
            </div>
            {isNewUser && (
              <p className="text-white/50 text-xs text-center mt-2">
                Drive safely to unlock refunds up to 15% of your premium!
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="dashboard-glass-card mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Achievements</h2>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          {isDemoMode ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                <Car className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-white/30 text-2xl">?</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Trophy className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">Complete trips to unlock achievements!</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => setLocation('/profile')}
            className="dashboard-glass-card flex items-center justify-center gap-2 py-4 hover:bg-white/15 transition-colors"
          >
            <FileText className="w-5 h-5 text-white" />
            <span className="font-medium text-white">Profile</span>
          </button>
          
          <button
            onClick={() => setLocation('/settings')}
            className="dashboard-glass-card flex items-center justify-center gap-2 py-4 hover:bg-white/15 transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-white" />
            <span className="font-medium text-white">Settings</span>
          </button>
        </motion.div>
      </div>

      <BottomNav />
    </PageWrapper>
  );
}
