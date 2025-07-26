import { Navigation } from "lucide-react";
import { useLocation } from "wouter";

interface FloatingActionButtonProps {
  onClick?: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    // Trip recording functionality removed
  };

  return (
    <div className="floating-action">
      <button
        onClick={handleClick}
        className="w-14 h-14 bg-gradient-to-r from-[#8B4513] to-[#B87333] rounded-full flex items-center justify-center shadow-2xl haptic-button spring-transition hover:scale-110 animate-float glass-morphism"
      >
        <Navigation className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
