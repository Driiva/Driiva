import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Clock, Navigation, Trophy } from "lucide-react";

export default function Trips() {
  const user = localStorage.getItem("driiva_user");
  const userId = user ? JSON.parse(user).id : null;
  
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard', userId],
    enabled: !!userId,
  });
  
  const { data: trips, isLoading } = useQuery({
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
    <div className="min-h-screen text-white safe-area">
      <DashboardHeader user={dashboardData?.user} />
      
      <main className="px-4 pb-20">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Your Trips</h1>
            <Badge variant="outline" className="glass-morphism border-[#06B6D4]">
              {trips?.length || 0} trips
            </Badge>
          </div>

          <div className="space-y-4">
            {trips?.map((trip: any) => (
              <Card key={trip.id} className="glass-morphism border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#06B6D4] bg-opacity-20 rounded-xl flex items-center justify-center">
                        <Map className="w-6 h-6 text-[#06B6D4]" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {trip.endLocation || 'Unknown Destination'}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{trip.duration} min</span>
                          <Navigation className="w-4 h-4" />
                          <span>{Number(trip.distance).toFixed(1)} miles</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-4 h-4 text-[#10B981]" />
                        <span className="text-lg font-bold text-[#10B981]">
                          {trip.score}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Score</div>
                    </div>
                  </div>
                  
                  {trip.hardBrakingEvents > 0 || trip.harshAcceleration > 0 || trip.speedViolations > 0 ? (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex items-center space-x-4 text-xs">
                        {trip.hardBrakingEvents > 0 && (
                          <span className="text-[#EF4444]">
                            {trip.hardBrakingEvents} hard braking
                          </span>
                        )}
                        {trip.harshAcceleration > 0 && (
                          <span className="text-[#F59E0B]">
                            {trip.harshAcceleration} harsh acceleration
                          </span>
                        )}
                        {trip.speedViolations > 0 && (
                          <span className="text-[#EF4444]">
                            {trip.speedViolations} speed violations
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          {(!trips || trips.length === 0) && (
            <div className="text-center py-12">
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
