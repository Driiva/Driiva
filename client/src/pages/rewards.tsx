import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { GradientMesh } from "@/components/GradientMesh";
import { GlassCard } from "@/components/GlassCard";
import { Trophy, Award, Star, Target, TrendingUp, Gift, Calendar, Check } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="min-h-screen text-white">
      <GradientMesh />
      <DashboardHeader user={user} />
      
      <main className="px-4 pb-28">
        {/* Header Stats */}
        <div className="pt-6 mb-6">
          <GlassCard className="p-6">
            <h1 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <Gift className="w-5 h-5 text-white/60" />
              Rewards Dashboard
            </h1>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-semibold text-emerald-400">{stats.totalPoints}</div>
                <div className="text-xs text-white/50 mt-1">Total Points</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-semibold text-white">{stats.achievementsUnlocked}/{stats.totalAchievements}</div>
                <div className="text-xs text-white/50 mt-1">Achievements</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-semibold text-white">{stats.currentStreak}</div>
                <div className="text-xs text-white/50 mt-1">Day Streak</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-semibold text-emerald-400">£{stats.totalRefunds}</div>
                <div className="text-xs text-white/50 mt-1">Total Refunds</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <GlassCard className="p-1.5 flex">
            {["achievements", "rewards", "progress"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm min-h-[44px] transition-all duration-200 ease-out ${
                  activeTab === tab
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {activeTab === "achievements" && (
            <div className="space-y-3">
              {achievements.map((achievement) => {
                const isUnlocked = !!achievement.unlockedAt;
                const hasProgress = achievement.progress !== undefined;
                
                return (
                  <GlassCard 
                    key={achievement.id} 
                    className={`p-5 ${!isUnlocked && !hasProgress ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{achievement.iconUrl}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-sm">{achievement.title}</h3>
                          {isUnlocked && (
                            <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </div>
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
                              <div
                                className="bg-emerald-500/60 h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(achievement.progress! / achievement.maxProgress!) * 100}%` }}
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
                );
              })}
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <GlassCard 
                  key={reward.id} 
                  className={`p-5 ${!reward.available ? 'opacity-40' : ''}`}
                >
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
                    
                    <button
                      className={`px-4 py-2.5 min-h-[44px] rounded-xl font-medium text-sm transition-all duration-200 ease-out ${
                        reward.available
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-95"
                          : "bg-white/5 text-white/30 cursor-not-allowed"
                      }`}
                      disabled={!reward.available}
                    >
                      {reward.available ? "Claim" : "Locked"}
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === "progress" && (
            <div className="space-y-6">
              {/* Weekly Progress */}
              <GlassCard className="p-6">
                <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-white/60" />
                  Weekly Progress
                </h3>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const dayScore = [85, 88, 92, 87, 90, 94, 89][i];
                    const isToday = i === 6;
                    
                    return (
                      <div key={i} className="text-center">
                        <div className={`w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xs font-semibold ${
                          isToday 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "bg-white/5 text-white/70"
                        }`}>
                          {dayScore}
                        </div>
                        <div className="text-xs text-white/40">
                          {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Monthly Summary */}
              <GlassCard className="p-6">
                <h3 className="font-semibold text-white text-sm mb-4">Monthly Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-semibold text-emerald-400">89</div>
                    <div className="text-xs text-white/50 mt-1">Average Score</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-semibold text-white">28</div>
                    <div className="text-xs text-white/50 mt-1">Safe Days</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-semibold text-white">245</div>
                    <div className="text-xs text-white/50 mt-1">Miles Driven</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-2xl font-semibold text-emerald-400">£42</div>
                    <div className="text-xs text-white/50 mt-1">Refund Earned</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </motion.div>
      </main>
        
      <BottomNavigation activeTab="rewards" />
    </div>
  );
}
