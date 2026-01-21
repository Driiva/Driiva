import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { timing, easing, microInteractions } from "@/lib/animations";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hasUnread] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={microInteractions.tap}
        transition={{ duration: timing.quick / 1000 }}
        className="relative p-2 text-white/60 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {hasUnread && (
          <motion.div 
            className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: timing.quick / 1000, ease: easing.button }}
            className="fixed top-16 right-4 w-72 max-w-[calc(100vw-32px)] backdrop-blur-xl bg-white/[0.12] border border-white/[0.1] rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
            </div>
            
            <div className="p-4">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-white/40" />
                </div>
                <p className="text-sm text-white/70 mb-1">No new notifications</p>
                <p className="text-xs text-white/40">We'll notify you when something happens</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
