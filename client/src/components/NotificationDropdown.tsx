import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg glass-morphism-subtle hover:bg-white/20 transition-all duration-200 w-8 h-8 flex items-center justify-center"
      >
        <Bell className="w-4 h-4 text-white" />
        {hasUnread && (
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{
          background: 'rgba(255, 255, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="p-3 border-b border-white/15">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>
          
          <div className="p-3">
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-12 h-12 bg-gray-800/30 rounded-full flex items-center justify-center mb-2">
                <Bell className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-white mb-1">You have no unread messages</p>
              <p className="text-xs text-white/70">We'll notify you when something important happens</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}