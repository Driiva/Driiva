import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Bell, 
  ChevronDown, 
  Map, 
  Shield, 
  Calendar, 
  CreditCard,
  Users,
  Trophy,
  Target,
  FileText,
  Gift
} from "lucide-react";
import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../contexts/AuthContext';

// Circular Progress Component for Driving Score
const CircularProgress = ({ score, size = 120 }: { score: number; size?: number }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-sm text-white/60">/100</span>
      </div>
    </div>
  );
};

// Glassmorphic Card Component
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`backdrop-blur-xl bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

export default function Home() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Demo data
  const drivingScore = 79;
  const policyNumber = "DRV-2025-000001";

  // Only 2 trips as specified
  const trips = [
    { id: 1, from: "Home", to: "Office", score: 92, distance: "12.3" },
    { id: 2, from: "Office", to: "Grocery Store", score: 88, distance: "5.7" },
  ];

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
              <p className="text-sm text-white/50">{getGreeting()}, Driver</p>
            </div>
          </div>

          {/* Right side - Bell and avatar with dropdown */}
          <div className="flex items-center gap-3 relative">
            <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
            </button>
            
            {/* User Avatar with 'd' inside teal circle */}
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

        {/* 1. Policy Status Card - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">Policy Status</h3>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium">Active</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{policyNumber} • £1,650/yr</p>
                </div>
              </div>
              <button 
                onClick={() => setLocation('/policy')}
                className="text-teal-400 hover:text-teal-300 text-sm transition-colors"
              >
                View →
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* 2. Driving Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Driving Score</h2>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Circular Progress on Left */}
              <CircularProgress score={drivingScore} size={100} />
              
              {/* Message on Right */}
              <div className="flex-1">
                <p className="text-sm text-white/70 leading-relaxed">
                  Your driva score is keeping the community pool up. Great show on the road!
                </p>
                {/* Green progress bar */}
                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    style={{ width: `${drivingScore}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* 3. Your Trips Card - Only 2 trips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Trips</h2>
            </div>
            
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Map className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm">
                        {trip.from} → {trip.to}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-teal-400">{trip.score}</div>
                    <div className="text-xs text-white/50">{trip.distance} mi</div>
                  </div>
                </div>
              ))}
            </div>

            {/* View all trips link */}
            <button 
              onClick={() => setLocation('/trips')}
              className="w-full mt-4 pt-4 border-t border-white/5 text-sm text-teal-400 hover:text-teal-300 transition-colors text-center"
            >
              View all trips →
            </button>
          </GlassCard>
        </motion.div>

        {/* 4. Community Pool Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Community Pool</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-emerald-400 text-xs font-medium">Live</span>
              </div>
            </div>

            {/* Pool Safety Factor */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Pool Safety Factor</span>
              <span className="text-2xl font-bold text-white">85%</span>
            </div>
            
            {/* Orange progress bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: '85%' }} />
            </div>
            <p className="text-xs text-white/50 mb-4">800 of 1000 drivers meet safety thresholds</p>

            {/* Two columns - Total Pool and Your Share */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Total Pool</p>
                <p className="text-2xl font-bold text-white">£105,000</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Your Share</p>
                <p className="text-2xl font-bold text-teal-400">£62.50</p>
              </div>
            </div>

            {/* Status banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <p className="text-sm text-emerald-400">📈 Pool performing +5% above target</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* 5. Achievements & Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Achievements & Goals</h2>
              </div>
              <button 
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-1.5 bg-orange-500/20 hover:bg-orange-500/30 px-3 py-2 rounded-lg transition-colors"
              >
                <Gift className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 text-sm font-medium">View Achievements</span>
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* 6. Refund Goals Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Refund Goals</h2>
              </div>
              <span className="text-sm text-white/50">Current: 72/100</span>
            </div>
            
            {/* Progress placeholder */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '72%' }} />
            </div>
            <p className="text-xs text-white/50 mt-2">Keep driving safely to reach your refund goals</p>
          </GlassCard>
        </motion.div>
      </div>

      <BottomNav />
    </PageWrapper>
  );
}
