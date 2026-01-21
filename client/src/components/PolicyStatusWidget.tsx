import { motion } from "framer-motion";
import { Shield, Calendar, CreditCard, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { GlassCard } from './GlassCard';

interface PolicyStatusWidgetProps {
  user: {
    premiumAmount: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function PolicyStatusWidget({ user }: PolicyStatusWidgetProps) {
  const [isActive] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const policyData = {
    policyNumber: "DRV-2025-000001",
    policyType: "Comprehensive Telematics",
    startDate: "Jul 01, 2025",
    renewalDate: "Jul 01, 2026",
    premiumAmount: user.premiumAmount
  };

  return (
    <section>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Policy Status</h3>
          <motion.button
            onClick={() => toast({
              title: "Policy Status",
              description: "Your policy is active and up to date. Next renewal: July 1, 2026",
            })}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 min-h-[44px] rounded-xl font-semibold text-sm flex items-center ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className={`w-2 h-2 rounded-full mr-2 ${
                isActive ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            {isActive ? 'Active' : 'Inactive'}
          </motion.button>
        </div>

        <div className="space-y-4">
          {/* Policy Type */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{policyData.policyType}</div>
              <div className="text-xs text-white/50">Policy No: {policyData.policyNumber}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <div className="text-xs text-white/50">Start Date</div>
                <div className="text-sm font-medium text-white">{policyData.startDate}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <div className="text-xs text-white/50">Renewal Date</div>
                <div className="text-sm font-medium text-white">{policyData.renewalDate}</div>
              </div>
            </div>
          </div>

          {/* Premium */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Annual Premium</div>
                <div className="text-xs text-white/50">£{Number(policyData.premiumAmount || 1840).toLocaleString()}</div>
              </div>
            </div>
            <motion.button
              onClick={() => setLocation('/policy')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-2 min-h-[44px] bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white/80 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Details
            </motion.button>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
