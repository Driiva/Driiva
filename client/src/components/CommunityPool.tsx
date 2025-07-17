import { Users, TrendingUp } from "lucide-react";

interface CommunityPoolProps {
  pool?: {
    poolAmount: number;
    safetyFactor: number;
    participantCount: number;
    safeDriverCount: number;
  };
}

export default function CommunityPool({ pool }: CommunityPoolProps) {
  const safetyPercentage = pool ? (Number(pool.safetyFactor) * 100).toFixed(0) : '80';
  const poolAmount = pool ? Number(pool.poolAmount).toFixed(0) : '105,000';
  const participantCount = pool?.participantCount || 1000;
  const safeDriverCount = pool?.safeDriverCount || 800;

  return (
    <section className="mb-6">
      <div className="glass-morphism rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Community Pool</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Pool Safety Factor</span>
            <span className="text-sm font-semibold text-white">{safetyPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#8B4513] via-[#B87333] to-[#7B1FA2] h-2 rounded-full transition-all duration-500" 
              style={{ width: `${safetyPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {safeDriverCount} of {participantCount} drivers meet safety thresholds
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">£{poolAmount}</div>
            <div className="text-xs text-gray-400">Total Pool</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#10B981]">£62.50</div>
            <div className="text-xs text-gray-400">Your Share</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#10B981] bg-opacity-10 rounded-xl border border-[#10B981] border-opacity-20">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm text-[#10B981] font-medium">Pool performing +5% above target</span>
          </div>
        </div>
      </div>
    </section>
  );
}
