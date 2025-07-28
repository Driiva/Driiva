import { Award, Zap, Star, Trophy, Target } from "lucide-react";

interface GamificationProps {
  achievements: any[];
  leaderboard: any[];
  currentUser: any;
  profile?: {
    currentScore: number;
    projectedRefund: number;
    totalMiles: number;
  };
  premiumAmount?: number;
}

export default function Gamification({ achievements, leaderboard, currentUser, profile, premiumAmount }: GamificationProps) {
  const unlockedAchievements = [
    { name: "Safe Driver", description: "30 days", color: "from-[#10B981] to-[#06B6D4]", icon: Award },
    { name: "Speed Master", description: "No violations", color: "from-[#3B82F6] to-[#A855F7]", icon: Zap },
  ];

  const lockedAchievements = [
    { name: "Night Owl", description: "Locked", color: "bg-gray-600", icon: Star },
  ];

  // Refund tier tracking (if profile data is available)
  const refundTiers = profile && premiumAmount ? {
    silver: { score: 85, refund: (premiumAmount || 1840) * 0.10, label: "Silver", color: "text-gray-400" },
    gold: { score: 90, refund: (premiumAmount || 1840) * 0.12, label: "Gold", color: "text-yellow-400" },
    platinum: { score: 95, refund: (premiumAmount || 1840) * 0.15, label: "Platinum", color: "text-purple-400" }
  } : null;

  const topLeaderboard = [
    { name: "Sarah M.", score: 98, rank: 1 },
    { name: "John D.", score: 95, rank: 2 },
    { name: "Emma K.", score: 93, rank: 3 },
  ];

  const userRank = { name: "You", score: 85, rank: 12 };

  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Achievements & Goals</h3>

      {/* Refund Progress Section */}
      {refundTiers && profile && (
        <div className="rounded-2xl p-4 mb-4" style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
        }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Refund Goals
            </h4>
            <div className="text-xs text-gray-400">Current: {profile.currentScore}/100</div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(refundTiers).map(([tier, data]) => {
              const isAchieved = profile.currentScore >= data.score;
              return (
                <div key={tier} className={`text-center p-2 rounded-lg ${isAchieved ? 'bg-green-500/20' : 'bg-gray-500/10'}`}>
                  <div className={`text-xs font-medium ${data.color}`}>{data.label}</div>
                  <div className="text-xs text-gray-300">{data.score}+ score</div>
                  <div className="text-xs font-bold text-white">£{data.refund.toFixed(0)}</div>
                  {isAchieved && <div className="text-xs text-green-400">✓ Unlocked</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        {unlockedAchievements.map((achievement, index) => (
          <div key={index} className="rounded-2xl p-4 text-center" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
          }}>
            <div className={`w-12 h-12 bg-gradient-to-r ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
              <achievement.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-xs font-medium text-white">{achievement.name}</div>
            <div className="text-xs text-gray-400">{achievement.description}</div>
          </div>
        ))}

        {lockedAchievements.map((achievement, index) => (
          <div key={index} className="rounded-2xl p-4 text-center opacity-50" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
          }}>
            <div className={`w-12 h-12 ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
              <achievement.icon className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-xs font-medium text-gray-400">{achievement.name}</div>
            <div className="text-xs text-gray-400">{achievement.description}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4" style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Community Leaderboard</h4>
          <div className="text-xs text-gray-400">This Week</div>
        </div>

        <div className="space-y-3">
          {topLeaderboard.map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black ${
                  entry.rank === 1 ? 'bg-yellow-500' : 
                  entry.rank === 2 ? 'bg-gray-400' : 
                  'bg-orange-500'
                }`}>
                  {entry.rank}
                </div>
                <span className="text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.7)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600'
              }}>{entry.score}</span>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-gray-600 pt-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center text-xs font-bold text-white">
                {userRank.rank}
              </div>
              <span className="text-sm font-medium text-[#06B6D4]">{userRank.name}</span>
            </div>
            <span className="text-sm text-[#06B6D4]">{userRank.score}</span>
          </div>
        </div>
      </div>
    </section>
  );
}