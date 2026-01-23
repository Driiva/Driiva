import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { BarChart3, Wallet, Trophy } from "lucide-react";
import driivaLogo from "@/assets/driiva-logo-new.png";
import AnimatedBackground from "@/components/AnimatedBackground";

const features = [
  { icon: BarChart3, title: "Track Your Driving", description: "Real-time feedback on every trip" },
  { icon: Wallet, title: "Earn Refunds", description: "Safe driving = money back at renewal" },
  { icon: Trophy, title: "Unlock Rewards", description: "Achievements, streaks, and community challenges" },
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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
    <div 
      className="h-screen flex flex-col items-center justify-center relative overflow-hidden welcome-page-container"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)',
        maxHeight: '100vh',
      }}
    >
      <AnimatedBackground variant="welcome" />

      <div 
        className="relative z-10 flex flex-col items-center justify-center w-full"
        style={{ 
          maxWidth: '480px', 
          margin: '0 auto', 
          padding: '16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-center flex flex-col items-center w-full"
        >
          <img 
            src={driivaLogo} 
            alt="Driiva" 
            className="welcome-logo md:w-[320px]"
            style={{
              width: '280px',
              maxWidth: '90%',
            }}
          />

          <p 
            style={{ 
              marginTop: '8px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: 1.4,
              textAlign: 'center',
              letterSpacing: '-0.01em',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            }}
          >
            AI-powered, community-driven.<br />
            Your driving, rewarded.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full flex flex-col items-center"
          style={{ marginTop: '32px', maxWidth: '320px' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="region"
          aria-label="Feature carousel"
        >
          <div 
            className="relative w-full overflow-hidden welcome-glass-card"
            style={{ height: '140px', padding: '20px' }}
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-5"
              >
                <div style={{ width: '36px', height: '36px', marginBottom: '8px' }}>
                  <CurrentIcon 
                    className="w-9 h-9" 
                    style={{ color: '#10b981' }} 
                  />
                </div>
                <h3 
                  style={{ 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: 'white',
                    marginBottom: '4px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                  }}
                >
                  {features[currentCard].title}
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  lineHeight: 1.3,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                }}>
                  {features[currentCard].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div 
            className="flex items-center justify-center gap-2"
            style={{ marginTop: '12px' }}
            role="navigation"
            aria-label="Carousel indicators"
          >
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCard(index)}
                className="transition-all duration-300"
                style={{
                  width: currentCard === index ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentCard === index ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentCard === index ? 'true' : 'false'}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full flex flex-col gap-3"
          style={{ marginTop: '32px', maxWidth: '320px' }}
        >
          <button
            onClick={() => setLocation('/signup')}
            className="welcome-cta-primary"
            aria-label="Get Started with Driiva"
          >
            Get Started
          </button>

          <button
            onClick={() => setLocation('/signin')}
            className="welcome-cta-secondary"
            aria-label="Sign in to existing account"
          >
            I Already Have an Account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
