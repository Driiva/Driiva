import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, DollarSign, Trophy, Users } from "lucide-react";

export default function Rewards() {
  const user = localStorage.getItem("driiva_user");
  const userId = user ? JSON.parse(user).id : null;
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white">
        <DashboardHeader />
        <main className="px-4 pb-20">
          <div className="py-6 space-y-6">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white safe-area">
      <DashboardHeader />
      
      <main className="px-4 pb-20">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Rewards & Refunds</h1>
            <Badge variant="outline" className="glass-morphism border-[#10B981]">
              Active
            </Badge>
          </div>

          {/* Current Refund Status */}
          <Card className="glass-border rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#10B981] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-[#10B981]" />
                </div>
                <h2 className="text-xl font-bold mb-2">Current Refund Status</h2>
                <p className="text-gray-400 text-sm">Annual refund projection</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Progress to max refund</span>
                  <span className="text-sm font-medium">
                    {((dashboardData?.profile?.currentScore || 0) / 100 * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={(dashboardData?.profile?.currentScore || 0)} 
                  className="h-2"
                />
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#10B981]">
                      £{dashboardData?.profile?.projectedRefund || '0.00'}
                    </div>
                    <div className="text-xs text-gray-400">Current Projection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#06B6D4]">
                      £{(Number(dashboardData?.user?.premiumAmount || 0) * 0.15).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">Maximum Possible</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Impact */}
          <Card className="glass-morphism border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#A855F7]" />
                <span>Community Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pool Safety Factor</span>
                  <span className="text-sm font-medium text-[#06B6D4]">
                    {((dashboardData?.communityPool?.safetyFactor || 0.80) * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {dashboardData?.communityPool?.safeDriverCount || 0}
                    </div>
                    <div className="text-xs text-gray-400">Safe Drivers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {dashboardData?.communityPool?.participantCount || 0}
                    </div>
                    <div className="text-xs text-gray-400">Total Participants</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Rewards */}
          <Card className="glass-morphism border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#F59E0B]" />
                <span>Achievement Rewards</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 glass-morphism rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#10B981] bg-opacity-20 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <span className="text-sm font-medium">Safe Driver (30 days)</span>
                  </div>
                  <Badge variant="outline" className="border-[#10B981] text-[#10B981]">
                    Unlocked
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 glass-morphism rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <span className="text-sm font-medium">Speed Master</span>
                  </div>
                  <Badge variant="outline" className="border-[#3B82F6] text-[#3B82F6]">
                    Unlocked
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 glass-morphism rounded-xl opacity-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm font-medium">Night Owl</span>
                  </div>
                  <Badge variant="outline" className="border-gray-600 text-gray-400">
                    Locked
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation activeTab="rewards" />
    </div>
  );
}
