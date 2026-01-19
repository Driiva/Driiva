import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

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
      whileTap={interactive ? { scale: 0.98 } : undefined}
      whileHover={interactive ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
