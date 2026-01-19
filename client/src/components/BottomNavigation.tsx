import { Home, Map, LayoutDashboard, User } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const tabs = [
    { id: "home", icon: Home, label: "Home", path: "/" },
    { id: "trips", icon: Map, label: "Trips", path: "/trips" },
    { id: "rewards", icon: LayoutDashboard, label: "Dashboard", path: "/rewards" },
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
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleNavigation(tab.path)}
            className="flex flex-col items-center min-h-[48px] min-w-[48px] justify-center px-4 py-2 transition-all duration-200 ease-out active:scale-95"
          >
            <tab.icon 
              className={`w-6 h-6 mb-1 transition-colors duration-200 ease-out ${
                activeTab === tab.id ? 'text-emerald-400' : 'text-white/50'
              }`} 
            />
            <span 
              className={`text-xs font-medium transition-colors duration-200 ease-out ${
                activeTab === tab.id ? 'text-emerald-400' : 'text-white/50'
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
