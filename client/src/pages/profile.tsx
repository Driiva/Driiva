import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import PolicyDownload from "@/components/PolicyDownload";
import DeleteAccount from "@/components/DeleteAccount";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { timing, easing } from "@/lib/animations";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm font-medium text-white text-right">{value}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}

function PolicyFeature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-white/50">{description}</p>
      </div>
    </div>
  );
}

function CoverageTypeSection({ currentScore }: { currentScore: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const projectedRefund = ((currentScore - 70) / 30 * 10 + 5) / 100 * 1840;

  return (
    <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors min-h-[56px]"
      >
        <span className="text-sm text-white/60">Coverage Type</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-medium">Comprehensive Plus</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-emerald-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easing.smoothDecel }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/[0.08]">
              <p className="text-sm text-white/50 mb-4">Full coverage with extras</p>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                  What's Included
                </h4>
                
                <PolicyFeature icon="✅" title="Collision Coverage" description="Damage to your vehicle from accidents" />
                <PolicyFeature icon="✅" title="Comprehensive Coverage" description="Theft, vandalism, weather damage" />
                <PolicyFeature icon="✅" title="Third-Party Liability" description="Up to £20M coverage for injuries & property" />
                <PolicyFeature icon="✅" title="Personal Injury Protection" description="Medical expenses for you and passengers" />
                <PolicyFeature icon="✅" title="Roadside Assistance" description="24/7 emergency breakdown service" />
                <PolicyFeature icon="✅" title="Courtesy Car" description="Replacement vehicle during repairs" />
                <PolicyFeature icon="✅" title="Legal Expenses" description="Up to £100,000 legal cover" />
              </div>

              <div className="mt-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60">Voluntary Excess</span>
                  <span className="text-sm font-medium text-white">£250</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Compulsory Excess</span>
                  <span className="text-sm font-medium text-white">£350</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/80">Total Excess</span>
                  <span className="text-base font-semibold text-emerald-400">£600</span>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-base">ℹ️</span>
                <div>
                  <p className="text-xs text-emerald-300 font-medium mb-1">Policy Benefits</p>
                  <p className="text-xs text-emerald-200/70">
                    Your safe driving score of {currentScore} could reduce your premium by up to £{projectedRefund.toFixed(2)} at renewal.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Profile() {
  const [locationTracking, setLocationTracking] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  const userData = {
    id: 8,
    username: "driiva1",
    firstName: "Test",
    lastName: "Driver",
    email: "test@driiva.com",
    premiumAmount: "1840.00",
    phoneNumber: "+44 7700 123456"
  };

  const profileData = {
    currentScore: 72,
    totalTrips: 28,
    totalMiles: 1168.50,
    hardBrakingScore: 3,
    accelerationScore: 2,
    speedAdherenceScore: 2,
    nightDrivingScore: 5
  };

  return (
    <PageWrapper>
      <div className="pb-24 text-white space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Profile</h1>
          <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
            <span className="text-xs font-medium text-emerald-400">Verified</span>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500/60"
              style={{
                background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 70%, transparent 100%)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.1)'
              }}
            >
              <span className="text-2xl font-semibold text-white/80">
                {userData.firstName[0]}{userData.lastName[0]}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              {userData.firstName} {userData.lastName}
            </h2>
            <p className="text-sm text-white/50">@{userData.username}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={profileData.currentScore} label="Current Score" />
            <StatCard value={profileData.totalTrips} label="Total Trips" />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span>📋</span>
            Account Details
          </h3>
          
          <div className="space-y-1">
            <DetailRow label="Email" value={userData.email} />
            <DetailRow label="Phone" value={userData.phoneNumber} />
            <DetailRow label="Premium" value={`£${userData.premiumAmount}`} />
            <DetailRow label="Policy Number" value="DRV-2025-000001" />
            <DetailRow label="Policy Start" value="July 1, 2025" />
          </div>
        </div>

        <CoverageTypeSection currentScore={profileData.currentScore} />

        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span>🚗</span>
            Driving Statistics
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={profileData.totalMiles.toFixed(1)} label="Miles This Month" />
            <StatCard value={profileData.hardBrakingScore} label={profileData.hardBrakingScore === 1 ? 'Harsh Braking Event' : 'Harsh Braking Events'} />
            <StatCard value={profileData.speedAdherenceScore} label={profileData.speedAdherenceScore === 1 ? 'Speed Violation' : 'Speed Violations'} />
            <StatCard value={profileData.nightDrivingScore} label={profileData.nightDrivingScore === 1 ? 'Night Trip' : 'Night Trips'} />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span>⚙️</span>
            Preferences
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="text-sm font-medium text-white">Location Tracking</div>
                <div className="text-xs text-white/50">Required for trip recording</div>
              </div>
              <motion.button
                onClick={() => setLocationTracking(!locationTracking)}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${
                  locationTracking ? 'bg-emerald-500' : 'bg-white/20'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ left: locationTracking ? 24 : 4 }}
                  transition={{ duration: timing.interaction / 1000, ease: easing.button }}
                />
              </motion.button>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="text-sm font-medium text-white">Push Notifications</div>
                <div className="text-xs text-white/50">Trip summaries and alerts</div>
              </div>
              <motion.button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${
                  pushNotifications ? 'bg-emerald-500' : 'bg-white/20'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ left: pushNotifications ? 24 : 4 }}
                  transition={{ duration: timing.interaction / 1000, ease: easing.button }}
                />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔒</span>
            Privacy & Data
          </h3>
          
          <div className="space-y-3">
            <PolicyDownload userId={userData.id} userData={userData} />
            <div className="border-t border-white/5 pt-3">
              <DeleteAccount userId={userData.id} />
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </PageWrapper>
  );
}
