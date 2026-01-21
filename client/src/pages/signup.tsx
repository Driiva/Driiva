import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { timing, easing, microInteractions } from "@/lib/animations";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/permissions");
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.button
          onClick={handleBack}
          whileTap={microInteractions.tap}
          transition={{ duration: timing.quick / 1000 }}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 
                   flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        >
          <span className="text-white">←</span>
        </motion.button>
        <span className="text-sm text-white/50">Step 1 of 2</span>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
        className="flex-1"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/60 mb-8">Join thousands of safer drivers</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       px-4 py-3 text-white placeholder-white/40 
                       focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       px-4 py-3 text-white placeholder-white/40 
                       focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       px-4 py-3 text-white placeholder-white/40 
                       focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
              placeholder="+44 7700 900000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       px-4 py-3 text-white placeholder-white/40 
                       focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
              placeholder="- - - - - - - -"
              required
            />
          </div>

          <motion.button
            type="submit"
            whileTap={microInteractions.tap}
            transition={{ duration: timing.quick / 1000 }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white 
                     font-semibold py-4 rounded-xl transition-colors mt-6 min-h-[56px]"
          >
            Continue
          </motion.button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-emerald-400 hover:underline">Terms</a>
          {" "}and{" "}
          <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
}
