import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, LogOut, Download, HelpCircle, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "wouter";
import { timing, easing, microInteractions } from "@/lib/animations";

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

function DropdownMenuItem({ children, onClick, className = "" }: DropdownMenuItemProps) {
  return (
    <motion.button
      className={`w-full flex items-center space-x-3 p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors ${className}`}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={microInteractions.tap}
      transition={{ duration: timing.quick }}
    >
      {children}
    </motion.button>
  );
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

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

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setLocation(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 backdrop-blur-xl bg-white/[0.08] border border-white/[0.08] rounded-full p-2 min-h-[44px]"
        whileTap={microInteractions.tap}
        transition={{ duration: timing.quick }}
      >
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
          <span className="text-xs font-semibold text-white/80">
            {profileData.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: timing.interaction }}
        >
          <ChevronDown className="w-4 h-4 text-white/50" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: timing.quick, ease: easing.button }}
            className="fixed top-16 right-4 w-72 max-w-[calc(100vw-32px)] backdrop-blur-xl bg-white/[0.12] border border-white/[0.1] rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            {/* Profile Header */}
            <div className="p-4 border-b border-white/[0.08]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-white/80">
                    {profileData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{profileData.name}</div>
                  <div className="text-xs text-white/50 truncate">{profileData.email}</div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Vehicle</span>
                  <span className="text-xs text-white/70 font-medium">{profileData.vehicle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Policy Number</span>
                  <span className="text-xs text-white/70 font-medium">{profileData.policyNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Member Since</span>
                  <span className="text-xs text-white/70 font-medium">{profileData.memberSince}</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <DropdownMenuItem onClick={() => handleNavigate('/documents')}>
                <FileText className="w-4 h-4 text-white/60" />
                <span className="text-sm">Documents</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleNavigate('/profile')}>
                <Download className="w-4 h-4 text-white/60" />
                <span className="text-sm">Export Data</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleNavigate('/support')}>
                <HelpCircle className="w-4 h-4 text-white/60" />
                <span className="text-sm">Support</span>
              </DropdownMenuItem>

              <div className="my-2 border-t border-white/[0.08]" />
              
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  setLocation("/signin");
                }}
                className="text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </DropdownMenuItem>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
