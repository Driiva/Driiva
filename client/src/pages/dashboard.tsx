import DashboardHeader from "@/components/DashboardHeader";
import LiquidGauge from "@/components/LiquidGauge";
import MetricsGrid from "@/components/MetricsGrid";
import CommunityPool from "@/components/CommunityPool";
import RefundSimulator from "@/components/RefundSimulator";
import Gamification from "@/components/Gamification";
import BottomNavigation from "@/components/BottomNavigation";
import PolicyStatusWidget from "@/components/PolicyStatusWidget";
import PageTransition from "@/components/PageTransition";

export default function Dashboard() {
  // Static data for stable demo - no API calls
  const data = {
    user: {
      id: 8,
      username: "driiva1",
      firstName: "Test",
      lastName: "Driver",
      email: "test@driiva.com",
      premiumAmount: "1840.00"
    },
    profile: {
      currentScore: 89,
      projectedRefund: 138.00,
      totalMiles: 1107.70,
      hardBrakingScore: 92,
      accelerationScore: 88,
      speedAdherenceScore: 85,
      nightDrivingScore: 95,
      corneringScore: 90,
      consistencyScore: 89
    },
    communityPool: {
      totalMembers: 1247,
      averageScore: 75,
      safetyFactor: 0.92,
      poolBalance: 45230.50
    },
    achievements: [
      {
        id: 1,
        title: "Long Distance Driver",
        description: "Drove over 1000 miles",
        iconUrl: "🚗",
        unlockedAt: "2025-07-20"
      },
      {
        id: 2,
        title: "Consistent Driver",
        description: "30 days of safe driving",
        iconUrl: "⭐",
        unlockedAt: "2025-07-25"
      }
    ],
    leaderboard: [
      {
        id: 1,
        userId: 8,
        rank: 1,
        score: 89,
        weeklyScore: 92
      }
    ]
  };

  return (
    <PageTransition>
      <div className="min-h-screen text-white bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <DashboardHeader user={data.user} />
        <main className="px-4 pb-20">
          {/* Policy Status Widget */}
          <div className="pt-4 mb-3">
            <PolicyStatusWidget user={data.user} />
          </div>

          {/* Driving Score Box */}
          <div className="mb-3">
            <LiquidGauge 
              score={data.profile.currentScore}
              projectedRefund={data.profile.projectedRefund}
              premiumAmount={Number(data.user.premiumAmount)}
            />
          </div>

          {/* Metrics Grid Box */}
          <div className="mb-3">
            <MetricsGrid profile={data.profile} />
          </div>

          {/* Community Pool Box */}
          <div className="mb-3">
            <CommunityPool 
              pool={{
                poolAmount: data.communityPool.poolBalance,
                safetyFactor: data.communityPool.safetyFactor,
                participantCount: data.communityPool.totalMembers,
                safeDriverCount: Math.round(data.communityPool.totalMembers * 0.8)
              }}
            />
          </div>

          {/* Gamification Box */}
          <div className="mb-3">
            <Gamification 
              achievements={data.achievements}
              leaderboard={data.leaderboard}
              currentUser={data.user}
              profile={data.profile}
              premiumAmount={Number(data.user.premiumAmount)}
            />
          </div>

          {/* Refund Simulator Box */}
          <div className="mb-3">
            <RefundSimulator 
              currentScore={data.profile.currentScore}
              premiumAmount={Number(data.user.premiumAmount)}
              poolSafetyFactor={data.communityPool.safetyFactor}
            />
          </div>
        </main>
        <BottomNavigation activeTab="home" />
      </div>
    </PageTransition>
  );
}