import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import DRIBackgroundView from "@/components/DRIBackgroundView";
import { GlassCard } from "@/components/GlassCard";
import { Trophy, Award, Star, Target, TrendingUp, Gift, Calendar, Check } from "lucide-react";
import { pageVariants, container, item, timing, easing, microInteractions } from "@/lib/animations";

interface Achievement {
  id: number;
  title: string;
  description: string;
  iconUrl: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  reward?: string;
  category: "safety" | "distance" | "consistency" | "community";
}

interface Reward {
  id: number;
  title: string;
  description: string;
  points: number;
  category: "discount" | "cashback" | "premium";
  value: string;
  available: boolean;
}

export default function Rewards() {
  const [activeTab, setActiveTab] = useState<"achievements" | "rewards" | "progress">("achievements");

  const user = {
    firstName: "Test",
    lastName: "Driver",
    username: "driiva1",
    email: "test@driiva.com",
    premiumAmount: "1840.00"
  };

  const achievements: Achievement[] = [
    {
      id: 1,
      title: "Long Distance Driver",
      description: "Drive over 1000 miles safely",
      iconUrl: "🚗",
      unlockedAt: "2025-07-20",
      category: "distance",
      reward: "£25 refund bonus"
    },
    {
      id: 2,
      title: "Consistent Driver",
      description: "30 days of safe driving",
      iconUrl: "⭐",
      unlockedAt: "2025-07-25",
      category: "consistency"
    },
    {
      id: 3,
      title: "Safety Champion",
      description: "Maintain 90+ score for 7 days",
      iconUrl: "🏆",
      progress: 5,
      maxProgress: 7,
      category: "safety"
    },
    {
      id: 4,
      title: "Community Leader",
      description: "Be in top 10% of community pool",
      iconUrl: "👑",
      progress: 8,
      maxProgress: 10,
      category: "community"
    },
    {
      id: 5,
      title: "Perfect Week",
      description: "7 days with zero incidents",
      iconUrl: "💎",
      category: "safety"
    },
    {
      id: 6,
      title: "Miles Milestone",
      description: "Drive 2000 miles safely",
      iconUrl: "🛣️",
      progress: 1107,
      maxProgress: 2000,
      category: "distance",
      reward: "£60 refund bonus"
    }
  ];

  const rewards: Reward[] = [
    {
      id: 1,
      title: "Premium Discount",
      description: "5% off next year's premium",
      points: 1000,
      category: "discount",
      value: "£92",
      available: true
    },
    {
      id: 2,
      title: "Cashback Bonus",
      description: "Direct cash refund",
      points: 800,
      category: "cashback",
      value: "£40",
      available: true
    },
    {
      id: 3,
      title: "Premium Freeze",
      description: "Lock current premium rate",
      points: 1500,
      category: "premium",
      value: "Rate Lock",
      available: false
    }
  ];

  const stats = {
    totalPoints: 1250,
    achievementsUnlocked: 2,
    totalAchievements: 6,
    currentStreak: 12,
    totalRefunds: 138.00
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
      <DRIBackgroundView variant="app" />
      <div className="page-transition">
        <DashboardHeader user={user} />
      
      <main className="px-4 pb-28">
        {/* Header Stats */}
        <motion.div 
          className="pt-6 mb-6"
          variants={item}
          initial="hidden"
          animate="show"
        >
          <GlassCard className="p-6">
            <h1 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <Gift className="w-5 h-5 text-white/60" />
              Rewards Dashboard
            </h1>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: stats.totalPoints, label: "Total Points", accent: true },
                { value: `${stats.achievementsUnlocked}/${stats.totalAchievements}`, label: "Achievements" },
                { value: stats.currentStreak, label: "Day Streak" },
                { value: `£${stats.totalRefunds}`, label: "Total Refunds", accent: true }
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
          </GlassCard>
        </motion.div>

        {/* Tab Navigation */}
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
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm min-h-[44px] transition-colors duration-200 ${
                  activeTab === tab
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

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: timing.interaction, ease: easing.button }}
          >
            {activeTab === "achievements" && (
              <motion.div 
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {achievements.map((achievement) => {
                  const isUnlocked = !!achievement.unlockedAt;
                  const hasProgress = achievement.progress !== undefined;
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      variants={item}
                      whileHover={microInteractions.hoverSubtle}
                      whileTap={microInteractions.tap}
                    >
                      <GlassCard className={`p-5 ${!isUnlocked && !hasProgress ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-4">
                          <motion.div 
                            className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"
                            whileHover={{ rotate: 5, scale: 1.05 }}
                            transition={{ duration: timing.interaction }}
                          >
                            <span className="text-xl">{achievement.iconUrl}</span>
                          </motion.div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white text-sm">{achievement.title}</h3>
                              {isUnlocked && (
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
                            
                            <p className="text-xs text-white/50 mb-2">{achievement.description}</p>
                            
                            {achievement.reward && isUnlocked && (
                              <div className="text-xs text-emerald-400 font-medium mb-2">
                                Reward: {achievement.reward}
                              </div>
                            )}
                            
                            {hasProgress && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-white/40">Progress</span>
                                  <span className="text-white/70">{achievement.progress}/{achievement.maxProgress}</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                  <motion.div
                                    className="bg-emerald-500/60 h-1.5 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(achievement.progress! / achievement.maxProgress!) * 100}%` }}
                                    transition={{ duration: timing.counter, ease: easing.smoothDecel, delay: timing.pageTransition }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {isUnlocked && achievement.unlockedAt && (
                              <div className="text-xs text-white/40 mt-2">
                                Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "rewards" && (
              <motion.div 
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {rewards.map((reward) => (
                  <motion.div
                    key={reward.id}
                    variants={item}
                    whileHover={reward.available ? microInteractions.hoverSubtle : undefined}
                    whileTap={reward.available ? microInteractions.tap : undefined}
                  >
                    <GlassCard className={`p-5 ${!reward.available ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm mb-1">{reward.title}</h3>
                          <p className="text-xs text-white/50 mb-2">{reward.description}</p>
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-semibold text-white/70">{reward.points} pts</div>
                            <div className={`text-sm font-semibold ${reward.available ? 'text-emerald-400' : 'text-white/30'}`}>
                              {reward.value}
                            </div>
                          </div>
                        </div>
                        
                        <motion.button
                          className={`px-4 py-2.5 min-h-[44px] rounded-xl font-medium text-sm transition-colors duration-200 ${
                            reward.available
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-white/5 text-white/30 cursor-not-allowed"
                          }`}
                          disabled={!reward.available}
                          whileTap={reward.available ? microInteractions.press : undefined}
                        >
                          {reward.available ? "Claim" : "Locked"}
                        </motion.button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "progress" && (
              <motion.div 
                className="space-y-6"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {/* Weekly Progress */}
                <motion.div variants={item}>
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-white/60" />
                      Weekly Progress
                    </h3>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {[85, 88, 92, 87, 90, 94, 89].map((dayScore, i) => {
                        const isToday = i === 6;
                        
                        return (
                          <motion.div 
                            key={i} 
                            className="text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: timing.cardEntrance, ease: easing.button }}
                          >
                            <motion.div 
                              className={`w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xs font-semibold ${
                                isToday 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                  : "bg-white/5 text-white/70"
                              }`}
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: timing.quick }}
                            >
                              {dayScore}
                            </motion.div>
                            <div className="text-xs text-white/40">
                              {["M", "T", "W", "T", "F", "S", "S"][i]}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Monthly Summary */}
                <motion.div variants={item}>
                  <GlassCard className="p-6">
                    <h3 className="font-semibold text-white text-sm mb-4">Monthly Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: "89", label: "Average Score", accent: true },
                        { value: "28", label: "Safe Days" },
                        { value: "245", label: "Miles Driven" },
                        { value: "£42", label: "Refund Earned", accent: true }
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
                  </GlassCard>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      </div>
        
      <BottomNavigation />
    </motion.div>
  );
}
