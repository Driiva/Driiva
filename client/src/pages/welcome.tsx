import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { timing, easing } from "@/lib/animations";
import { BarChart3, Wallet, Trophy } from "lucide-react";
import gradientBackground from "@/assets/gradient-background.png";
import driivaLogo from "@/assets/driiva-logo-clean.png";

const particles = [
  { size: 4, left: '12%', top: '15%', color: 'rgba(0, 217, 160, 0.08)', animType: 1, delay: 0, duration: 28 },
  { size: 3, left: '25%', top: '80%', color: 'rgba(255, 255, 255, 0.05)', animType: 2, delay: -3, duration: 35 },
  { size: 5, left: '40%', top: '25%', color: 'rgba(120, 100, 255, 0.07)', animType: 3, delay: -7, duration: 32 },
  { size: 4, left: '55%', top: '60%', color: 'rgba(0, 217, 160, 0.08)', animType: 4, delay: -2, duration: 38 },
  { size: 3, left: '70%', top: '35%', color: 'rgba(255, 255, 255, 0.05)', animType: 1, delay: -5, duration: 30 },
  { size: 5, left: '85%', top: '70%', color: 'rgba(120, 100, 255, 0.07)', animType: 2, delay: -8, duration: 26 },
  { size: 4, left: '15%', top: '45%', color: 'rgba(0, 217, 160, 0.08)', animType: 3, delay: -4, duration: 34 },
  { size: 3, left: '60%', top: '88%', color: 'rgba(255, 255, 255, 0.05)', animType: 4, delay: -6, duration: 40 },
  { size: 5, left: '80%', top: '20%', color: 'rgba(0, 217, 160, 0.08)', animType: 1, delay: -1, duration: 36 },
  { size: 4, left: '35%', top: '55%', color: 'rgba(120, 100, 255, 0.07)', animType: 2, delay: -9, duration: 28 },
  { size: 3, left: '90%', top: '50%', color: 'rgba(255, 255, 255, 0.05)', animType: 3, delay: -12, duration: 33 },
  { size: 5, left: '20%', top: '70%', color: 'rgba(0, 217, 160, 0.08)', animType: 4, delay: -15, duration: 29 },
  { size: 4, left: '45%', top: '10%', color: 'rgba(120, 100, 255, 0.07)', animType: 1, delay: -10, duration: 37 },
  { size: 3, left: '65%', top: '42%', color: 'rgba(255, 255, 255, 0.05)', animType: 2, delay: -18, duration: 31 },
];

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

  const CurrentIcon = features[currentCard].icon;

  return (
    <div 
      className="min-h-screen flex flex-col items-center relative overflow-hidden"
      style={{ filter: 'contrast(0.92) brightness(0.98)' }}
    >
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${gradientBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(3px)',
        }}
      />
      
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.2) 100%)',
        }}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute star-particle"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              top: p.top,
              background: p.color,
              clipPath: 'polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)',
              animation: `float${p.animType} ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(-40px, -80px); opacity: 1; }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(40px, -60px); opacity: 1; }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(-30px, 70px); opacity: 1; }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(50px, 50px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .star-particle { animation: none !important; }
        }
      `}</style>
      
      <div className="relative z-10 flex flex-col items-center min-h-screen w-full py-8 pb-[env(safe-area-inset-bottom,24px)]">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="text-center flex flex-col items-center px-6"
          style={{ paddingTop: '64px' }}
        >
          <img 
            src={driivaLogo} 
            alt="Driiva" 
            style={{ 
              width: '240px',
              height: 'auto',
              objectFit: 'contain',
              mixBlendMode: 'screen',
              marginBottom: '24px',
            }}
          />
          
          <div 
            className="text-center"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              letterSpacing: '-0.3px',
              lineHeight: 1.35,
              marginBottom: '64px',
            }}
          >
            <span style={{ display: 'block' }}>AI-powered. Community-driven.</span>
            <span style={{ display: 'block' }}>Your driving, rewarded.</span>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
            className="w-full flex flex-col items-center"
            style={{ maxWidth: '380px' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="Feature carousel"
          >
            <div 
              className="relative w-full overflow-hidden"
              style={{ height: '200px' }}
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  style={{
                    background: 'rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '24px',
                    padding: '32px',
                    height: '200px',
                  }}
                >
                  <div style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
                    <CurrentIcon 
                      className="w-14 h-14" 
                      style={{ color: 'rgba(0, 217, 160, 0.95)' }} 
                    />
                  </div>
                  <h3 
                    className="font-bold mb-2"
                    style={{ 
                      fontSize: '24px', 
                      fontWeight: 700, 
                      color: 'white',
                      textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {features[currentCard].title}
                  </h3>
                  <p style={{ 
                    fontSize: '16px', 
                    color: 'rgba(255, 255, 255, 0.85)', 
                    lineHeight: 1.5,
                    textShadow: '0 1px 8px rgba(0, 0, 0, 0.3)',
                  }}>
                    {features[currentCard].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div 
              className="flex flex-col items-center"
              style={{ marginTop: '16px' }}
              role="navigation"
              aria-label="Carousel navigation"
            >
              <div
                className="rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  background: 'rgba(0, 217, 160, 0.9)',
                }}
                aria-hidden="true"
              />
              <span 
                style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '8px',
                }}
              >
                {currentCard + 1} of {features.length}
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="w-full max-w-[440px] mx-auto space-y-3 mt-8 px-6"
        >
          <motion.button
            onClick={() => setLocation('/signup')}
            whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: timing.quick / 1000 }}
            className="w-full font-semibold rounded-[28px] transition-all min-h-[56px]"
            style={{
              background: '#00D9A0',
              color: '#1A1F36',
              fontSize: '18px',
              fontWeight: 600,
              height: '56px',
              boxShadow: '0 4px 16px rgba(0, 217, 160, 0.3)',
            }}
            aria-label="Get Started with Driiva"
          >
            Get Started
          </motion.button>
          
          <motion.button
            onClick={() => setLocation('/signin')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: timing.quick / 1000 }}
            className="w-full font-medium rounded-[28px] transition-all min-h-[56px]"
            style={{
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '18px',
              fontWeight: 500,
              height: '56px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            aria-label="Sign in to existing account"
          >
            I Already Have an Account
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
