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
  Gift,
  Car,
  TrendingUp
} from "lucide-react";
import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../contexts/AuthContext';
import driivaLogo from '@/assets/driiva-logo-CLEAR-FINAL.png';

export default function Home() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Demo data
  const drivingScore = 82;
  const policyNumber = "DRV-2025-000001";
  const premiumAmount = 1840;
  const [showMonthly, setShowMonthly] = useState(false);
  
  // Calculate refund progress based on driving score
  // Formula: combines personal score (70%) with pool safety factor (30%)
  const poolSafetyFactor = 0.85;
  const refundProgress = Math.min(100, Math.round(
    (drivingScore * 0.7) + (poolSafetyFactor * 100 * 0.3)
  ));

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
    setLocation("/");
    logout();
  };

  // Card styling - glassmorphic
  const cardStyle = "backdrop-blur-xl bg-purple-500/10 border border-white/5 rounded-2xl p-6";

  return (
    <PageWrapper>
      <div className="pb-24 text-white space-y-6">
        
        {/* ===== 1. HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          {/* Left - Logo and greeting */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={driivaLogo} 
                alt="Driiva" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-gray-400">{getGreeting()},</p>
              <h1 className="text-lg font-semibold text-white">Driver</h1>
            </div>
          </div>

          {/* Right - Bell and Avatar */}
          <div className="flex items-center gap-3 relative">
            <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
            </button>
            
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
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

        {/* ===== 2. POLICY STATUS CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className={`${cardStyle} max-w-[400px]`}
          style={{ padding: '16px' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Policy Status</h2>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium">Active</span>
          </div>
          
          <p className="text-white font-bold text-lg mb-1">Comp | Driiva Plus+</p>
          <p className="text-gray-400 text-sm mb-4">Policy No: {policyNumber}</p>
          
          <div className="flex items-center gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Start Date: Jul 01, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Renewal Date: Jul 01, 2026</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">
                Premium:{' '}
                <span className="text-white font-semibold">
                  £{showMonthly ? Math.round(premiumAmount / 12).toLocaleString() : premiumAmount.toLocaleString()}
                </span>
                {showMonthly && <span className="text-gray-500 text-xs">/mo</span>}
              </span>
              {/* Compact toggle: Monthly / Annual */}
              <div className="flex items-center gap-1 ml-1">
                <span className={`text-[9px] font-medium transition-colors duration-200 ${!showMonthly ? 'text-white/70' : 'text-white/30'}`}>
                  Yr
                </span>
                <button
                  onClick={() => setShowMonthly(!showMonthly)}
                  className="relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none"
                  style={{ background: showMonthly ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.15)' }}
                  role="switch"
                  aria-checked={showMonthly}
                  aria-label="Toggle monthly or annual premium view"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: showMonthly ? 'translateX(16px)' : 'translateX(2px)' }}
                  />
                </button>
                <span className={`text-[9px] font-medium transition-colors duration-200 ${showMonthly ? 'text-white/70' : 'text-white/30'}`}>
                  Mo
                </span>
              </div>
            </div>
            <button 
              onClick={() => setLocation('/policy')}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              View Details
            </button>
          </div>
        </motion.div>

        {/* ===== 3. DRIVING SCORE CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Driving Score</h2>
            <TrendingUp className="w-5 h-5 text-teal-400" />
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <svg className="w-32 h-32 -rotate-90">
                <circle 
                  cx="64" 
                  cy="64" 
                  r="56" 
                  stroke="url(#gradient)" 
                  strokeWidth="8" 
                  strokeDasharray="351.86" 
                  strokeDashoffset="63.33" 
                  fill="none" 
                />
                <defs>
                  <linearGradient id="gradient">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-white">{drivingScore}</span>
                  <div className="text-xs text-gray-400">/100</div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm text-center">Great driving! Keep it up to maximise your refund.</p>
        </motion.div>

        {/* ===== 4. YOUR TRIPS CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Trips</h2>
            <Car className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {trips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Map className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{trip.from} → {trip.to}</p>
                    <p className="text-gray-400 text-sm">{trip.distance} mi</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-teal-400">{trip.score}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setLocation('/trips')}
            className="w-full mt-4 pt-4 border-t border-white/5 text-sm text-teal-400 hover:text-teal-300 transition-colors text-center"
          >
            View all trips →
          </button>
        </motion.div>

        {/* ===== 5. COMMUNITY POOL CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Community Pool</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-medium">Live</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Pool Safety Factor</span>
            <span className="text-2xl font-bold text-white">85%</span>
          </div>
          
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: '85%' }} />
          </div>
          <p className="text-xs text-gray-400 mb-4">800 of 1000 drivers meet safety thresholds</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Pool</p>
              <p className="text-2xl font-bold text-white">£105,000</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Your Share</p>
              <p className="text-2xl font-bold text-teal-400">£62.50</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              <div className="text-center z-10">
                <p className="text-xs text-emerald-400 font-medium mb-1">Pool Status</p>
                <p className="text-sm font-bold text-white">+5%</p>
                <p className="text-xs text-emerald-400">above target</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== 6. ACHIEVEMENTS & GOALS CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className={cardStyle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Achievements & Goals</h2>
            </div>
            <button 
              onClick={() => setLocation('/achievements')}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-amber-600/30 flex items-center justify-center transition-all"
              aria-label="View Achievements"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        </motion.div>

        {/* ===== 7. REFUND GOALS CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cardStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Refund Goals</h2>
            </div>
            <span className="text-sm text-gray-400">Current: {refundProgress}/100</span>
          </div>
          
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${refundProgress}%` }} />
          </div>
          
          <p className="text-xs text-white/50 mt-2">
            Based on driving score ({drivingScore}) and pool performance ({Math.round(poolSafetyFactor * 100)}%)
          </p>
        </motion.div>

      </div>

      <BottomNav />
    </PageWrapper>
  );
}
