import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Car, FileText, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
}

interface DemoUser {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  premium_amount?: number;
  personal_score?: number;
  community_score?: number;
  overall_score?: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

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

    async function checkAuthAndFetchProfile() {
      try {
        if (user) {
          setAuthChecked(true);
          setLoading(false);
          return;
        }

        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setLocation('/signin');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Auth/profile fetch error:', error);
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
    }

    checkAuthAndFetchProfile();
  }, [setLocation, user, isDemoMode]);

  const displayName = isDemoMode 
    ? (demoUser?.first_name && demoUser?.last_name 
        ? `${demoUser.first_name} ${demoUser.last_name}` 
        : demoUser?.name || 'Driver')
    : (profile?.full_name || user?.name || 'Driver');

  const drivingScore = isDemoMode ? (demoUser?.overall_score || 85) : 85;
  const premiumAmount = isDemoMode ? (demoUser?.premium_amount || 1500) : 1500;
  
  const calculateSurplus = (score: number, premium: number): number => {
    if (score < 70) return 0;
    const scoreRange = Math.max(0, score - 70);
    const baseRefund = 5;
    const additionalRefund = (scoreRange / 30) * 10;
    const totalPercentage = Math.min(baseRefund + additionalRefund, 15);
    return Math.round((totalPercentage / 100) * premium);
  };

  const surplusProjection = calculateSurplus(drivingScore, premiumAmount);

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="relative z-10">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white relative">
      
      <div className="relative z-10 px-4 py-6 pb-32 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-white/60 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          {isDemoMode && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              Demo Mode
            </span>
          )}
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
            <p className="text-white/60 text-sm">Start driving to see your trips</p>
            <p className="text-white/40 text-xs mt-1">Your journey data will appear here</p>
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
            {surplusProjection > 0 
              ? `Based on your ${drivingScore}% score and £${premiumAmount.toLocaleString()} premium.`
              : "Drive more to unlock rewards. Safe drivers earn a share of the community surplus at renewal."}
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
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => setLocation('/policy')}
            className="dashboard-glass-card flex items-center justify-center gap-2 py-4 hover:bg-white/15 transition-colors"
          >
            <FileText className="w-5 h-5 text-white" />
            <span className="font-medium text-white">View Policy</span>
          </button>
          
          <button
            onClick={() => {}}
            className="dashboard-glass-card flex items-center justify-center gap-2 py-4 hover:bg-white/15 transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-white" />
            <span className="font-medium text-white">Report Claim</span>
          </button>
        </motion.div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20">
        <div 
          className="flex items-center justify-around py-4 px-4 mx-4 mb-4 rounded-2xl"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button className="flex flex-col items-center gap-1 text-emerald-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button onClick={() => setLocation('/trips')} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
            <Car className="w-6 h-6" />
            <span className="text-xs">Trips</span>
          </button>
          <button onClick={() => setLocation('/rewards')} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Rewards</span>
          </button>
          <button onClick={() => setLocation('/profile')} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
