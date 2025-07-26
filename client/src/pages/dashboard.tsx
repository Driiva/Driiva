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
import PolicyStatusWidget from "@/components/PolicyStatusWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import AIRiskInsights from "@/components/AIRiskInsights";
import AIInsights from "@/components/AIInsights";

export default function Dashboard() {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Get user ID from authenticated user
  const user = localStorage.getItem("driiva_user");
  const userId = user ? JSON.parse(user).id : null;

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', userId],
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Infinite scroll for trips
  const { data: tripsData } = useQuery({
    queryKey: ['/api/trips', userId, page],
    enabled: page > 1, // Only fetch additional pages after first load
  });

  useEffect(() => {
    if (dashboardData?.recentTrips && page === 1) {
      setAllTrips(dashboardData.recentTrips);
    }
  }, [dashboardData?.recentTrips, page]);

  useEffect(() => {
    if (tripsData && page > 1) {
      setAllTrips(prev => [...prev, ...tripsData]);
      setHasMore(Array.isArray(tripsData) ? tripsData.length === 20 : false); // Assuming 20 trips per page
    }
  }, [tripsData, page]);

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000 && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
      <DashboardHeader user={dashboardData?.user} />

      <main className="px-4 pb-20">
        {/* Policy Status Widget */}
        {dashboardData?.user && <PolicyStatusWidget user={dashboardData.user} />}

        {/* Hero Section - Driving Score */}
        <section className="py-2">
          <div className="glass-morphism rounded-xl p-3 mb-3">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold mb-1">Your Driving Score</h2>
              <p className="text-gray-300 text-xs">Based on last 30 days of driving</p>
            </div>

            {dashboardData?.profile && (
              <LiquidGauge 
                score={dashboardData.profile.currentScore} 
                projectedRefund={dashboardData.profile.projectedRefund}
                premiumAmount={dashboardData.user?.premiumAmount || 0}
              />
            )}
          </div>
        </section>

        {/* Metrics Grid */}
        {dashboardData?.profile && <MetricsGrid profile={dashboardData.profile} />}

        {/* Community Pool */}
        {dashboardData?.communityPool && <CommunityPool pool={dashboardData.communityPool} />}

        {/* Refund Simulator */}
        {dashboardData?.profile && dashboardData?.user && (
          <RefundSimulator 
            currentScore={dashboardData.profile.currentScore}
            premiumAmount={dashboardData.user.premiumAmount}
            poolSafetyFactor={dashboardData.communityPool?.safetyFactor || 0.80}
          />
        )}

        {/* AI Insights */}
        <AIInsights className="mb-6" />

        {/* Gamification */}
        {dashboardData?.achievements && dashboardData?.leaderboard && dashboardData?.user && (
          <Gamification 
            achievements={dashboardData.achievements}
            leaderboard={dashboardData.leaderboard}
            currentUser={dashboardData.user}
          />
        )}

        {/* Recent Trips with Infinite Scroll */}
        <RecentTrips trips={allTrips} />
        
        {hasMore && page > 1 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

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