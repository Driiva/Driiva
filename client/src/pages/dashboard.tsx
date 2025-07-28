
import React from 'react';
import DashboardHeader from "@/components/DashboardHeader";
import LiquidGauge from "@/components/LiquidGauge";
import MetricsGrid from "@/components/MetricsGrid";
import CommunityPool from "@/components/CommunityPool";
import RefundSimulator from "@/components/RefundSimulator";
import Gamification from "@/components/Gamification";
import BottomNavigation from "@/components/BottomNavigation";
import PolicyStatusWidget from "@/components/PolicyStatusWidget";

export default function Dashboard() {
  // Stable mock data - optimized for runtime stability
  const userData = {
    id: 8,
    username: "driiva1",
    firstName: "Test",
    lastName: "Driver",
    email: "test@driiva.com",
    premiumAmount: "1840.00"
  };

  const userProfile = {
    currentScore: 72, // Test score above 70% threshold
    projectedRefund: 100.80, // Calculated: (1840 * 5.48%) for score 72
    totalMiles: 1107.70,
    totalTrips: 26,
    hardBrakingScore: 3,
    accelerationScore: 2,
    speedAdherenceScore: 1,
    nightDrivingScore: 5
  };

  const communityPoolData = {
    poolAmount: 105000,
    safetyFactor: 0.85,
    totalParticipants: 1000,
    averageScore: 82
  };

  const achievementsData = [
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
  ];

  const leaderboardData = [
    {
      id: 1,
      userId: 8,
      rank: 1,
      score: 89,
      weeklyScore: 92
    }
  ];

  return (
    <div className="min-h-screen text-white">
      <DashboardHeader user={userData} />
      
      <main className="px-4 pb-20">
        {/* Policy Status Widget */}
        <div className="pt-4 mb-4">
          <PolicyStatusWidget user={userData} />
        </div>

        {/* Driving Score Gauge */}
        <div className="mb-4">
          <LiquidGauge 
            score={userProfile.currentScore}
            projectedRefund={userProfile.projectedRefund}
            premiumAmount={Number(userData.premiumAmount)}
          />
        </div>

        {/* Metrics Grid */}
        <div className="mb-4">
          <MetricsGrid profile={userProfile} />
        </div>

        {/* Community Pool */}
        <div className="mb-4">
          <CommunityPool 
            pool={{
              poolAmount: communityPoolData.poolAmount,
              safetyFactor: communityPoolData.safetyFactor,
              participantCount: communityPoolData.totalParticipants,
              safeDriverCount: Math.round(communityPoolData.totalParticipants * 0.8)
            }}
          />
        </div>

        {/* Gamification */}
        <div className="mb-4">
          <Gamification 
            achievements={achievementsData}
            leaderboard={leaderboardData}
            currentUser={userData}
            profile={userProfile}
            premiumAmount={Number(userData.premiumAmount)}
          />
        </div>

        {/* Refund Simulator */}
        <div className="mb-4">
          <RefundSimulator 
            currentScore={userProfile.currentScore}
            premiumAmount={Number(userData.premiumAmount)}
            poolSafetyFactor={communityPoolData.safetyFactor}
          />
        </div>
      </main>
      
      <BottomNavigation activeTab="home" />
    </div>
  );
}
