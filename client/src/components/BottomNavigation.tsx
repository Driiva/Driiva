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
      className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleNavigation(tab.path)}
            className="flex flex-col items-center min-h-[44px] min-w-[44px] justify-center px-4 py-2 transition-all duration-200 ease-out active:scale-95"
          >
            <tab.icon 
              className={`w-6 h-6 mb-1 transition-colors duration-200 ease-out ${
                activeTab === tab.id ? 'text-purple-400' : 'text-gray-500'
              }`} 
            />
            <span 
              className={`text-xs font-semibold transition-colors duration-200 ease-out ${
                activeTab === tab.id ? 'text-purple-400' : 'text-gray-500'
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
