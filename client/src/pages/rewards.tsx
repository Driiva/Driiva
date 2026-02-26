import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import { GlassCard } from "@/components/GlassCard";
import { Gift, TrendingUp, Check, Bell, ChevronDown, Loader2 } from "lucide-react";
import { container, item, timing, easing, microInteractions } from "@/lib/animations";
import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from "../hooks/useDashboardData";
import { getAchievementDefinitions, getUserAchievements } from "@/lib/firestore";
import type { AchievementDef, UserAchievementRecord } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/[0.08] rounded ${className}`} />;
}

interface DisplayAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: string;
}

const ICON_FALLBACK: Record<string, string> = {
  Car: '🚗', Shield: '🛡️', Target: '🎯', Users: '👥', Zap: '⚡',
  Star: '⭐', Flame: '🔥', Route: '🛣️', Moon: '🌙', Gauge: '📊',
  Award: '🏅', Trophy: '🏆',
};

export default function Rewards() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: dashboardData, loading: dataLoading } = useDashboardData(user?.id || null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"achievements" | "rewards" | "progress">("achievements");
  const policyNumber = dashboardData?.policyNumber ?? '—';

  const [achievements, setAchievements] = useState<DisplayAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !isFirebaseConfigured) {
      setAchievementsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [defs, userRecords] = await Promise.all([
          getAchievementDefinitions(),
          getUserAchievements(user.id),
        ]);

        if (cancelled) return;

        const unlockMap = new Map(userRecords.map(r => [r.achievementId, r]));

        setAchievements(
          defs.map((def: AchievementDef) => {
            const unlock = unlockMap.get(def.id);
            return {
              id: def.id,
              title: def.name,
              description: def.description,
              icon: ICON_FALLBACK[def.icon] ?? '🏆',
              unlocked: !!unlock,
              unlockedAt: unlock?.unlockedAt?.toDate?.()?.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              }),
              category: def.category,
            };
          })
        );
      } catch (err) {
        console.error('[Rewards] Failed to load achievements:', err);
      } finally {
        if (!cancelled) setAchievementsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

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

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Driver';

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;
  const drivingScore = dashboardData?.drivingScore ?? 0;
  const streakDays = dashboardData?.streakDays ?? 0;
  const projectedRefund = dashboardData?.projectedRefund ?? 0;
  const poolShare = dashboardData?.poolShare ?? 0;
  const totalTrips = dashboardData?.totalTrips ?? 0;

  const loading = dataLoading && !dashboardData;

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
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-700/30 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Driiva" className="w-full h-full object-cover" />
            </div>
            <div style={{ marginTop: '2px' }}>
              <h1 className="text-xl font-bold text-white">Driiva</h1>
              <p className="text-sm text-white/50">{getGreeting()}, {firstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
            </button>

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {(user?.name?.[0] ?? user?.email?.[0] ?? 'd').toUpperCase()}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

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

        <h2 className="text-2xl font-bold text-white mb-4">Rewards</h2>

        {/* Summary Card */}
        <motion.div
          className="mb-6"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <Gift className="w-5 h-5 text-white/60" />
              Rewards Dashboard
            </h3>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center p-3 bg-white/5 rounded-xl">
                    <Skeleton className="h-7 w-12 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: `${unlockedCount}/${totalAchievements || '—'}`, label: "Achievements" },
                  { value: streakDays > 0 ? streakDays : '—', label: "Day Streak" },
                  { value: projectedRefund > 0 ? `£${projectedRefund}` : '—', label: "Projected Refund", accent: true },
                  { value: totalTrips, label: "Safe Trips" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="text-center p-3 bg-white/5 rounded-xl"
                    whileHover={microInteractions.hover}
                    transition={{ duration: timing.quick }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ transitionDelay: `${index * 0.05}s` }}
                  >
                    <div className={`text-2xl font-semibold ${stat.accent ? 'text-emerald-400' : 'text-white'}`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: timing.interaction, duration: timing.pageTransition, ease: easing.button }}
        >
          <GlassCard className="p-1.5 flex">
            {["achievements", "rewards", "progress"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm min-h-[44px] transition-colors duration-200 ${activeTab === tab
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                whileTap={microInteractions.tap}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </GlassCard>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: timing.interaction, ease: easing.button }}
          >
            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <motion.div
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {achievementsLoading ? (
                  [1, 2, 3].map((i) => (
                    <GlassCard key={i} className="p-5">
                      <div className="flex items-start gap-4 animate-pulse">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </GlassCard>
                  ))
                ) : achievements.length === 0 ? (
                  <GlassCard className="p-8 text-center">
                    <Gift className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">No achievements available yet.</p>
                    <p className="text-white/40 text-xs mt-1">Complete trips to start unlocking achievements!</p>
                  </GlassCard>
                ) : (
                  achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      variants={item}
                      whileHover={microInteractions.hoverSubtle}
                      whileTap={microInteractions.tap}
                    >
                      <GlassCard className={`p-5 ${!achievement.unlocked ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-4">
                          <motion.div
                            className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"
                            whileHover={{ rotate: 5, scale: 1.05 }}
                            transition={{ duration: timing.interaction }}
                          >
                            <span className="text-xl">{achievement.icon}</span>
                          </motion.div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white text-sm">{achievement.title}</h3>
                              {achievement.unlocked && (
                                <motion.div
                                  className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: timing.interaction, type: "spring", stiffness: 380, damping: 30 }}
                                >
                                  <Check className="w-3 h-3 text-emerald-400" />
                                </motion.div>
                              )}
                            </div>

                            <p className="text-xs text-white/50 mb-1">{achievement.description}</p>

                            {achievement.unlocked && achievement.unlockedAt && (
                              <div className="text-xs text-white/40">
                                Unlocked: {achievement.unlockedAt}
                              </div>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <motion.div
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={item}>
                  <GlassCard className="p-6 text-center">
                    <Gift className="w-10 h-10 text-emerald-400/60 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-2">Refund Rewards</h3>
                    {projectedRefund > 0 ? (
                      <>
                        <p className="text-3xl font-bold text-emerald-400 mb-2">£{projectedRefund}</p>
                        <p className="text-sm text-white/50">
                          Projected refund based on your {drivingScore} score
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-white/50">
                        {drivingScore >= 70
                          ? 'Your refund will be calculated at the end of the period.'
                          : 'Score 70+ to qualify for premium refunds.'}
                      </p>
                    )}
                  </GlassCard>
                </motion.div>

                <motion.div variants={item}>
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">Pool Share</span>
                      <span className="text-sm font-semibold text-white">
                        {poolShare > 0 ? `£${poolShare.toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Share %</span>
                      <span className="text-sm font-semibold text-white">
                        {dashboardData?.sharePercentage
                          ? `${dashboardData.sharePercentage.toFixed(2)}%`
                          : '—'}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>

                <motion.div variants={item}>
                  <div className="p-3 bg-emerald-500/[0.06] border border-emerald-500/[0.15] rounded-xl">
                    <p className="text-xs text-emerald-200/80 text-center">
                      Refunds are calculated at the end of each period and paid out within 14 days.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
              <motion.div
                className="space-y-6"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={item}>
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-white/60" />
                      Your Stats
                    </h3>

                    {loading ? (
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="text-center p-4 bg-white/5 rounded-xl">
                            <Skeleton className="h-7 w-12 mx-auto mb-2" />
                            <Skeleton className="h-3 w-16 mx-auto" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: drivingScore > 0 ? String(drivingScore) : '—', label: "Current Score", accent: true },
                          { value: streakDays > 0 ? String(streakDays) : '—', label: "Streak Days" },
                          { value: dashboardData?.totalMiles ? String(dashboardData.totalMiles) : '—', label: "Miles Driven" },
                          { value: projectedRefund > 0 ? `£${projectedRefund}` : '—', label: "Refund Earned", accent: true },
                        ].map((stat, index) => (
                          <motion.div
                            key={index}
                            className="text-center p-4 bg-white/5 rounded-xl"
                            whileHover={microInteractions.hover}
                            transition={{ duration: timing.quick }}
                          >
                            <div className={`text-2xl font-semibold ${stat.accent ? 'text-emerald-400' : 'text-white'}`}>
                              {stat.value}
                            </div>
                            <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>

                {/* Refund progress bar */}
                {drivingScore > 0 && (
                  <motion.div variants={item}>
                    <GlassCard className="p-6">
                      <h3 className="font-semibold text-white text-sm mb-3">Refund Progress</h3>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-white/60">Current score</span>
                        <span className="text-white font-semibold">{drivingScore}</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${drivingScore}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                          className={`h-full rounded-full ${
                            drivingScore >= 80 ? 'bg-emerald-500' : drivingScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/40">
                        <span>0</span>
                        <span className="text-amber-400/60">70 (qualify)</span>
                        <span>100</span>
                      </div>
                      {projectedRefund > 0 && (
                        <p className="text-emerald-300/70 text-xs text-center mt-3">
                          You're on track for £{projectedRefund} back this period
                        </p>
                      )}
                    </GlassCard>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </PageWrapper>
  );
}
