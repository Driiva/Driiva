import { useLocation, Link } from 'wouter';
import { Home, Map, TrendingUp, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const [location] = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Map, label: 'Trips', path: '/trips' },
    { icon: TrendingUp, label: 'Dashboard', path: '/dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
    >
      <div 
        className="backdrop-blur-xl border-t border-white/[0.08]"
        style={{
          background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.70))',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="max-w-md mx-auto flex justify-around py-2 px-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location === path;
            
            return (
              <Link
                key={path}
                href={path}
                className="flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 relative min-h-[44px] min-w-[44px] justify-center"
              >
                <div className={`
                  relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isActive 
                    ? 'scale-105' 
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                  }
                `}>
                  {/* Active background glow */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        backdropFilter: 'blur(8px)',
                      }}
                    />
                  )}
                  
                  <Icon className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                    isActive 
                      ? 'text-emerald-400 drop-shadow-sm' 
                      : 'text-white/60'
                  }`} />
                </div>
                
                <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-emerald-400' 
                    : 'text-white/40'
                }`}>
                  {label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
