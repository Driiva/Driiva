import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { timing, easing } from "@/lib/animations";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-between p-6">
      {/* Logo & Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
        className="mt-20 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 
                      rounded-3xl flex items-center justify-center mx-auto mb-6
                      shadow-lg shadow-emerald-500/20">
          <span className="text-4xl">⚡</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Welcome to Driiva</h1>
        <p className="text-lg text-white/60 max-w-sm mx-auto">
          Drive safer. Earn rewards. Join a community that values responsible driving.
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
        className="space-y-4 w-full max-w-sm"
      >
        <FeatureCard 
          icon="📊" 
          title="Track Your Driving"
          description="Real-time feedback on every trip"
        />
        <FeatureCard 
          icon="💰" 
          title="Earn Refunds"
          description="Safe driving = money back at renewal"
        />
        <FeatureCard 
          icon="🏆" 
          title="Unlock Rewards"
          description="Achievements, streaks, and community challenges"
        />
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
        className="w-full max-w-sm mb-8 space-y-3"
      >
        <motion.button
          onClick={() => setLocation('/signup')}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: timing.quick / 1000 }}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white 
                   font-semibold py-4 rounded-2xl transition-all 
                   shadow-lg shadow-emerald-500/20 hover:shadow-xl min-h-[56px]"
        >
          Get Started
        </motion.button>
        
        <motion.button
          onClick={() => setLocation('/signin')}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: timing.quick / 1000 }}
          className="w-full bg-white/5 hover:bg-white/10 text-white 
                   font-medium py-4 rounded-2xl transition-colors min-h-[56px]"
        >
          I Already Have an Account
        </motion.button>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div 
      className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] 
                rounded-2xl p-4 flex items-start gap-4"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: timing.quick / 1000 }}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </motion.div>
  );
}
