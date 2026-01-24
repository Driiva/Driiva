import { useLocation, Link } from 'wouter';
import { Home, Map, TrendingUp, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const [location] = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Map, label: 'Trips', path: '/trips' },
    { icon: TrendingUp, label: 'Score', path: '/rewards' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-md mx-auto flex justify-around py-3">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            href={path}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              location === path 
                ? 'text-cyan-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
