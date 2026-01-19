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
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
            <Users className="w-4 h-4 text-emerald-400/70" />
            Community Pool
          </h3>
          <button
            onClick={handlePoolInfoClick}
            className="text-xs text-white/40 hover:text-white/60 min-h-[44px] px-2 transition-all duration-200 ease-out flex items-center gap-1"
            data-testid="live-info-button"
          >
            <div className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full"></div>
            Live
          </button>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-white/40">Safety Factor</span>
            <span className="text-xs font-medium text-white/70">{safetyPercentage}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500/60 h-1.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${safetyPercentage}%` }}
            />
          </div>
          <div className="text-[10px] text-white/30 mt-1.5">
            {safeDriverCount}/{participantCount} safe drivers
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePoolInfoClick}
            className="text-center p-3 min-h-[44px] hover:bg-white/5 rounded-xl transition-all duration-200 ease-out active:scale-95"
          >
            <div className="text-lg font-semibold text-white/90">£{poolAmount}</div>
            <div className="text-[10px] text-white/40 mt-0.5">Total Pool</div>
          </button>
          <button
            onClick={() => toast({
              title: "Your Pool Share",
              description: "Based on your safety score and community performance.",
            })}
            className="text-center p-3 min-h-[44px] hover:bg-white/5 rounded-xl transition-all duration-200 ease-out active:scale-95"
          >
            <div className="text-lg font-semibold text-emerald-400/80">£62.50</div>
            <div className="text-[10px] text-white/40 mt-0.5">Your Share</div>
          </button>
        </div>

        <div className="mt-3 flex items-center space-x-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-400/60" />
          <span className="text-[10px] text-emerald-400/60">+5% above target</span>
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
