import { Bell, Zap } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import { useLocation } from "wouter";

interface DashboardHeaderProps {
  user?: {
    firstName?: string;
    lastName?: string;
    username: string;
    email: string;
    premiumAmount: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [, setLocation] = useLocation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleLogoClick = () => {
    setLocation('/');
  };

  return (
    <header className="sticky top-0 z-40 glass-morphism">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleLogoClick}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] flex items-center justify-center animate-pulse hover:scale-105 transition-transform"
          >
            <Zap className="w-5 h-5 text-white animate-bounce" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Driiva</h1>
            <p className="text-xs text-gray-300">
              {getGreeting()}, {user?.firstName || user?.username || 'User'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="w-10 h-10 glass-morphism rounded-full flex items-center justify-center haptic-button">
            <Bell className="w-5 h-5 text-gray-300" />
          </button>
          {user && <ProfileDropdown user={user} />}
        </div>
      </div>
    </header>
  );
}