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
        className="relative p-2 rounded-lg glass-morphism-subtle hover:bg-white/20 transition-all duration-200"
      >
        <Bell className="w-4 h-4 text-white" />
        {hasUnread && (
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-morphism rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>
          
          <div className="p-4">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-sm text-gray-400 mb-1">You have no unread messages</p>
              <p className="text-xs text-gray-500">We'll notify you when something important happens</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}