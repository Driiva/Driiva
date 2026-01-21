import { motion } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { GradientMesh } from "@/components/GradientMesh";
import { GlassCard } from "@/components/GlassCard";
import { Map } from "lucide-react";
import { pageVariants, container, item, timing, easing, microInteractions } from "@/lib/animations";

interface Trip {
  id: number;
  userId: number;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  distance: string;
  duration: number;
  score: number;
  hardBrakingEvents: number;
  harshAcceleration: number;
  speedViolations: number;
}

export default function Trips() {
  const trips: Trip[] = [
    {
      id: 1,
      userId: 8,
      startLocation: "Home",
      endLocation: "Office",
      startTime: "2025-07-28T08:30:00Z",
      endTime: "2025-07-28T09:15:00Z",
      distance: "12.3",
      duration: 45,
      score: 92,
      hardBrakingEvents: 0,
      harshAcceleration: 1,
      speedViolations: 0
    },
    {
      id: 2,
      userId: 8,
      startLocation: "Office",
      endLocation: "Grocery Store",
      startTime: "2025-07-27T17:45:00Z",
      endTime: "2025-07-27T18:10:00Z",
      distance: "5.7",
      duration: 25,
      score: 88,
      hardBrakingEvents: 1,
      harshAcceleration: 0,
      speedViolations: 0
    },
    {
      id: 3,
      userId: 8,
      startLocation: "Grocery Store",
      endLocation: "Home",
      startTime: "2025-07-27T18:30:00Z",
      endTime: "2025-07-27T18:55:00Z",
      distance: "6.2",
      duration: 25,
      score: 95,
      hardBrakingEvents: 0,
      harshAcceleration: 0,
      speedViolations: 0
    },
    {
      id: 4,
      userId: 8,
      startLocation: "Home",
      endLocation: "Gym",
      startTime: "2025-07-26T07:00:00Z",
      endTime: "2025-07-26T07:20:00Z",
      distance: "3.8",
      duration: 20,
      score: 98,
      hardBrakingEvents: 0,
      harshAcceleration: 0,
      speedViolations: 0
    }
  ];

  const user = {
    firstName: "Test",
    lastName: "Driver",
    username: "driiva1",
    email: "test@driiva.com",
    premiumAmount: "1840.00"
  };

  return (
    <motion.div 
      className="min-h-screen text-white"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: timing.pageTransition, ease: easing.button }}
    >
      <GradientMesh />
      <DashboardHeader user={user} />
      
      <main className="px-4 pb-28">
        <motion.div 
          className="pt-6 mb-6"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-xl font-semibold text-white mb-1">Recent Trips</h2>
          <p className="text-sm text-white/50">{trips.length} trips this month</p>
        </motion.div>
        
        <motion.div 
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {trips.map((trip, index) => (
            <motion.div
              key={trip.id}
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
                        {trip.startLocation} → {trip.endLocation}
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">
                        {new Date(trip.startTime).toLocaleDateString('en-GB', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })} • {trip.duration} min
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
                    <div className="text-xs text-white/50">{trip.distance} mi</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-white/40 mb-1">Braking</div>
                    <div className="text-sm font-medium text-white/80">{trip.hardBrakingEvents}</div>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <div className="text-xs text-white/40 mb-1">Acceleration</div>
                    <div className="text-sm font-medium text-white/80">{trip.harshAcceleration}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/40 mb-1">Speed</div>
                    <div className="text-sm font-medium text-white/80">{trip.speedViolations}</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </main>
      
      <BottomNavigation />
    </motion.div>
  );
}
