import { useEffect } from 'react';

export default function ScrollGradient() {
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const gradientElement = document.querySelector('.driiva-gradient-bg') as HTMLElement;
      
      if (gradientElement) {
        // Move gradient based on scroll position
        const translateY = scrollPercent * -50; // Adjust multiplier for effect intensity
        gradientElement.style.transform = `translateY(${translateY}%)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}