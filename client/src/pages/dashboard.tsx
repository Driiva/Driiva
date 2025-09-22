
import React from 'react';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  MemoizedDashboardHeader as DashboardHeader,
  MemoizedLiquidGauge as LiquidGauge,
  MemoizedMetricsGrid as MetricsGrid,
  MemoizedCommunityPool as CommunityPool,
  MemoizedRefundSimulator as RefundSimulator,
  MemoizedGamification as Gamification,
  MemoizedBottomNavigation as BottomNavigation,
  MemoizedPolicyStatusWidget as PolicyStatusWidget
} from "@/components/OptimizedComponents";
import { MetricUser, CommunityPoolData, DrivingProfile, Achievement, LeaderboardEntry } from "@shared/types";

interface DashboardProps {
  isLoading?: boolean;
}

export default function Dashboard({ isLoading = false }: DashboardProps) {
  // Stable mock data - optimized for runtime stability
  const [userData] = React.useState<MetricUser>({
    id: 8,
    username: "driiva1",
    firstName: "Test",
    lastName: "Driver",
    email: "test@driiva.com",
    premiumAmount: "1840.00"
  });

  const [userProfile] = React.useState<Partial<DrivingProfile>>({
    currentScore: 72, // Test score above 70% threshold
    projectedRefund: 100.80, // Calculated: (1840 * 5.48%) for score 72
    totalMiles: 1107.70,
    totalTrips: 26,
    hardBrakingScore: 3,
    accelerationScore: 2,
    speedAdherenceScore: 1,
    nightDrivingScore: 5
  });

  const [communityPoolData] = React.useState<CommunityPoolData>({
    poolAmount: 105000,
    safetyFactor: 0.85,
    participantCount: 1000,
    safeDriverCount: 800,
    averageScore: 82
  });

  const [achievementsData] = React.useState<Achievement[]>([
    {
      id: 1,
      name: "Long Distance Driver",
      description: "Drove over 1000 miles",
      iconUrl: "🚗",
      unlockedAt: "2025-07-20"
    },
    {
      id: 2,
      name: "Consistent Driver", 
      description: "30 days of safe driving",
      iconUrl: "⭐",
      unlockedAt: "2025-07-25"
    }
  ]);

  const [leaderboardData] = React.useState<LeaderboardEntry[]>([
    {
      id: 1,
      userId: 8,
      rank: 14,
      score: 72,
      weeklyScore: 74
    }
  ]);

  // Show loading spinner if data is loading
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen text-white">
      <DashboardHeader user={userData} />
      
      <main className="px-4 pb-20" style={{ gap: 'var(--space-3)' }}>
        {/* Policy Status Widget */}
        <div style={{ paddingTop: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
          <PolicyStatusWidget user={userData} />
        </div>

        {/* Driving Score Gauge */}
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <LiquidGauge 
            score={userProfile.currentScore || 72}
            projectedRefund={userProfile.projectedRefund || 100.80}
            premiumAmount={Number(userData.premiumAmount)}
          />
        </div>

        {/* Metrics Grid */}
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <MetricsGrid profile={{
            hardBrakingScore: userProfile.hardBrakingScore || 3,
            accelerationScore: userProfile.accelerationScore || 2,
            speedAdherenceScore: userProfile.speedAdherenceScore || 1,
            nightDrivingScore: userProfile.nightDrivingScore || 5
          }} />
        </div>

        {/* Community Pool */}
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <CommunityPool 
            pool={{
              poolAmount: communityPoolData.poolAmount,
              safetyFactor: communityPoolData.safetyFactor,
              participantCount: communityPoolData.participantCount,
              safeDriverCount: communityPoolData.safeDriverCount
            }}
          />
        </div>

        {/* Gamification */}
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Gamification 
            achievements={achievementsData}
            leaderboard={leaderboardData}
            currentUser={userData}
            profile={{
              currentScore: userProfile.currentScore || 72,
              projectedRefund: userProfile.projectedRefund || 100.80,
              totalMiles: userProfile.totalMiles || 1107.70
            }}
            premiumAmount={Number(userData.premiumAmount)}
          />
        </div>

        {/* Refund Simulator */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <RefundSimulator 
            currentScore={userProfile.currentScore || 72}
            premiumAmount={Number(userData.premiumAmount)}
            poolSafetyFactor={communityPoolData.safetyFactor}
          />
        </div>
      </main>
      
      <BottomNavigation activeTab="home" />
    </div>
  );
}
