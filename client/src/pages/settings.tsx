import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, Bell, Shield, HelpCircle, ChevronRight, Moon, Globe } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';

export default function Settings() {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('driiva-notifications') !== 'false';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('driiva-dark-mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('driiva-notifications', String(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('driiva-dark-mode', String(darkMode));
    if (darkMode) {
      document.documentElement.style.filter = 'brightness(0.88) contrast(1.05)';
    } else {
      document.documentElement.style.filter = '';
    }
    return () => {
      // Don't remove on unmount — persist across pages
    };
  }, [darkMode]);

  // Apply dark mode on mount if previously enabled
  useEffect(() => {
    if (localStorage.getItem('driiva-dark-mode') === 'true') {
      document.documentElement.style.filter = 'brightness(0.88) contrast(1.05)';
    }
  }, []);

  return (
    <PageWrapper>
      <div className="pb-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </motion.div>

        <div className="space-y-6">
          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <h2 className="text-sm font-medium text-white/60 mb-3 px-1">Preferences</h2>
            <div className="dashboard-glass-card divide-y divide-white/10">
              {/* Notifications */}
              <button
                onClick={() => setNotifications(!notifications)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-white/60" />
                  <span className="text-white">Notifications</span>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    notifications ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      notifications ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
              </button>

              {/* Dark Mode */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-white/60" />
                  <span className="text-white">Dark Mode</span>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    darkMode ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      darkMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
              </button>

              {/* Language */}
              <button
                onClick={() => {}}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-b-xl"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-white/60" />
                  <span className="text-white">Language</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-sm">English</span>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </div>
              </button>
            </div>
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-sm font-medium text-white/60 mb-3 px-1">Account</h2>
            <div className="dashboard-glass-card divide-y divide-white/10">
              <button
                onClick={() => setLocation('/privacy')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-white/60" />
                  <span className="text-white">Privacy & Security</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
              <button
                onClick={() => setLocation('/support')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-b-xl"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-white/60" />
                  <span className="text-white">Help & Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
