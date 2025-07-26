import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StardustParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface FloatingStardustProps {
  density?: number;
}

export default function FloatingStardust({ density = 100 }: FloatingStardustProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<StardustParticle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize particles
    particlesRef.current = Array.from({ length: density }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
    }));

    const animate = () => {
      particlesRef.current = particlesRef.current.map(particle => {
        let newX = particle.x + particle.vx;
        let newY = particle.y + particle.vy;

        // Wrap around edges
        if (newX < -10) newX = window.innerWidth + 10;
        if (newX > window.innerWidth + 10) newX = -10;
        if (newY < -10) newY = window.innerHeight + 10;
        if (newY > window.innerHeight + 10) newY = -10;

        return {
          ...particle,
          x: newX,
          y: newY,
          rotation: particle.rotation + particle.rotationSpeed,
        };
      });

      if (containerRef.current) {
        const dots = containerRef.current.querySelectorAll<HTMLDivElement>('.stardust-particle');
        dots.forEach((dot, i) => {
          const particle = particlesRef.current[i];
          if (particle) {
            dot.style.transform = `translate(${particle.x}px, ${particle.y}px) rotate(${particle.rotation}deg)`;
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [density]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(123, 31, 162, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(184, 115, 51, 0.08) 0%, transparent 70%)
        `,
      }} />

      {/* Stardust particles */}
      {Array.from({ length: density }, (_, i) => (
        <div
          key={i}
          className="stardust-particle absolute"
          style={{
            width: `${particlesRef.current[i]?.size || 2}px`,
            height: `${particlesRef.current[i]?.size || 2}px`,
            opacity: particlesRef.current[i]?.opacity || 0.5,
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%)',
            borderRadius: '50%',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.5)',
          }}
        />
      ))}

      {/* Animated larger glowing orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute"
          style={{
            width: '150px',
            height: '150px',
            background: `radial-gradient(circle, rgba(${i % 2 === 0 ? '139, 69, 19' : '123, 31, 162'}, 0.1) 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          initial={{
            left: `${20 + i * 20}%`,
            top: `${10 + i * 15}%`,
          }}
        />
      ))}
    </div>
  );
}