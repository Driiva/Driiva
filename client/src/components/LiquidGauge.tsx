interface LiquidGaugeProps {
  score: number;
  projectedRefund: number;
  premiumAmount: number;
}

export default function LiquidGauge({ score, projectedRefund, premiumAmount }: LiquidGaugeProps) {
  const strokeOffset = 283 - (score / 100) * 283;
  const personalScore = Math.round(score * 0.8);
  const poolScore = Math.round(score * 0.2);

  return (
    <>
      {/* Liquid Fill Gauge for Driving Score */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg className="w-full h-full progress-ring" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="8" 
            fill="none"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="url(#gradientStroke)" 
            strokeWidth="8" 
            fill="none" 
            className="progress-ring-circle" 
            style={{ strokeDashoffset: strokeOffset }}
          />
          <defs>
            <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
              <stop offset="25%" style={{ stopColor: '#B87333', stopOpacity: 1 }} />
              <stop offset="75%" style={{ stopColor: '#7B1FA2', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)' }}>{score}</div>
            <div className="text-sm text-gray-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">out of 100</div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{personalScore}%</div>
          <div className="text-xs text-gray-400">Personal Score</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{poolScore}%</div>
          <div className="text-xs text-gray-400">Pool Score</div>
        </div>
      </div>

      {/* Projected Refund */}
      <div className="text-center p-4 glass-morphism rounded-2xl">
        <div className="text-xs text-gray-400 mb-1">Projected Annual Refund</div>
        <div className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)' }}>£{projectedRefund}</div>
        <div className="text-xs text-gray-400">
          <span className="font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>{((projectedRefund / Number(premiumAmount)) * 100).toFixed(1)}%</span> of £{premiumAmount} premium
        </div>
      </div>
    </>
  );
}
