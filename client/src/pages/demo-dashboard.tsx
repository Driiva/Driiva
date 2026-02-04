import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Car, TrendingUp, ArrowLeft, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';

export default function DemoDashboard() {
  const [, setLocation] = useLocation();

  const drivingScore = 71.75;
  const premiumAmount = 1500;
  const totalMiles = 0;

  const calculateSurplus = (score: number, premium: number): number => {
    if (score < 70) return 0;
    const scoreRange = Math.max(0, score - 70);
    const baseRefund = 5;
    const additionalRefund = (scoreRange / 30) * 10;
    const totalPercentage = Math.min(baseRefund + additionalRefund, 15);
    return Math.round((totalPercentage / 100) * premium);
  };

  const surplusProjection = calculateSurplus(drivingScore, premiumAmount);

  return (
    <PageWrapper>
      <div className="pb-8 text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => setLocation('/')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Demo Dashboard</h1>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
              Preview Mode
            </span>
          </div>
        </motion.div>

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
            Good progress! A few more safe trips will boost your score.
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
          transition={{ delay: 0.2, duration: 0.5 }}
          className="dashboard-glass-card mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Trips</h2>
            <Car className="w-5 h-5 text-white/60" />
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">No trips yet</p>
            <p className="text-white/40 text-xs mt-1">Start driving to see your trips here</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="dashboard-glass-card mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Surplus Projection</h2>
            <span className="text-emerald-400 font-bold text-xl">£{surplusProjection}</span>
          </div>
          <p className="text-white/60 text-sm">
            Based on your {drivingScore}% score and £{premiumAmount.toLocaleString()} premium.
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm cursor-pointer hover:text-emerald-300 transition-colors">
            <span>Learn how it works</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="dashboard-glass-card flex items-center justify-center gap-2 py-4">
            <FileText className="w-5 h-5 text-white" />
            <span className="font-medium text-white">Profile</span>
          </div>
          
          <div className="dashboard-glass-card flex items-center justify-center gap-2 py-4">
            <AlertCircle className="w-5 h-5 text-white" />
            <span className="font-medium text-white">Settings</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={() => setLocation('/signup')}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all"
          >
            Get Started Now
          </button>
          <button
            onClick={() => setLocation('/')}
            className="w-full bg-white/10 backdrop-blur-lg text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
