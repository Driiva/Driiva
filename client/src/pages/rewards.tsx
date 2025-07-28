import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import PageTransition from "@/components/PageTransition";
import { Trophy, Award, Star, Target, TrendingUp, Gift, Calendar, Zap } from "lucide-react";
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

  // Static data - no API calls
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
      category: "safety",
      reward: "£50 refund bonus"
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "safety": return Trophy;
      case "distance": return Target;
      case "consistency": return Calendar;
      case "community": return Star;
      default: return Award;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safety": return "from-yellow-400 to-orange-500";
      case "distance": return "from-blue-400 to-cyan-500";
      case "consistency": return "from-green-400 to-emerald-500";
      case "community": return "from-purple-400 to-pink-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen text-white bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <DashboardHeader user={user} />
        
        <main className="px-4 pb-20">
        {/* Header Stats */}
        <div className="pt-4 mb-6">
          <div className="glass-morphism rounded-2xl p-4 border border-white/10 backdrop-blur-xl">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
              Rewards Dashboard
            </h1>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.totalPoints}</div>
                <div className="text-sm text-gray-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.achievementsUnlocked}/{stats.totalAchievements}</div>
                <div className="text-sm text-gray-400">Achievements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.currentStreak}</div>
                <div className="text-sm text-gray-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">£{stats.totalRefunds}</div>
                <div className="text-sm text-gray-400">Total Refunds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="glass-morphism rounded-xl p-1 flex border border-white/10 backdrop-blur-xl">
            {["achievements", "rewards", "progress"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg backdrop-blur-sm border border-white/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "achievements" && (
            <div className="grid gap-3">
              {achievements.map((achievement) => {
                const IconComponent = getCategoryIcon(achievement.category);
                const isUnlocked = !!achievement.unlockedAt;
                const hasProgress = achievement.progress !== undefined;
                
                return (
                  <motion.div
                    key={achievement.id}
                    className="glass-morphism rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer transform-gpu border border-white/10"
                    whileHover={{ 
                      scale: 1.025,
                      boxShadow: "0 25px 50px rgba(59, 130, 246, 0.2)",
                      backdropFilter: "blur(25px)",
                      background: "rgba(255, 255, 255, 0.12)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4,
                      delay: achievement.id * 0.08,
                      ease: [0.23, 1, 0.320, 1]
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getCategoryColor(achievement.category)} flex items-center justify-center flex-shrink-0`}>
                        {achievement.iconUrl ? (
                          <span className="text-xl">{achievement.iconUrl}</span>
                        ) : (
                          <IconComponent className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{achievement.title}</h3>
                          {isUnlocked && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Zap className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                        
                        {achievement.reward && (
                          <div className="text-xs text-yellow-400 font-medium mb-2">
                            Reward: {achievement.reward}
                          </div>
                        )}
                        
                        {hasProgress && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-white">{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <motion.div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(achievement.progress! / achievement.maxProgress!) * 100}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {isUnlocked && achievement.unlockedAt && (
                          <div className="text-xs text-green-400 mt-2">
                            Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="grid gap-3">
              {rewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  className={`glass-morphism rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    reward.available ? "hover:shadow-lg" : "opacity-60"
                  }`}
                  whileHover={reward.available ? { scale: 1.02 } : {}}
                  whileTap={reward.available ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{reward.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{reward.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-yellow-400">{reward.points} pts</div>
                        <div className="text-lg font-bold text-green-400">{reward.value}</div>
                      </div>
                    </div>
                    
                    <button
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        reward.available
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                          : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                      disabled={!reward.available}
                    >
                      {reward.available ? "Claim" : "Locked"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "progress" && (
            <div className="space-y-6">
              {/* Weekly Progress */}
              <div className="glass-morphism rounded-xl p-4">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Weekly Progress
                </h3>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const dayScore = Math.floor(Math.random() * 20) + 80;
                    const isToday = i === 6;
                    
                    return (
                      <div key={i} className="text-center">
                        <div className={`w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                          isToday ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300"
                        }`}>
                          {dayScore}
                        </div>
                        <div className="text-xs text-gray-400">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Summary */}
              <div className="glass-morphism rounded-xl p-4">
                <h3 className="font-semibold text-white mb-4">Monthly Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">89</div>
                    <div className="text-sm text-gray-400">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">28</div>
                    <div className="text-sm text-gray-400">Safe Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">245</div>
                    <div className="text-sm text-gray-400">Miles Driven</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">£42</div>
                    <div className="text-sm text-gray-400">Refund Earned</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
        
        <BottomNavigation activeTab="rewards" />
      </div>
    </PageTransition>
  );
}