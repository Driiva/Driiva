import React, { useState } from "react";
import { Users, TrendingUp, Info, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LiveInfoPopup from "./LiveInfoPopup";

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
    <section className="mb-3">
      <div className="glass-morphism-subtle rounded-xl p-3" style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Community Pool
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
            <button
              onClick={handlePoolInfoClick}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 hover:bg-white/10 rounded transition-colors flex items-center gap-1"
              data-testid="live-info-button"
            >
              <Info className="w-3 h-3" />
              Live
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Pool Safety Factor</span>
            <span className="text-sm font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.7)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600'
            }}>{safetyPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700/30 rounded-full h-2 relative">
            <div 
              className="bg-gradient-to-r from-[#8B4513] via-[#B87333] to-[#7B1FA2] h-2 rounded-full transition-all duration-500" 
              style={{ 
                width: `${safetyPercentage}%`,
                boxShadow: '0 0 12px rgba(139, 69, 19, 0.6), 0 0 24px rgba(184, 115, 51, 0.4), 0 0 36px rgba(123, 31, 162, 0.3)',
                filter: 'drop-shadow(0 0 8px rgba(139, 69, 19, 0.5))'
              }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {safeDriverCount} of {participantCount} drivers meet safety thresholds
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handlePoolInfoClick}
            className="text-center p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="text-lg font-bold text-white">£{poolAmount}</div>
            <div className="text-xs text-gray-400">Total Pool</div>
          </button>
          <button
            onClick={() => toast({
              title: "Your Pool Share",
              description: "Your share is calculated based on your safety score and community performance. Higher scores mean larger shares of the reward pool.",
            })}
            className="text-center p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="text-lg font-bold text-[#10B981]">£62.50</div>
            <div className="text-xs text-gray-400">Your Share</div>
          </button>
        </div>

        <div className="mt-4 p-3 bg-[#10B981] bg-opacity-10 rounded-xl border border-[#10B981] border-opacity-20">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm text-[#10B981] font-medium">Pool performing +5% above target</span>
          </div>
        </div>
      </div>
      
      {/* Live Info Popup */}
      <LiveInfoPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        poolData={pool}
      />
    </section>
  );
}