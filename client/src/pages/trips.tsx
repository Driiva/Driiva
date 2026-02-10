import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import { GlassCard } from "@/components/GlassCard";
import { Map, Bell, ChevronDown, Loader2 } from "lucide-react";
import { container, item, timing, microInteractions } from "@/lib/animations";
import { useAuth } from '../contexts/AuthContext';
import { getUserTrips } from '@/lib/firestore';
import type { TripDocument } from '../../../shared/firestore-types';

/** Format a TripLocation label for display */
function locationLabel(loc: TripDocument['startLocation']): string {
  if (loc.placeType && loc.placeType !== 'other') {
    return loc.placeType.charAt(0).toUpperCase() + loc.placeType.slice(1);
  }
  if (loc.address) {
    const first = loc.address.split(',')[0].trim();
    return first.length > 20 ? first.slice(0, 17) + '...' : first;
  }
  return 'Unknown';
}

export default function Trips() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [trips, setTrips] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const policyNumber = "DRV-2025-000001";

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

  // Fetch trips from Firestore
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTrips() {
      try {
        setLoading(true);
        setError(null);
        const result = await getUserTrips({
          userId: user!.id,
          status: 'completed',
          limit: 20,
        });
        if (!cancelled) {
          setTrips(result);
        }
      } catch (err) {
        console.error('[Trips] Failed to fetch trips:', err);
        if (!cancelled) {
          setError('Failed to load trips. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTrips();
    return () => { cancelled = true; };
  }, [user?.id]);

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
              <p className="text-sm text-white/50">{getGreeting()}, {user?.name || 'Driver'}</p>
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

        <h2 className="text-2xl font-bold text-white mb-2">Recent Trips</h2>
        
        <motion.div 
          className="mb-6"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <p className="text-sm text-white/50">
            {loading ? 'Loading...' : `${trips.length} trip${trips.length !== 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <GlassCard className="p-6 text-center">
            <p className="text-red-300 text-sm mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              Retry
            </button>
          </GlassCard>
        )}

        {/* Empty state */}
        {!loading && !error && trips.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Map className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h3 className="text-white/70 font-medium mb-1">No trips yet</h3>
            <p className="text-white/40 text-sm">
              Start recording a trip to see your driving history here.
            </p>
          </GlassCard>
        )}

        {/* Trips list */}
        {!loading && !error && trips.length > 0 && (
          <motion.div 
            className="space-y-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {trips.map((trip, index) => {
              const distanceMiles = (trip.distanceMeters / 1609.34).toFixed(1);
              const durationMinutes = Math.round(trip.durationSeconds / 60);
              const startLabel = locationLabel(trip.startLocation);
              const endLabel = locationLabel(trip.endLocation);
              const tripDate = trip.startedAt?.toDate?.() ?? new Date();

              return (
                <motion.div
                  key={trip.tripId}
                  variants={item}
                  whileHover={microInteractions.hoverShift}
                  whileTap={microInteractions.tap}
                  transition={{ duration: timing.interaction }}
                >
                  <GlassCard className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
                          whileHover={{ rotate: 5, scale: 1.05 }}
                          transition={{ duration: timing.interaction }}
                        >
                          <Map className="w-5 h-5 text-white/70" />
                        </motion.div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">
                            {startLabel} → {endLabel}
                          </h3>
                          <p className="text-xs text-white/50 mt-0.5">
                            {tripDate.toLocaleDateString('en-GB', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })} • {durationMinutes} min
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.div 
                          className={`text-lg font-semibold ${trip.score >= 90 ? 'text-emerald-400' : 'text-white'}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: timing.interaction + index * 0.08, duration: timing.cardEntrance }}
                        >
                          {trip.score}
                        </motion.div>
                        <div className="text-xs text-white/50">{distanceMiles} mi</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-xs text-white/40 mb-1">Braking</div>
                        <div className="text-sm font-medium text-white/80">{trip.events.hardBrakingCount}</div>
                      </div>
                      <div className="text-center border-x border-white/5">
                        <div className="text-xs text-white/40 mb-1">Acceleration</div>
                        <div className="text-sm font-medium text-white/80">{trip.events.hardAccelerationCount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-white/40 mb-1">Speed</div>
                        <div className="text-sm font-medium text-white/80">{trip.events.speedingSeconds}s</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
      
      <BottomNav />
    </PageWrapper>
  );
}
