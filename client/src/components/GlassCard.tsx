import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = '' }: GlassCardProps) => {
  return (
    <div className={`
      backdrop-blur-xl bg-white/[0.08]
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.12)]
      rounded-2xl p-5
      transition-all duration-200 ease-out
      hover:scale-[1.01]
      hover:bg-white/[0.10]
      ${className}
    `}>
      {children}
    </div>
  );
};
