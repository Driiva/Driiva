import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { FileText, ArrowLeft } from "lucide-react";

export default function Terms() {
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
          <FileText className="w-8 h-8 text-purple-400" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        
        <div className="backdrop-blur-xl bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-6 text-left mb-6">
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            Welcome to Driiva. By using our service, you agree to these terms.
          </p>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            Driiva is an AI-powered, community-driven car insurance platform that rewards safe driving behavior with potential refunds at policy renewal.
          </p>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            Your driving data is collected to calculate your driving score and determine your share of the community surplus pool.
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            For full terms and conditions, please contact our support team.
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
