import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import LiquidGauge from "@/components/LiquidGauge";
import MetricsGrid from "@/components/MetricsGrid";
import CommunityPool from "@/components/CommunityPool";
import RefundSimulator from "@/components/RefundSimulator";
import RecentTrips from "@/components/RecentTrips";
import Gamification from "@/components/Gamification";
import QuickActions from "@/components/QuickActions";
import BottomSheet from "@/components/BottomSheet";
import FloatingActionButton from "@/components/FloatingActionButton";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Dashboard() {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  
  // Mock user ID - in real app this would come from auth context
  const userId = 2;
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', userId],
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        <DashboardHeader />
        <main className="px-4 pb-20">
          <div className="py-6 space-y-6">
            <div className="glass-morphism rounded-3xl p-6">
              <Skeleton className="h-8 w-48 mx-auto mb-4" />
              <Skeleton className="h-48 w-48 mx-auto mb-6 rounded-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center glass-morphism rounded-3xl p-8">
          <h1 className="text-xl font-semibold mb-2">Welcome to Driiva</h1>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white safe-area">
      <DashboardHeader user={dashboardData.user} />
      
      <main className="px-4 pb-20">
        {/* Hero Section - Driving Score */}
        <section className="py-6">
          <div className="rounded-3xl p-6 mb-6" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
          }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Driving Score</h2>
              <p className="text-gray-300 text-sm">Based on last 30 days of driving</p>
            </div>
            
            <LiquidGauge 
              score={dashboardData.profile.currentScore} 
              projectedRefund={dashboardData.profile.projectedRefund}
              premiumAmount={dashboardData.user.premiumAmount}
            />
          </div>
        </section>

        {/* Metrics Grid */}
        <MetricsGrid profile={dashboardData.profile} />

        {/* Community Pool */}
        <CommunityPool pool={dashboardData.communityPool} />

        {/* Refund Simulator */}
        <RefundSimulator 
          currentScore={dashboardData.profile.currentScore}
          premiumAmount={dashboardData.user.premiumAmount}
          poolSafetyFactor={dashboardData.communityPool?.safetyFactor || 0.80}
        />

        {/* Recent Trips */}
        <RecentTrips trips={dashboardData.recentTrips} />

        {/* Gamification */}
        <Gamification 
          achievements={dashboardData.achievements}
          leaderboard={dashboardData.leaderboard}
          currentUser={dashboardData.user}
        />

        {/* Quick Actions */}
        <QuickActions onReportIncident={() => setBottomSheetOpen(true)} />
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Bottom Sheet */}
      <BottomSheet 
        isOpen={bottomSheetOpen} 
        onClose={() => setBottomSheetOpen(false)}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />
    </div>
  );
}
