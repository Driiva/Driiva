import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, Bell, Shield, HelpCircle, LogOut, ChevronRight, Moon, Globe } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', action: () => {} },
        { icon: Moon, label: 'Dark Mode', action: () => {}, toggle: true },
        { icon: Globe, label: 'Language', value: 'English', action: () => {} },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: Shield, label: 'Privacy & Security', action: () => {} },
        { icon: HelpCircle, label: 'Help & Support', action: () => setLocation('/support') },
      ]
    }
  ];

  return (
    <PageWrapper>
      <div className="pb-24 text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => setLocation('/dashboard')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </motion.div>

        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <h2 className="text-sm font-medium text-white/60 mb-3 px-1">{group.title}</h2>
              <div className="dashboard-glass-card divide-y divide-white/10">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-white/60" />
                      <span className="text-white">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-white/40 text-sm">{item.value}</span>
                      )}
                      {item.toggle ? (
                        <div className="w-10 h-6 bg-white/20 rounded-full relative">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleLogout}
              className="w-full dashboard-glass-card flex items-center justify-center gap-2 p-4 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </motion.div>
        </div>
      </div>

      <BottomNav />
    </PageWrapper>
  );
}
