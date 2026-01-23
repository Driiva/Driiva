import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { BarChart3, Wallet, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import driivaLogo from "@assets/driiva_logo_CLEAR_FINAL_1769199433106.png";
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
    <div className="welcome-page-container">
      <div className="welcome-bg" />
      <div className="welcome-noise" />

      <div className="welcome-content">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="welcome-header"
        >
          <img 
            src={driivaLogo} 
            alt="Driiva" 
            className="welcome-logo-new"
          />

          <p className="welcome-subheader-1">AI-powered, community-driven.</p>
          <p className="welcome-subheader-2">Your driving, rewarded.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="welcome-carousel-section"
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

          <div className="welcome-nav" role="navigation" aria-label="Carousel indicators">
            <button 
              onClick={handlePrev}
              className="welcome-nav-arrow"
              aria-label="Previous slide"
            >
              <ChevronLeft size={14} />
            </button>
            
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCard(index)}
                className={`welcome-nav-dot ${currentCard === index ? 'active' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentCard === index ? 'true' : 'false'}
              />
            ))}
            
            <button 
              onClick={handleNext}
              className="welcome-nav-arrow"
              aria-label="Next slide"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="welcome-buttons"
        >
          <button
            onClick={launchDemoMode}
            className="welcome-btn-primary"
            aria-label="See Driiva Demo"
          >
            See Driiva
          </button>

          <button
            onClick={() => setLocation('/signin')}
            className="welcome-btn-secondary"
            aria-label="Sign in to existing account"
          >
            I Already Have an Account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
