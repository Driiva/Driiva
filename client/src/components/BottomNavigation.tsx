import { Home, Map, Gift, User } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const tabs = [
    { id: "home", icon: Home, label: "Home", path: "/" },
    { id: "trips", icon: Map, label: "Trips", path: "/trips" },
    { id: "rewards", icon: Gift, label: "Rewards", path: "/rewards" },
    { id: "profile", icon: User, label: "Profile", path: "/profile" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-morphism safe-area">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLocation(tab.path)}
            className="flex flex-col items-center py-2 px-4 haptic-button"
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
