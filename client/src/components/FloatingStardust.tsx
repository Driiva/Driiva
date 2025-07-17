import { useEffect, useState } from 'react';

interface StardustParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
  animationDuration: number;
}

export default function FloatingStardust() {
  const [particles, setParticles] = useState<StardustParticle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: StardustParticle[] = [];
      
      for (let i = 0; i < 25; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.6 + 0.2,
          animationDelay: Math.random() * 8,
          animationDuration: Math.random() * 4 + 6
        });
      }
      
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animation: `float-stardust ${particle.animationDuration}s ease-in-out infinite`,
            animationDelay: `${particle.animationDelay}s`,
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)'
          }}
        />
      ))}
      
      {/* Additional twinkling stars */}
      {particles.slice(0, 12).map((particle) => (
        <div
          key={`twinkle-${particle.id}`}
          className="absolute w-0.5 h-0.5 bg-white rounded-full"
          style={{
            left: `${(particle.x + 20) % 100}%`,
            top: `${(particle.y + 30) % 100}%`,
            animation: `twinkle ${particle.animationDuration * 0.8}s ease-in-out infinite`,
            animationDelay: `${particle.animationDelay * 1.5}s`,
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
          }}
        />
      ))}
    </div>
  );
}