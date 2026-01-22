import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { timing, easing } from "@/lib/animations";
import { BarChart3, Wallet, Trophy } from "lucide-react";
import gradientBackground from "@/assets/gradient-background.png";
import driivaLogo from "@/assets/driiva-logo-new.png";

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
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatBlur {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(50px, -30px) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-40px, 40px) scale(0.9);
            opacity: 0.7;
          }
          75% {
            transform: translate(30px, 20px) scale(1.05);
            opacity: 0.75;
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 217, 160, 0.15) 0%, rgba(120, 100, 255, 0.1) 50%, transparent 100%)',
          filter: 'blur(60px)',
          animation: 'floatBlur 12s ease-in-out infinite',
          zIndex: 0,
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center min-h-screen w-full py-8 pb-[env(safe-area-inset-bottom,24px)]" style={{ paddingTop: '80px' }}>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="text-center flex flex-col items-center px-6 w-full text-[20px] font-semibold"
          style={{ maxWidth: '440px', margin: '0 auto' }}
        >
          <div
            style={{
              width: '320px',
              maxWidth: '80vw',
              height: '60px',
              overflow: 'hidden',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img 
              src={driivaLogo} 
              alt="Driiva" 
              style={{ 
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                imageRendering: 'crisp-edges',
              }}
            />
          </div>
          
          <div 
            className="text-center"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '22px',
              fontWeight: 600,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              letterSpacing: '-0.2px',
              lineHeight: 1.4,
              marginBottom: '48px',
            }}
          >
            <span style={{ display: 'block' }} className="font-semibold text-[20px]">AI-Powered. Community-driven.</span>
            <span style={{ display: 'block' }} className="font-semibold">Your driving, rewarded.</span>
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center w-full px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
            className="w-full flex flex-col items-center"
            style={{ maxWidth: '320px' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="Feature carousel"
          >
            <div 
              className="relative w-full overflow-hidden"
              style={{ height: '160px' }}
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
                    background: 'rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    padding: '24px',
                    height: '160px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div 
                    style={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 8s ease-in-out infinite',
                      borderRadius: '16px',
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ width: '40px', height: '40px', marginBottom: '12px' }}>
                    <CurrentIcon 
                      className="w-10 h-10" 
                      style={{ color: 'rgba(0, 217, 160, 0.95)' }} 
                    />
                  </div>
                  <h3 
                    className="font-semibold mb-1"
                    style={{ 
                      fontSize: '20px', 
                      fontWeight: 600, 
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    {features[currentCard].title}
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'rgba(255, 255, 255, 0.85)', 
                    lineHeight: 1.4,
                    textAlign: 'center',
                  }}>
                    {features[currentCard].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div 
              className="flex items-center justify-center gap-4"
              style={{ marginTop: '16px' }}
              role="navigation"
              aria-label="Carousel navigation"
            >
              <button
                onClick={handlePrev}
                className="transition-opacity hover:opacity-100"
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '18px',
                  textShadow: '0 0 8px rgba(0, 0, 0, 0.4)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <div
                className="rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  background: 'rgba(0, 217, 160, 0.9)',
                }}
                aria-hidden="true"
              />
              <button
                onClick={handleNext}
                className="transition-opacity hover:opacity-100"
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '18px',
                  textShadow: '0 0 8px rgba(0, 0, 0, 0.4)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
                aria-label="Next slide"
              >
                ›
              </button>
            </div>
            
            <p
              style={{
                marginTop: '24px',
                fontSize: '22px',
                fontWeight: 600,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                color: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center',
                lineHeight: 1.4,
                letterSpacing: '-0.2px',
                maxWidth: '360px',
              }}
            >
              Lower premiums for safer drivers, powered by your data.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="w-full max-w-[440px] mx-auto space-y-4 px-6"
          style={{ marginTop: '40px' }}
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
