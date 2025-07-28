import DashboardHeader from "@/components/DashboardHeader";
import LiquidGauge from "@/components/LiquidGauge";
import MetricsGrid from "@/components/MetricsGrid";
import CommunityPool from "@/components/CommunityPool";
import RefundSimulator from "@/components/RefundSimulator";
import Gamification from "@/components/Gamification";
import BottomNavigation from "@/components/BottomNavigation";
import PolicyStatusWidget from "@/components/PolicyStatusWidget";
import PageTransition from "@/components/PageTransition";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../App";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white">Please sign in to continue</div>
      </div>
    );
  }

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: [`/api/dashboard/${user?.id}`],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#06B6D4]"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="glass-morphism p-8 rounded-2xl max-w-md mx-4 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-300 mb-6">
            {error?.message || 'Unable to load dashboard data'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { 
    user: dashboardUser, 
    profile, 
    recentTrips, 
    communityPool, 
    achievements, 
    leaderboard 
  } = dashboardData;

  // Fallback data to prevent undefined errors
  const safeUser = dashboardUser || user || {
    id: 1,
    name: 'User',
    premiumAmount: 1200,
    email: 'user@example.com'
  };

  const safeProfile = profile || {
    currentScore: 75,
    hardBrakingScore: 8,
    accelerationScore: 7,
    speedAdherenceScore: 9,
    nightDrivingScore: 6,
    corneringScore: 8,
    totalTrips: 0,
    totalMiles: '0',
    projectedRefund: 0
  };

  const safeCommunityPool = communityPool || {
    totalParticipants: 1000,
    averageScore: 75,
    poolAmount: 50000,
    safetyFactor: 0.8,
    yourRank: 150
  };

  return (
    <PageTransition>
      <div className="min-h-screen text-white bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <DashboardHeader user={safeUser} />
        <main className="px-4 pb-20">
          {/* Policy Status Widget */}
          <div className="pt-4 mb-3">
            <PolicyStatusWidget user={safeUser} />
          </div>

          {/* Driving Score Box */}
          <div className="mb-3">
            <LiquidGauge 
              score={safeProfile.currentScore}
              projectedRefund={safeProfile.projectedRefund}
              premiumAmount={Number(safeUser.premiumAmount)}
            />
          </div>

          {/* Metrics Grid Box */}
          <div className="mb-3">
            <MetricsGrid profile={safeProfile} />
          </div>

          {/* Community Pool Box */}
          <div className="mb-3">
            <CommunityPool 
              pool={{
                poolAmount: safeCommunityPool.poolAmount,
                safetyFactor: safeCommunityPool.safetyFactor,
                participantCount: safeCommunityPool.totalParticipants,
                safeDriverCount: Math.round(safeCommunityPool.totalParticipants * 0.8)
              }}
            />
          </div>

          {/* Gamification Box */}
          <div className="mb-3">
            <Gamification 
              achievements={achievements}
              leaderboard={leaderboard}
              currentUser={safeUser}
              profile={safeProfile}
              premiumAmount={Number(safeUser.premiumAmount)}
            />
          </div>

          {/* Refund Simulator Box */}
          <div className="mb-3">
            <RefundSimulator 
              currentScore={safeProfile.currentScore}
              premiumAmount={Number(safeUser.premiumAmount)}
              poolSafetyFactor={safeCommunityPool.safetyFactor}
            />
          </div>
        </main>
        <BottomNavigation activeTab="home" />
      </div>
    </PageTransition>
  );
}