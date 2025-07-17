import { Bell, Zap } from "lucide-react";

interface DashboardHeaderProps {
  user?: {
    firstName?: string;
    username: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="sticky top-0 z-40 glass-morphism">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
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
          <button className="w-10 h-10 glass-morphism rounded-full flex items-center justify-center haptic-button">
            <div className="w-8 h-8 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {(user?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
