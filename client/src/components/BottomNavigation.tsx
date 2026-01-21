import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Home', id: 'home' },
    { path: '/trips', icon: '🗺️', label: 'Trips', id: 'trips' },
    { path: '/rewards', icon: '📊', label: 'Dashboard', id: 'rewards' },
    { path: '/profile', icon: '👤', label: 'Profile', id: 'profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 
                  backdrop-blur-2xl bg-[#0F172A]/90 border-t border-white/[0.08]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location === item.path || activeTab === item.id;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full 
                       transition-colors relative min-h-[48px]"
            >
              <span className={`text-2xl mb-1 transition-transform ${
                isActive ? 'scale-110' : 'scale-100'
              }`}>
                {item.icon}
              </span>
              <span className={`text-xs font-medium transition-colors ${
                isActive ? 'text-emerald-400' : 'text-white/50'
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 
                              w-1 h-1 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
