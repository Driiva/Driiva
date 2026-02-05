import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { BarChart3, Wallet, Trophy } from "lucide-react";
import driivaLogo from '@/assets/driiva-logo-CLEAR-FINAL.png';
import carouselDotIcon from '@/assets/carousel-dot-icon.png';

const features = [
  { icon: BarChart3, title: "Track Your Driving", description: "Real-time feedback on every trip" },
  { icon: Wallet, title: "Earn Refunds", description: "Safe driving = money back at renewal" },
  { icon: Trophy, title: "Unlock Rewards", description: "Achievements, streaks, and community challenges" },
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Navigate to the demo page - demo mode is activated there, NOT here
  const goToDemo = () => {
    setLocation('/demo');
  };

  const handleNext = useCallback(() => {
    setCurrentCard((prev) => (prev + 1) % features.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentCard((prev) => (prev - 1 + features.length) % features.length);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStart(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  useEffect(() => {
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [handleNext]);

  const CurrentIcon = features[currentCard].icon;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-orb-container">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>
      
      <div className="relative z-10 max-w-md mx-auto px-4 pt-16 min-h-screen flex flex-col text-white">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center w-full"
        >
          <div className="w-full max-w-[400px] h-24 overflow-hidden flex items-center justify-center self-center shrink-0">
            <img 
              src={driivaLogo} 
              alt="Driiva" 
              className="max-w-full max-h-full w-auto h-auto object-contain object-center scale-[1.4] origin-center border-0 border-none overflow-visible"
              style={{ imageRendering: '-webkit-optimize-contrast', borderImage: 'none' }}
            />
          </div>
          <div 
            className="flex flex-col items-center justify-center -mt-1 text-center box-content tracking-normal leading-5 w-full"
            style={{ verticalAlign: 'middle' }}
          >
            <p className="text-[var(--neutral-300)] text-sm font-bold mb-1">
              AI-<span className="text-neutral-400 drop-shadow-[0_0_4px_rgba(203,213,225,0.4)]">powered</span>. Community-driven.
            </p>
            <p className="text-white/80 text-lg font-semibold leading-5">Your driving, <em>rewarded.</em></p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center mt-12"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="region"
          aria-label="Feature carousel"
        >
          <div 
            className="welcome-card-new max-w-md backdrop-blur-sm bg-black/20 border border-white/10 rounded-3xl" 
            style={{ boxShadow: '0 0 60px rgba(139, 92, 246, 0.15), 0 0 120px rgba(236, 72, 153, 0.08)' }}
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="welcome-card-content"
              >
                <CurrentIcon className="welcome-card-icon" />
                <h3 className="welcome-card-title">{features[currentCard].title}</h3>
                <p className="welcome-card-desc">{features[currentCard].description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={handlePrev}
              className="text-white/50 hover:text-white text-lg transition-colors"
              aria-label="Previous slide"
            >
              &lt;
            </button>
            
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <img
                src={carouselDotIcon}
                alt=""
                className="w-full h-full object-contain select-none mix-blend-screen"
                style={{ border: 'none' }}
              />
            </div>
            
            <button
              onClick={handleNext}
              className="text-white/50 hover:text-white text-lg transition-colors"
              aria-label="Next slide"
            >
              &gt;
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center gap-3 pb-20 mt-6"
        >
          <button
            onClick={() => setLocation('/signup')}
            className="hero-cta-primary hero-cta-green"
            aria-label="Get Started"
          >
            Get Started
          </button>

          <button
            onClick={goToDemo}
            className="hero-cta-primary hero-cta-blue"
            aria-label="Test Driiva"
          >
            Test Driiva
          </button>

          <button
            onClick={() => setLocation('/signin')}
            className="hero-cta-tertiary"
            aria-label="Sign in to existing account"
          >
            I Already Have an Account
          </button>
        </motion.div>
      </div>

      {/* Fixed Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 pb-safe border-0 border-none shadow-none outline-none bg-transparent">
        <div className="flex items-center justify-center gap-6 py-3">
          <button 
            onClick={() => setLocation('/policy')} 
            className="text-white/60 hover:text-white text-sm transition"
          >
            Policy
          </button>
          <span className="text-white/20">|</span>
          <button 
            onClick={() => setLocation('/support')} 
            className="text-white/60 hover:text-white text-sm transition"
          >
            FAQs
          </button>
          <span className="text-white/20">|</span>
          <button 
            onClick={() => setLocation('/settings')} 
            className="text-white/60 hover:text-white text-sm transition"
          >
            Settings
          </button>
        </div>
      </footer>
    </div>
  );
}
