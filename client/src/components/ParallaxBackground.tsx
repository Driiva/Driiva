import { useEffect, useRef } from "react";

export default function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      
      const layers = containerRef.current.querySelectorAll('.parallax-layer');
      layers.forEach((layer, index) => {
        const speed = (index + 1) * 0.02;
        const translateX = x * speed * 30;
        const translateY = y * speed * 30;
        
        (layer as HTMLElement).style.transform = 
          `translate3d(${translateX}px, ${translateY}px, 0) scale(1.1)`;
      });
    };
    
    // Smooth animation frame
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // Animation logic here if needed
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  return (
    <div ref={containerRef} className="parallax-container">
      <div className="parallax-layer parallax-layer-1" />
      <div className="parallax-layer parallax-layer-2" />
      <div className="parallax-layer parallax-layer-3" />
    </div>
  );
}