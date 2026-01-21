import { motion } from "framer-motion";
import { Home, Map, LayoutDashboard, User } from "lucide-react";
import { useLocation } from "wouter";
import { timing, microInteractions } from "@/lib/animations";

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const tabs = [
    { id: "home", icon: Home, label: "Home", path: "/dashboard" },
    { id: "trips", icon: Map, label: "Trips", path: "/trips" },
    { id: "rewards", icon: LayoutDashboard, label: "Rewards", path: "/rewards" },
    { id: "profile", icon: User, label: "Profile", path: "/profile" }
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/5 z-50"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto relative">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => handleNavigation(tab.path)}
            className="relative flex flex-col items-center min-h-[48px] min-w-[48px] justify-center px-4 py-2"
            whileTap={microInteractions.press}
            transition={{ duration: timing.quick }}
          >
            <motion.div
              animate={{ 
                scale: activeTab === tab.id ? 1.1 : 1,
                y: activeTab === tab.id ? -2 : 0
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <tab.icon 
                className={`w-6 h-6 mb-1 transition-colors duration-200 ease-out ${
                  activeTab === tab.id ? 'text-emerald-400' : 'text-white/50'
                }`} 
              />
            </motion.div>
            <span 
              className={`text-xs font-medium transition-colors duration-200 ease-out ${
                activeTab === tab.id ? 'text-emerald-400' : 'text-white/50'
              }`}
            >
              {tab.label}
            </span>
            
            {/* Active indicator bar */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-500 rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
