import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = '' }: GlassCardProps) => {
  return (
    <div className={`
      backdrop-blur-md bg-white/60
      border border-white/20
      shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]
      rounded-3xl p-6
      transition-all duration-300
      hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25)]
      hover:translate-y-[-2px]
      ${className}
    `}>
      {children}
    </div>
  );
};
