
import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import PolicyDownload from "@/components/PolicyDownload";
import DeleteAccount from "@/components/DeleteAccount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Car, Shield, Settings, Download, Trash2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  
  // Static user data for stable demo
  const userData = {
    id: 8,
    username: "driiva1",
    firstName: "Test",
    lastName: "Driver",
    email: "test@driiva.com",
    premiumAmount: "1840.00",
    phoneNumber: "+44 7700 123456"
  };

  const profileData = {
    currentScore: 72,
    totalTrips: 28,
    totalMiles: 1168.50,
    hardBrakingScore: 3,
    accelerationScore: 2,
    speedAdherenceScore: 2,
    nightDrivingScore: 5
  };

  const isLoading = false;

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
    <div className="min-h-screen text-white">
      <DashboardHeader user={userData} />
      
      <main className="px-4 pb-20">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Profile</h1>
            <Badge variant="outline" className="glass-morphism border-[#10B981]">
              Verified
            </Badge>
          </div>

          {/* Profile Overview */}
          <Card className="glass-border rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="text-gray-400">@{userData.username}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#10B981]">
                    {profileData.currentScore}
                  </div>
                  <div className="text-xs text-gray-400">Current Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#06B6D4]">
                    {profileData.totalTrips}
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
                <span className="text-sm font-medium">{userData.email}</span>
              </div>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Phone</span>
                <span className="text-sm font-medium">{userData.phoneNumber}</span>
              </div>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Premium</span>
                <span className="text-sm font-medium">£{userData.premiumAmount}</span>
              </div>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Policy Number</span>
                <span className="text-sm font-medium">DRV-2025-000001</span>
              </div>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Policy Start</span>
                <span className="text-sm font-medium">July 1, 2025</span>
              </div>
              <Separator className="bg-gray-600" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Coverage Type</span>
                <div className="relative">
                  <button
                    onClick={() => toast({
                      title: "Comprehensive Plus Coverage",
                      description: "✓ Theft & Fire Protection\n✓ Third Party Liability\n✓ Personal Accident Cover\n✓ Windscreen Damage\n✓ Legal Expenses\n✓ Breakdown Assistance\n✓ Courtesy Car",
                    })}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    Comprehensive Plus
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
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
                    {profileData.totalMiles.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Miles This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {profileData.hardBrakingScore}
                  </div>
                  <div className="text-xs text-gray-400">
                    {profileData.hardBrakingScore === 1 ? 'Harsh Braking Event This Month' : 'Harsh Braking Events This Month'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {profileData.speedAdherenceScore}
                  </div>
                  <div className="text-xs text-gray-400">
                    {profileData.speedAdherenceScore === 1 ? 'Speed Violation This Month' : 'Speed Violations This Month'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {profileData.nightDrivingScore}
                  </div>
                  <div className="text-xs text-gray-400">
                    {profileData.nightDrivingScore === 1 ? 'Night Trip This Month' : 'Night Trips This Month'}
                  </div>
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
              <PolicyDownload userId={userData.id} userData={userData} />
              <Separator className="bg-gray-600" />
              <DeleteAccount userId={userData.id} />
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation activeTab="profile" />
    </div>
  );
}
