export const timing = {
  quick: 0.15,
  interaction: 0.2,
  cardEntrance: 0.35,
  pageTransition: 0.3,
  counter: 1.2,
  loop: 1.5,
  shimmer: 2,
} as const;

export const easing = {
  button: [0.25, 0.1, 0.25, 1] as const,
  elastic: [0.34, 1.56, 0.64, 1] as const,
  smoothDecel: [0.16, 1, 0.3, 1] as const,
  material: [0.4, 0, 0.2, 1] as const,
} as const;

export const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: timing.cardEntrance, ease: easing.button }
  }
};

export const microInteractions = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
  hoverSubtle: { scale: 1.01 },
  hoverShift: { x: 4 },
  press: { scale: 0.95 },
};

export const entranceVariants = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: timing.cardEntrance, ease: easing.button }
  },
  scaleIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: timing.cardEntrance, ease: easing.elastic }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: timing.pageTransition, ease: easing.button }
  }
};

export const loopAnimations = {
  pulse: {
    animate: { scale: [1, 1.02, 1] },
    transition: { duration: timing.shimmer, repeat: Infinity, ease: "easeInOut" }
  },
  glow: {
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: timing.loop, repeat: Infinity, ease: "easeInOut" }
  },
  shimmer: {
    initial: { x: '-100%' },
    animate: { x: '200%' },
    transition: { duration: timing.shimmer, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }
  }
};
