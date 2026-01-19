import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = '' }: GlassCardProps) => {
  return (
    <div className={`
      bg-slate-900/40 backdrop-blur-sm
      border border-white/5
      rounded-2xl p-5
      transition-all duration-300
      hover:bg-slate-900/50
      hover:border-white/10
      ${className}
    `}>
      {children}
    </div>
  );
};
