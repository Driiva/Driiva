interface LiquidGaugeProps {
  score: number;
  projectedRefund: number;
  premiumAmount: number;
}

import { useToast } from "@/hooks/use-toast";
import { AnimatedScore } from './AnimatedScore';
import { GlassCard } from './GlassCard';

export default function LiquidGauge({ score, projectedRefund, premiumAmount }: LiquidGaugeProps) {
  const { toast } = useToast();
  const strokeOffset = 283 - (score / 100) * 283;
  const personalScore = Math.round(score * 0.8);
  const poolScore = Math.round(score * 0.2);

  const handleScoreClick = () => {
    toast({
      title: "Score Breakdown",
      description: `Personal driving: ${personalScore}/100 (80% weight)\nCommunity pool: ${poolScore}/100 (20% weight)\nTotal score: ${score}/100`,
    });
  };

  return (
    <GlassCard className="p-6">
      {/* Score Ring */}
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg 
          className="w-full h-full -rotate-90" 
          viewBox="0 0 100 100"
        >
          {/* Background ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="6" 
            fill="none"
          />
          {/* Progress ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="#10B981"
            strokeWidth="6" 
            fill="none" 
            strokeLinecap="round"
            strokeDasharray="283"
            style={{ 
              strokeDashoffset: strokeOffset,
              transition: 'stroke-dashoffset 0.5s ease-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            onClick={handleScoreClick} 
            className="text-center min-h-[44px] min-w-[44px] transition-all duration-200 ease-out active:scale-95" 
            data-testid="driving-score-button"
          >
            <AnimatedScore value={score} className="text-5xl font-semibold text-white" />
            <div className="text-xs text-white/50 mt-1">
              out of 100
            </div>
          </button>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className="text-lg font-semibold text-white" data-testid="personal-score">
            {personalScore}%
          </div>
          <div className="text-xs text-white/50 mt-1">
            Personal Score
          </div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl">
          <div className="text-lg font-semibold text-white" data-testid="pool-score">
            {poolScore}%
          </div>
          <div className="text-xs text-white/50 mt-1">
            Pool Score
          </div>
        </div>
      </div>

      {/* Projected Annual Refund */}
      <div 
        className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-5 text-center"
        data-testid="projected-refund-card"
      >
        <div className="text-xs font-medium text-white/60 mb-1">Projected Annual Refund</div>
        <div className="text-3xl font-semibold text-emerald-400 mb-1">£{projectedRefund.toFixed(2)}</div>
        <p className="text-xs text-white/50">
          {((projectedRefund / Number(premiumAmount)) * 100).toFixed(1)}% of £{premiumAmount.toLocaleString()} premium
        </p>
      </div>
    </GlassCard>
  );
}
