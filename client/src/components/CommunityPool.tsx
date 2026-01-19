import React, { useState } from "react";
import { Users, TrendingUp, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LiveInfoPopup from "./LiveInfoPopup";
import { GlassCard } from './GlassCard';

interface CommunityPoolProps {
  pool?: {
    poolAmount: number;
    safetyFactor: number;
    participantCount: number;
    safeDriverCount: number;
  };
}

export default function CommunityPool({ pool }: CommunityPoolProps) {
  const { toast } = useToast();
  const [showPopup, setShowPopup] = useState(false);
  const safetyPercentage = pool ? (Number(pool.safetyFactor) * 100).toFixed(0) : '80';
  const poolAmount = pool ? Number(pool.poolAmount).toFixed(0) : '105,000';
  const participantCount = pool?.participantCount || 1000;
  const safeDriverCount = pool?.safeDriverCount || 800;

  const handlePoolInfoClick = () => {
    setShowPopup(true);
  };

  return (
    <section>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-blue-400" />
            Community Pool
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <button
              onClick={handlePoolInfoClick}
              className="text-sm text-white/60 hover:text-white min-h-[44px] px-3 hover:bg-white/5 rounded-xl transition-all duration-200 ease-out flex items-center gap-1 active:scale-95"
              data-testid="live-info-button"
            >
              <Info className="w-4 h-4" />
              Live
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/60">Pool Safety Factor</span>
            <span className="text-sm font-semibold text-white">{safetyPercentage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 relative overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${safetyPercentage}%` }}
            />
          </div>
          <div className="text-xs text-white/50 mt-2">
            {safeDriverCount} of {participantCount} drivers meet safety thresholds
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handlePoolInfoClick}
            className="text-center p-4 min-h-[44px] hover:bg-white/5 rounded-xl transition-all duration-200 ease-out active:scale-95"
          >
            <div className="text-xl font-semibold text-white">£{poolAmount}</div>
            <div className="text-xs text-white/50 mt-1">Total Pool</div>
          </button>
          <button
            onClick={() => toast({
              title: "Your Pool Share",
              description: "Your share is calculated based on your safety score and community performance.",
            })}
            className="text-center p-4 min-h-[44px] hover:bg-white/5 rounded-xl transition-all duration-200 ease-out active:scale-95"
          >
            <div className="text-xl font-semibold text-emerald-400">£62.50</div>
            <div className="text-xs text-white/50 mt-1">Your Share</div>
          </button>
        </div>

        <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Pool performing +5% above target</span>
          </div>
        </div>
      </GlassCard>
      
      <LiveInfoPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        poolData={pool}
      />
    </section>
  );
}
