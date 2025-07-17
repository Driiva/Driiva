import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import DataExport from "@/components/DataExport";
import DeleteAccount from "@/components/DeleteAccount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Car, Shield, Settings, Download, Trash2 } from "lucide-react";

export default function Profile() {
  const userId = 1;
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard', userId],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white">
        <DashboardHeader />
        <main className="px-4 pb-20">
          <div className="py-6 space-y-6">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white safe-area">
      <DashboardHeader />
      
      <main className="px-4 pb-20">
        <div className="py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <Badge variant="outline" className="glass-morphism border-[#10B981]">
              Verified
            </Badge>
          </div>

          {/* Profile Overview */}
          <Card className="glass-border rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {dashboardData?.user?.firstName || 'User'} {dashboardData?.user?.lastName || ''}
                  </h2>
                  <p className="text-gray-400">@{dashboardData?.user?.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#10B981]">
                    {dashboardData?.profile?.currentScore || 0}
                  </div>
                  <div className="text-xs text-gray-400">Current Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#06B6D4]">
                    {dashboardData?.profile?.totalTrips || 0}
                  </div>
                  <div className="text-xs text-gray-400">Total Trips</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="glass-morphism border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-[#3B82F6]" />
                <span>Account Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Email</span>
                <span className="text-sm font-medium">{dashboardData?.user?.email || 'Not set'}</span>
              </div>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Phone</span>
                <span className="text-sm font-medium">{dashboardData?.user?.phoneNumber || 'Not set'}</span>
              </div>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Premium</span>
                <span className="text-sm font-medium">£{dashboardData?.user?.premiumAmount || '0.00'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Driving Statistics */}
          <Card className="glass-morphism border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-[#F59E0B]" />
                <span>Driving Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {Number(dashboardData?.profile?.totalMiles || 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Total Miles</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {dashboardData?.profile?.hardBrakingScore || 0}
                  </div>
                  <div className="text-xs text-gray-400">Hard Braking Events</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {dashboardData?.profile?.speedAdherenceScore || 0}
                  </div>
                  <div className="text-xs text-gray-400">Speed Violations</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {dashboardData?.profile?.nightDrivingScore || 0}
                  </div>
                  <div className="text-xs text-gray-400">Night Trips</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card className="glass-morphism border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#A855F7]" />
                <span>Privacy & Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataExport userId={userId} />
              <Separator className="bg-gray-600" />
              <DeleteAccount userId={userId} />
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation activeTab="profile" />
    </div>
  );
}
