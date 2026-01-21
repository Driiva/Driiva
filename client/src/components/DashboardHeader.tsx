import { motion } from "framer-motion";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "./NotificationDropdown";
import { useLocation } from "wouter";
import { timing, microInteractions } from "@/lib/animations";

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
    setLocation('/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0F172A]/80 border-b border-white/[0.05]">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.button 
            onClick={handleLogoClick}
            whileTap={microInteractions.tap}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: timing.quick / 1000 }}
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-emerald-500/20 backdrop-blur-sm"
          >
            <img 
              src="/logo.png" 
              alt="Driiva" 
              className="w-full h-full object-cover"
            />
          </motion.button>
          <div>
            <h1 className="text-base font-semibold text-white">Driiva</h1>
            <p className="text-xs text-white/50">
              {getGreeting()}, {user?.firstName || user?.username || 'Driver'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <NotificationDropdown />
          {user && <ProfileDropdown user={user} />}
        </div>
      </div>
    </header>
  );
}
