import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { GradientMesh } from "@/components/GradientMesh";
import { GlassCard } from "@/components/GlassCard";
import { Trophy, Award, Star, Target, TrendingUp, Gift, Calendar, Check } from "lucide-react";

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

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  }
};

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
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <GradientMesh />
      <DashboardHeader user={user} />
      
      <main className="px-4 pb-28">
        {/* Header Stats */}
        <motion.div 
          className="pt-6 mb-6"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
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
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                  transition={{ duration: 0.2 }}
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
          transition={{ delay: 0.2, duration: 0.3 }}
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
                whileTap={{ scale: 0.98 }}
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
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {activeTab === "achievements" && (
              <motion.div 
                className="space-y-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {achievements.map((achievement) => {
                  const isUnlocked = !!achievement.unlockedAt;
                  const hasProgress = achievement.progress !== undefined;
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      variants={fadeInUp}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <GlassCard className={`p-5 ${!isUnlocked && !hasProgress ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-4">
                          <motion.div 
                            className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"
                            whileHover={{ rotate: 5, scale: 1.05 }}
                            transition={{ duration: 0.2 }}
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
                                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
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
                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
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
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {rewards.map((reward) => (
                  <motion.div
                    key={reward.id}
                    variants={fadeInUp}
                    whileHover={{ scale: reward.available ? 1.01 : 1 }}
                    whileTap={{ scale: reward.available ? 0.98 : 1 }}
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
                          whileTap={reward.available ? { scale: 0.95 } : {}}
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
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {/* Weekly Progress */}
                <motion.div variants={fadeInUp}>
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
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                          >
                            <motion.div 
                              className={`w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xs font-semibold ${
                                isToday 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                  : "bg-white/5 text-white/70"
                              }`}
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
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
                <motion.div variants={fadeInUp}>
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
                          whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                          transition={{ duration: 0.2 }}
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
        
      <BottomNavigation activeTab="rewards" />
    </motion.div>
  );
}
