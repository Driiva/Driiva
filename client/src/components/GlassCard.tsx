import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { timing, microInteractions } from "@/lib/animations";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function GlassCard({ 
  children, 
  className = "", 
  interactive = true,
  ...props 
}: GlassCardProps) {
  return (
    <motion.div
      className={`
        backdrop-blur-xl 
        bg-white/[0.08] 
        border border-white/[0.08] 
        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        rounded-2xl
        ${className}
      `}
      whileTap={interactive ? microInteractions.tap : undefined}
      whileHover={interactive ? microInteractions.hoverSubtle : undefined}
      transition={{ duration: timing.quick }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
