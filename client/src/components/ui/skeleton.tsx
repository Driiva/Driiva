import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

function Skeleton({ className, style, ...props }: SkeletonProps) {
  return (
    <motion.div
      className={cn("rounded-md bg-white/5", className)}
      style={style}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      {...(props as object)}
    />
  )
}

export { Skeleton }
