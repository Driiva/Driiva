import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { timing, easing, microInteractions } from "@/lib/animations";
import { supabase } from "../lib/supabase";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLocation("/signin");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          onboarding_complete: true,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        setError("Could not save your details. Please try again.");
        return;
      }

      setLocation("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground variant="welcome" />
      
      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-white/50">Step 2 of 2</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: timing.pageTransition / 1000, ease: easing.smoothDecel }}
          className="flex-1"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Driiva</h1>
          <p className="text-white/60 mb-8">Let's get you set up</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

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
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Phone Number (optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl 
                         px-4 py-3 text-white placeholder-white/40 
                         focus:outline-none focus:border-emerald-500 transition-colors min-h-[48px]"
                placeholder="+44 7700 900000"
                disabled={isLoading}
              />
            </div>

            <motion.button
              type="submit"
              whileTap={!isLoading ? microInteractions.tap : undefined}
              transition={{ duration: timing.quick / 1000 }}
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 
                       text-white font-semibold py-4 rounded-xl transition-colors mt-6 min-h-[56px]
                       flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
