import { useState, useRef, useEffect } from "react";
import { User, Car, FileText, Settings, LogOut, ChevronDown } from "lucide-react";

interface ProfileDropdownProps {
  user: {
    firstName?: string;
    lastName?: string;
    username: string;
    email: string;
    premiumAmount: string;
  };
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock data - in real app this would come from user profile
  const profileData = {
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
    vehicle: "2023 Tesla Model 3",
    policyNumber: "DRV-2024-000001",
    email: user.email,
    memberSince: "January 2024"
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: User, label: "View Profile", onClick: () => console.log("View profile") },
    { icon: Car, label: "Vehicle Details", onClick: () => console.log("Vehicle details") },
    { icon: FileText, label: "Policy Documents", onClick: () => console.log("Policy documents") },
    { icon: Settings, label: "Settings", onClick: () => console.log("Settings") },
    { icon: LogOut, label: "Sign Out", onClick: () => console.log("Sign out"), danger: true }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 glass-morphism rounded-full p-2 haptic-button spring-transition hover:scale-105"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {profileData.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-morphism rounded-2xl shadow-xl border border-white/10 overflow-hidden z-50">
          {/* Profile Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {profileData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-semibold text-white">{profileData.name}</div>
                <div className="text-sm text-gray-400">{profileData.email}</div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Vehicle</span>
                <span className="text-xs text-white font-medium">{profileData.vehicle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Policy Number</span>
                <span className="text-xs text-white font-medium">{profileData.policyNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Member Since</span>
                <span className="text-xs text-white font-medium">{profileData.memberSince}</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 ${
                  item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}