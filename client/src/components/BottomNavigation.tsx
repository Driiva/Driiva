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
    <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 z-50 safe-area-inset-bottom"
    >
      <div className="flex justify-around items-center py-3 px-4 max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleNavigation(tab.path)}
            className="flex flex-col items-center py-2 px-4"
          >
            <tab.icon 
              className={`w-5 h-5 mb-1 ${
                activeTab === tab.id ? 'text-[#8B4513]' : 'text-gray-400'
              }`} 
            />
            <span 
              className={`text-xs font-medium ${
                activeTab === tab.id ? 'text-[#8B4513]' : 'text-gray-400'
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