import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import LiquidGauge from "@/components/LiquidGauge";
import MetricsGrid from "@/components/MetricsGrid";
import CommunityPool from "@/components/CommunityPool";
import RefundSimulator from "@/components/RefundSimulator";
import Gamification from "@/components/Gamification";
import BottomNavigation from "@/components/BottomNavigation";
import PolicyStatusWidget from "@/components/PolicyStatusWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { userId, isAuthenticated } = useAuth();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/signin');
      return;
    }
  }, [isAuthenticated, setLocation]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', userId],
    enabled: !!userId && isAuthenticated,
    refetchInterval: 30000,
  });

  const data = dashboardData as any;

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
        <BottomNavigation activeTab="home" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center glass-morphism rounded-3xl p-8">
          <h1 className="text-xl font-semibold mb-2">Welcome to Driiva</h1>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
        <BottomNavigation activeTab="home" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white safe-area">
      <DashboardHeader user={data?.user} />

      <main className="px-4 pb-20">
        {/* Policy Status Widget */}
        {data?.user && <PolicyStatusWidget user={data.user} />}

        {/* Hero Section - Driving Score */}
        <section className="py-2">
          <div className="glass-morphism rounded-xl p-3 mb-3">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold mb-1">Your Driving Score</h2>
              <p className="text-gray-300 text-xs">Based on last 30 days of driving</p>
            </div>

            {data?.profile && (
              <LiquidGauge 
                score={data.profile.currentScore} 
                projectedRefund={data.profile.projectedRefund}
                premiumAmount={data.user?.premiumAmount || 0}
              />
            )}
          </div>
        </section>

        {/* Metrics Grid */}
        {data?.profile && <MetricsGrid profile={data.profile} />}

        {/* Community Pool */}
        {data?.communityPool && <CommunityPool pool={data.communityPool} />}

        {/* Refund Simulator */}
        {data?.profile && data?.user && (
          <RefundSimulator 
            currentScore={data.profile.currentScore}
            premiumAmount={data.user.premiumAmount}
            poolSafetyFactor={data.communityPool?.safetyFactor || 0.80}
          />
        )}

        {/* Gamification */}
        {data?.achievements && data?.leaderboard && data?.user && (
          <Gamification 
            achievements={data.achievements}
            leaderboard={data.leaderboard}
            currentUser={data.user}
          />
        )}
      </main>

      <BottomNavigation activeTab="home" />
    </div>
  );
}