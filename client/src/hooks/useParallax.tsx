import { useEffect, useRef, useState } from 'react';

interface ParallaxConfig {
  speed?: number;
  offset?: number;
  smoothing?: boolean;
}

export function useParallax({
  speed = 0.5,
  offset = 0,
  smoothing = true,
}: ParallaxConfig = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Calculate parallax offset based on element position
      const scrollProgress = (viewportHeight - elementTop) / (viewportHeight + elementHeight);
      const newOffset = scrollProgress * speed * 100 + offset;

      setParallaxOffset(newOffset);
    };

    // Throttle scroll events for performance
    let ticking = false;
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollHandler);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', scrollHandler);
  }, [speed, offset]);

  return {
    ref,
    style: {
      '--parallax-offset': `${parallaxOffset}px`,
      transform: `translateY(${parallaxOffset}px)`,
      transition: smoothing ? 'transform 0.3s ease-out' : 'none',
    } as React.CSSProperties,
  };
}

export function useParallaxBackground() {
  const [offsets, setOffsets] = useState({
    slow: 0,
    medium: 0,
    fast: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      setOffsets({
        slow: scrollY * 0.3,
        medium: scrollY * 0.5,
        fast: scrollY * 0.8,
      });
    };

    let ticking = false;
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollHandler);
    handleScroll();

    return () => window.removeEventListener('scroll', scrollHandler);
  }, []);

  return {
    style: {
      '--parallax-offset-slow': `-${offsets.slow}px`,
      '--parallax-offset-medium': `-${offsets.medium}px`,
      '--parallax-offset-fast': `-${offsets.fast}px`,
    } as React.CSSProperties,
  };
}