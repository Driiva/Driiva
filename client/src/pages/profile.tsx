import DashboardHeader from "@/components/DashboardHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { GradientMesh } from "@/components/GradientMesh";
import { GlassCard } from "@/components/GlassCard";
import PolicyDownload from "@/components/PolicyDownload";
import DeleteAccount from "@/components/DeleteAccount";
import { User, Car, Shield, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Profile() {
  const { toast } = useToast();
  const [showCoverageDropdown, setShowCoverageDropdown] = useState(false);
  const [selectedCoverage, setSelectedCoverage] = useState("Comprehensive Plus");
  const [locationTracking, setLocationTracking] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  const coverageOptions = [
    { value: "comprehensive-plus", label: "Comprehensive Plus", description: "Full coverage with extras" },
    { value: "comprehensive", label: "Comprehensive", description: "Standard full coverage" },
    { value: "third-party", label: "Third Party", description: "Basic legal requirement" }
  ];
  
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

  return (
    <div className="min-h-screen text-white">
      <GradientMesh />
      <DashboardHeader user={userData} />
      
      <main className="px-4 pb-28">
        <div className="pt-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Profile</h1>
            <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
              <span className="text-xs font-medium text-emerald-400">Verified</span>
            </div>
          </div>
        </div>

        {/* Profile Overview */}
        <GlassCard className="p-6 mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-semibold text-white/80">
                {userData.firstName[0]}{userData.lastName[0]}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              {userData.firstName} {userData.lastName}
            </h2>
            <p className="text-sm text-white/50">@{userData.username}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-semibold text-emerald-400">
                {profileData.currentScore}
              </div>
              <div className="text-xs text-white/50 mt-1">Current Score</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-semibold text-white">
                {profileData.totalTrips}
              </div>
              <div className="text-xs text-white/50 mt-1">Total Trips</div>
            </div>
          </div>
        </GlassCard>

        {/* Account Details */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-white/60" />
            <h3 className="text-base font-semibold text-white">Account Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Email</span>
              <span className="text-sm font-medium text-white">{userData.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Phone</span>
              <span className="text-sm font-medium text-white">{userData.phoneNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Premium</span>
              <span className="text-sm font-medium text-white">£{userData.premiumAmount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Policy Number</span>
              <span className="text-sm font-medium text-white">DRV-2025-000001</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Policy Start</span>
              <span className="text-sm font-medium text-white">July 1, 2025</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-white/50">Coverage Type</span>
              <div className="relative">
                <button
                  onClick={() => setShowCoverageDropdown(!showCoverageDropdown)}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 min-h-[44px] transition-all duration-200 ease-out"
                  data-testid="coverage-dropdown-button"
                >
                  {selectedCoverage}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCoverageDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCoverageDropdown && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-64 backdrop-blur-xl bg-white/10 border border-white/10 rounded-xl z-50 overflow-hidden"
                    role="listbox"
                    data-testid="coverage-dropdown-menu"
                  >
                    {coverageOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedCoverage(option.label);
                          setShowCoverageDropdown(false);
                          toast({
                            title: `Coverage changed to ${option.label}`,
                            description: option.description,
                          });
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-all duration-200 ease-out min-h-[44px]"
                        role="option"
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-white/50">{option.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Driving Statistics */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Car className="w-5 h-5 text-white/60" />
            <h3 className="text-base font-semibold text-white">Driving Statistics</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-lg font-semibold text-white">
                {profileData.totalMiles.toFixed(1)}
              </div>
              <div className="text-xs text-white/50 mt-1">Miles This Month</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-lg font-semibold text-white">
                {profileData.hardBrakingScore}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {profileData.hardBrakingScore === 1 ? 'Harsh Braking Event' : 'Harsh Braking Events'}
              </div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-lg font-semibold text-white">
                {profileData.speedAdherenceScore}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {profileData.speedAdherenceScore === 1 ? 'Speed Violation' : 'Speed Violations'}
              </div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-lg font-semibold text-white">
                {profileData.nightDrivingScore}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {profileData.nightDrivingScore === 1 ? 'Night Trip' : 'Night Trips'}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Preferences */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-white/60" />
            <h3 className="text-base font-semibold text-white">Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="text-sm font-medium text-white">Location Tracking</div>
                <div className="text-xs text-white/50">Required for trip recording</div>
              </div>
              <button
                onClick={() => setLocationTracking(!locationTracking)}
                className={`w-12 h-7 rounded-full transition-all duration-200 ease-out relative ${
                  locationTracking ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-200 ease-out ${
                  locationTracking ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="text-sm font-medium text-white">Push Notifications</div>
                <div className="text-xs text-white/50">Trip summaries and alerts</div>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`w-12 h-7 rounded-full transition-all duration-200 ease-out relative ${
                  pushNotifications ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-200 ease-out ${
                  pushNotifications ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Privacy & Data */}
        <GlassCard className="p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-white/60" />
            <h3 className="text-base font-semibold text-white">Privacy & Data</h3>
          </div>
          
          <div className="space-y-3">
            <PolicyDownload userId={userData.id} userData={userData} />
            <div className="border-t border-white/5 pt-3">
              <DeleteAccount userId={userData.id} />
            </div>
          </div>
        </GlassCard>
      </main>

      <BottomNavigation activeTab="profile" />
    </div>
  );
}
