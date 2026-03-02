import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import driivaLogo from '@/assets/driiva-logo-CLEAR-FINAL.png';
import gradientBackground from '@/assets/gradient-background.png';

const SESSION_KEY = 'driiva-splash-shown';
const HOLD_MS = 700;

export default function SplashScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch { /* quota / private browsing */ }
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <>
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
          >
            {/* Background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${gradientBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Floating orbs */}
            <div className="hero-orb-container" aria-hidden>
              <div className="hero-orb hero-orb-1" />
              <div className="hero-orb hero-orb-2" />
              <div className="hero-orb hero-orb-3" />
            </div>

            {/* Logo */}
            <motion.img
              src={driivaLogo}
              alt="Driiva"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 w-56 max-w-[70vw] object-contain"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
