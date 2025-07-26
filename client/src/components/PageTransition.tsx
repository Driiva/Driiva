import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  pageKey: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export default function PageTransition({ children, pageKey, direction = 'right' }: PageTransitionProps) {
  const variants = {
    initial: (direction: string) => {
      switch (direction) {
        case 'left':
          return { x: '-100%', opacity: 0 };
        case 'right':
          return { x: '100%', opacity: 0 };
        case 'up':
          return { y: '-100%', opacity: 0 };
        case 'down':
          return { y: '100%', opacity: 0 };
        default:
          return { x: '100%', opacity: 0 };
      }
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
    },
    exit: (direction: string) => {
      switch (direction) {
        case 'left':
          return { x: '100%', opacity: 0 };
        case 'right':
          return { x: '-100%', opacity: 0 };
        case 'up':
          return { y: '100%', opacity: 0 };
        case 'down':
          return { y: '-100%', opacity: 0 };
        default:
          return { x: '-100%', opacity: 0 };
      }
    },
  };

  const transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pageKey}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}