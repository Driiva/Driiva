import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { timing, easing } from "@/lib/animations";
import { BarChart3, Wallet, Trophy, Zap } from "lucide-react";
import gradientBackground from "@/assets/gradient-background.png";
import driivaLogo from "@/assets/driiva-logo.png";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden"
      style={{
        backgroundImage: `url(${gradientBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen w-full max-w-[440px] mx-auto px-6 py-8 pb-[env(safe-area-inset-bottom,24px)]">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="mt-12 text-center flex flex-col items-center"
        >
          <div 
            className="w-20 h-20 bg-gradient-to-br from-[#00D9A0] to-[#00B386] 
                      rounded-3xl flex items-center justify-center mb-6
                      shadow-lg shadow-[#00D9A0]/30"
            aria-label="Driiva App Icon"
          >
            <Zap className="w-10 h-10 text-[#1A1F36]" strokeWidth={2.5} />
          </div>
          
          <img 
            src={driivaLogo} 
            alt="Driiva" 
            className="h-16 w-auto object-contain mb-6"
            style={{ 
              imageRendering: 'auto',
              maxWidth: '280px'
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
          className="space-y-4 w-full"
          style={{ marginTop: '32px', marginBottom: '32px' }}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="w-full space-y-3 mb-4"
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
      className="flex items-start gap-4"
      style={{
        background: 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
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
