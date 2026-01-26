import { useState } from 'react';
import { useLocation } from 'wouter';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  showDemoMode?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ 
  title, 
  subtitle,
  showDemoMode = false 
}) => {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Clear all local storage auth data
      localStorage.removeItem('driiva-demo-mode');
      localStorage.removeItem('driiva-demo-user');
      localStorage.removeItem('driiva-auth-token');
      localStorage.removeItem('sb-auth-token');
      
      // Clear all session storage
      sessionStorage.clear();
      
      // Sign out from Supabase (clears Supabase session)
      await supabase.auth.signOut();
      
      // Clear auth context
      setUser(null);
      
      // Redirect to homepage
      setLocation('/');
    } catch (error) {
      console.error('[AuthHeader] Logout error:', error);
      // Still clear and redirect even if signOut fails
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setLocation('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 flex items-start justify-between"
    >
      <div className="flex-1">
        {subtitle && <p className="text-white/60 text-sm">{subtitle}</p>}
        {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
        {showDemoMode && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
            Demo Mode
          </span>
        )}
      </div>
      
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 
                   transition-all duration-200 disabled:opacity-50"
        aria-label="Log out"
        title="Log out"
      >
        {isLoggingOut ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
        )}
      </button>
    </motion.div>
  );
};
