import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Map } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import TripTimeline from "@/components/TripTimeline";

interface Trip {
  id: number;
  userId: number;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  distance: string;
  duration: number;
  score: number;
  hardBrakingEvents: number;
  harshAcceleration: number;
  speedViolations: number;
}

interface DashboardData {
  user: any;
}

export default function Trips() {
  const { userId, user } = useAuth();
  
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard', userId],
    enabled: !!userId,
  });
  
  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips', userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white">
        <DashboardHeader />
        <main className="px-4 pb-20">
          <div className="py-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white safe-area relative">
      <DashboardHeader user={dashboardData?.user} />
      
      <main className="px-4 pb-20 relative z-10">
        <div className="py-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Your Trips</h1>
          </div>

          {trips && trips.length > 0 ? (
            <TripTimeline trips={trips} />
          ) : (
            <div className="text-center py-12 relative z-20">
              <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
              <p className="text-gray-400">Start driving to see your trips here</p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation activeTab="trips" />
    </div>
  );
}
