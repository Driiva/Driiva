import { useEffect, useState } from 'react';

interface IlluminatedDot {
  id: number;
  x: number;
  y: number;
  size: number;
  glowSize: number;
  animationDelay: number;
  animationDuration: number;
}

export default function FloatingStardust() {
  const [dots, setDots] = useState<IlluminatedDot[]>([]);

  useEffect(() => {
    const generateDots = () => {
      const newDots: IlluminatedDot[] = [];
      
      for (let i = 0; i < 8; i++) {
        newDots.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          glowSize: Math.random() * 15 + 10,
          animationDelay: Math.random() * 10,
          animationDuration: Math.random() * 15 + 20
        });
      }
      
      setDots(newDots);
    };

    generateDots();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 40%, transparent 70%)',
            boxShadow: `0 0 ${dot.glowSize}px rgba(255, 255, 255, 0.8), 0 0 ${dot.glowSize * 2}px rgba(255, 255, 255, 0.4)`,
            animation: `floatIlluminated ${dot.animationDuration}s ease-in-out infinite`,
            animationDelay: `${dot.animationDelay}s`
          }}
        />
      ))}
    </div>
  );
}