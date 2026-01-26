import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { TrendingUp, Car, ChevronRight } from "lucide-react";
import { PageWrapper } from '../components/PageWrapper';
import { useAuth } from '../contexts/AuthContext';

// Glassmorphic Card Component
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`backdrop-blur-xl bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);

export default function Demo() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();

  // Demo data
  const drivingScore = 85;
  const totalMiles = 1247;
  const premiumAmount = 1500;
  const surplusProjection = 150;

  const enterDemoMode = () => {
    const mockUser = {
      id: 'demo-user-123',
      email: 'demo@driiva.co.uk',
      name: 'Demo Driver',
    };
    
    localStorage.setItem('driiva-demo-mode', 'true');
    localStorage.setItem('driiva-demo-user', JSON.stringify({
      ...mockUser,
      first_name: 'Demo',
      last_name: 'Driver',
      premium_amount: premiumAmount,
      personal_score: drivingScore,
      community_score: 78,
      overall_score: 82,
      totalMiles: totalMiles,
      projectedRefund: surplusProjection,
      created_at: new Date().toISOString()
    }));
    localStorage.setItem('driiva-auth-token', 'demo-token-' + Date.now());
    
    setUser(mockUser);
    setLocation('/home');
  };

  return (
    <PageWrapper>
      <div className="pb-8 text-white">
        {/* Demo Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-700/30 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Driiva" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back, Demo Driver</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-sm font-medium border border-teal-500/30">
              Demo Mode
            </span>
          </div>
        </motion.div>

        {/* Enter Demo Mode Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="mb-6"
        >
          <button
            onClick={enterDemoMode}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
          >
            Enter Demo Mode →
          </button>
        </motion.div>

        {/* Driving Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Driving Score</h2>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-white">{drivingScore}</span>
              <span className="text-xl text-white/60 mb-1">/100</span>
            </div>
            <p className="text-sm text-white/60 mt-3">
              Great driving! Keep it up to maximise your refund.
            </p>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${drivingScore}%` }}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Your Trips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Trips</h2>
              <Car className="w-5 h-5 text-white/60" />
            </div>
            <div className="py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/60 text-sm">Total Miles</span>
                <span className="text-white font-semibold">{totalMiles.toLocaleString()} mi</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${Math.min((totalMiles / 3000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-white/40 text-xs mt-2">Track record since joining Driiva</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Surplus Projection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Surplus Projection</h2>
              <span className="text-teal-400 font-bold text-xl">£{surplusProjection}</span>
            </div>
            <p className="text-white/60 text-sm">
              Based on your {drivingScore}% score and £{premiumAmount.toLocaleString()} premium.
            </p>
            <div className="mt-4 flex items-center gap-2 text-teal-400 text-sm cursor-pointer hover:text-teal-300 transition-colors">
              <span>Learn how it works</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Back to Landing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-center"
        >
          <button
            onClick={() => setLocation('/')}
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
