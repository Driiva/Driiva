import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

interface AnimatedScoreProps {
  value: number;
  className?: string;
}

export const AnimatedScore = ({ value, className = '' }: AnimatedScoreProps) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toString();
      },
    });
    
    return () => controls.stop();
  }, [value]);
  
  return <span ref={nodeRef} className={className}>0</span>;
};
