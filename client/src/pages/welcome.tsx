import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { BarChart3, Wallet, Trophy } from "lucide-react";
import { PageWrapper } from '../components/PageWrapper';
import { DriivaLogo } from '../components/DriivaLogo';
import { useAuth } from "../contexts/AuthContext";

const features = [
  { icon: BarChart3, title: "Track Your Driving", description: "Real-time feedback on every trip" },
  { icon: Wallet, title: "Earn Refunds", description: "Safe driving = money back at renewal" },
  { icon: Trophy, title: "Unlock Rewards", description: "Achievements, streaks, and community challenges" },
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const launchDemoMode = () => {
    const mockUser = {
      id: 'demo-user-123',
      email: 'demo@driiva.co.uk',
      name: 'Alex Driver',
    };
    
    localStorage.setItem('driiva-demo-mode', 'true');
    localStorage.setItem('driiva-demo-user', JSON.stringify({
      ...mockUser,
      first_name: 'Alex',
      last_name: 'Driver',
      premium_amount: 1500.00,
      personal_score: 85,
      community_score: 78,
      overall_score: 82,
      created_at: new Date().toISOString()
    }));
    localStorage.setItem('driiva-auth-token', 'demo-token-' + Date.now());
    
    setUser(mockUser);
    setLocation('/dashboard');
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
    <PageWrapper showNav={false}>
      <div className="min-h-[calc(100vh-3rem)] flex flex-col text-white">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center mb-2"
        >
          <DriivaLogo size="xl" />

          <p className="mt-1 mb-1 text-white/80 text-base">AI-powered, community-driven.</p>
          <p className="mt-0 mb-1 text-white/90 text-lg font-semibold">Your driving, rewarded.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 flex flex-col items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="region"
          aria-label="Feature carousel"
        >
          <div className="welcome-card-new" aria-live="polite">
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

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handlePrev}
              className="text-white/60 hover:text-white text-2xl transition-colors"
              aria-label="Previous slide"
            >
              &lt;
            </button>
            
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            
            <button
              onClick={handleNext}
              className="text-white/60 hover:text-white text-2xl transition-colors"
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
          className="space-y-4 mt-auto pb-8"
        >
          <button
            onClick={launchDemoMode}
            className="relative w-full px-8 py-4 text-lg font-semibold text-white rounded-xl overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 8px 32px rgba(6, 182, 212, 0.2)',
            }}
            aria-label="See Driiva Demo"
          >
            <span className="relative z-10">See Driiva</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmer-btn 2s infinite',
              }}
            ></div>
          </button>

          <button
            onClick={() => setLocation('/signin')}
            className="w-full px-8 py-4 text-base font-medium text-white/70 hover:text-white rounded-xl border border-white/20 hover:border-white/40 transition-colors"
            aria-label="Sign in to existing account"
          >
            I Already Have an Account
          </button>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
