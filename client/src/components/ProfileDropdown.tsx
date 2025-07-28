import { useState, useRef, useEffect } from "react";
import { User, Car, FileText, Settings, LogOut, ChevronDown, Download, HelpCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "wouter";

interface ProfileDropdownProps {
  user: {
    firstName?: string;
    lastName?: string;
    username: string;
    email: string;
    premiumAmount: string;
  };
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  return (
    <div
      className={`flex items-center space-x-2 cursor-pointer hover:bg-white/10 p-2 rounded ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

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
              <DropdownMenuItem 
                className="flex items-center space-x-2 cursor-pointer hover:bg-white/10"
                onClick={() => window.location.href = '/documents'}
              >
                <FileText className="w-4 h-4" />
                <span>Documents</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center space-x-2 cursor-pointer hover:bg-white/10"
                onClick={() => window.location.href = '/profile'}
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center space-x-2 cursor-pointer hover:bg-white/10"
                onClick={() => window.location.href = '/support'}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center space-x-2 cursor-pointer hover:bg-white/10"
              onClick={() => {
                logout();
                setLocation("/signin");
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </div>
        </div>
      )}
    </div>
  );
}