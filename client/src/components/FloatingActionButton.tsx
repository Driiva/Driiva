import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <div className="floating-action">
      <button
        onClick={onClick}
        className="w-14 h-14 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full flex items-center justify-center shadow-2xl haptic-button spring-transition hover:scale-110 animate-float"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
