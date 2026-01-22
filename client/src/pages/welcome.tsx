import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { timing, easing } from "@/lib/animations";
import { BarChart3, Wallet, Trophy } from "lucide-react";
import gradientBackground from "@/assets/gradient-background.png";
import driivaLogo from "@/assets/driiva-logo.png";

const floatingDots = [
  { size: 6, left: '10%', delay: 0, duration: 28 },
  { size: 4, left: '25%', delay: 3, duration: 32 },
  { size: 8, left: '40%', delay: 7, duration: 24 },
  { size: 5, left: '55%', delay: 2, duration: 36 },
  { size: 7, left: '70%', delay: 5, duration: 30 },
  { size: 4, left: '85%', delay: 8, duration: 26 },
  { size: 6, left: '15%', delay: 4, duration: 34 },
  { size: 5, left: '60%', delay: 6, duration: 22 },
  { size: 8, left: '80%', delay: 1, duration: 38 },
  { size: 4, left: '35%', delay: 9, duration: 28 },
];

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden"
      style={{
        filter: 'contrast(0.92) brightness(0.98)',
      }}
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
        {floatingDots.map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: dot.size,
              height: dot.size,
              left: dot.left,
              top: '100%',
              background: 'rgba(0, 217, 160, 0.15)',
              animation: `floatUp ${dot.duration}s linear infinite`,
              animationDelay: `${dot.delay}s`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh);
            opacity: 0;
          }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen w-full py-8 pb-[env(safe-area-inset-bottom,24px)]">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="text-center flex flex-col items-center px-6"
          style={{ paddingTop: '48px' }}
        >
          <img 
            src={driivaLogo} 
            alt="Driiva" 
            className="object-contain mb-6"
            style={{ 
              width: '280px',
              height: 'auto',
              imageRendering: 'auto',
            }}
          />
          
          <p 
            className="text-lg leading-relaxed max-w-[80%] mx-auto"
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
          >
            Drive safer. Earn rewards. Join a community that values responsible driving.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="w-full hide-scrollbar"
          style={{ 
            marginTop: '32px', 
            marginBottom: '40px',
            overflowX: 'scroll',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div 
            className="flex gap-4"
            style={{ 
              padding: '0 24px',
            }}
          >
            <FeatureCard 
              icon={<BarChart3 className="w-12 h-12 text-[#00D9A0]" />}
              title="Track Your Driving"
              description="Real-time feedback on every trip"
            />
            <FeatureCard 
              icon={<Wallet className="w-12 h-12 text-[#00D9A0]" />}
              title="Earn Refunds"
              description="Safe driving = money back at renewal"
            />
            <FeatureCard 
              icon={<Trophy className="w-12 h-12 text-[#00D9A0]" />}
              title="Unlock Rewards"
              description="Achievements, streaks, and community challenges"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="w-full max-w-[440px] mx-auto space-y-3 mb-4 px-6"
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

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div 
      className="flex flex-col items-start gap-3 flex-shrink-0"
      style={{
        width: '320px',
        height: '180px',
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        scrollSnapAlign: 'center',
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: timing.quick / 1000 }}
    >
      <div className="flex-shrink-0" style={{ width: '48px', height: '48px' }}>
        {icon}
      </div>
      <div>
        <h3 
          className="font-semibold mb-1"
          style={{ fontSize: '20px', fontWeight: 600, color: 'white' }}
        >
          {title}
        </h3>
        <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.75)' }}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}
