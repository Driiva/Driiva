import React from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GradientMesh } from '@/components/GradientMesh';
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
import { pageVariants, container, item, timing, easing } from "@/lib/animations";

interface DashboardProps {
  isLoading?: boolean;
}

export default function Dashboard({ isLoading = false }: DashboardProps) {
  const [userData] = React.useState<MetricUser>({
    id: 8,
    username: "driiva1",
    firstName: "Test",
    lastName: "Driver",
    email: "test@driiva.com",
    premiumAmount: "1840.00"
  });

  const [userProfile] = React.useState<Partial<DrivingProfile>>({
    currentScore: 72,
    projectedRefund: 100.80,
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div 
      className="min-h-screen text-white"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: timing.pageTransition, ease: easing.button }}
    >
      <GradientMesh />
      <DashboardHeader user={userData} />
      
      <motion.main 
        className="px-4 pb-28"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Policy Status Widget */}
        <motion.div className="pt-4 mb-6" variants={item}>
          <PolicyStatusWidget user={userData} />
        </motion.div>

        {/* Driving Score Gauge */}
        <motion.div className="mb-6" variants={item}>
          <LiquidGauge 
            score={userProfile.currentScore || 72}
            projectedRefund={userProfile.projectedRefund || 100.80}
            premiumAmount={Number(userData.premiumAmount)}
          />
        </motion.div>

        {/* Metrics Grid */}
        <motion.div className="mb-6" variants={item}>
          <MetricsGrid profile={{
            hardBrakingScore: userProfile.hardBrakingScore || 3,
            accelerationScore: userProfile.accelerationScore || 2,
            speedAdherenceScore: userProfile.speedAdherenceScore || 1,
            nightDrivingScore: userProfile.nightDrivingScore || 5
          }} />
        </motion.div>

        {/* Community Pool */}
        <motion.div className="mb-6" variants={item}>
          <CommunityPool 
            pool={{
              poolAmount: communityPoolData.poolAmount,
              safetyFactor: communityPoolData.safetyFactor,
              participantCount: communityPoolData.participantCount,
              safeDriverCount: communityPoolData.safeDriverCount
            }}
          />
        </motion.div>

        {/* Gamification */}
        <motion.div className="mb-6" variants={item}>
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
        </motion.div>

        {/* Refund Simulator */}
        <motion.div className="mb-8" variants={item}>
          <RefundSimulator 
            currentScore={userProfile.currentScore || 72}
            premiumAmount={Number(userData.premiumAmount)}
            poolSafetyFactor={communityPoolData.safetyFactor}
          />
        </motion.div>
      </motion.main>
      
      <BottomNavigation activeTab="home" />
    </motion.div>
  );
}
