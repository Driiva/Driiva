import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-700/30 border border-white/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-purple-400" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        
        <div className="backdrop-blur-xl bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-6 text-left mb-6">
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            At Driiva, we take your privacy seriously. This policy explains how we collect, use, and protect your data.
          </p>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            <strong className="text-white">Data Collection:</strong> We collect driving behavior data including speed, acceleration, braking patterns, and trip information to calculate your driving score.
          </p>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            <strong className="text-white">Data Usage:</strong> Your data is used to determine your eligibility for surplus refunds and to improve our community pool calculations.
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            <strong className="text-white">Data Protection:</strong> All data is encrypted and stored securely. We never sell your personal information to third parties.
          </p>
        </div>

        <button
          onClick={() => setLocation('/')}
          className="flex items-center justify-center gap-2 mx-auto text-teal-400 hover:text-teal-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}
