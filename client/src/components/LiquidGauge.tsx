interface LiquidGaugeProps {
  score: number;
  projectedRefund: number;
  premiumAmount: number;
}

export default function LiquidGauge({ score, projectedRefund, premiumAmount }: LiquidGaugeProps) {
  const strokeOffset = 283 - (score / 100) * 283;
  const personalScore = Math.round(score * 0.8);
  const poolScore = Math.round(score * 0.2);
  const gaugeSize = 150; // Define gaugeSize here

  return (
    <>
      {/* Liquid Fill Gauge for Driving Score */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg 
          className="w-full h-full progress-ring" 
          viewBox="0 0 100 100"
          style={{
            filter: 'drop-shadow(0 0 16px rgba(139, 69, 19, 0.4)) drop-shadow(0 0 32px rgba(184, 115, 51, 0.3))',
          }}
        >
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
            style={{ 
              strokeDashoffset: strokeOffset,
              filter: 'drop-shadow(0 0 8px rgba(139, 69, 19, 0.6))'
            }}
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
            <div className="text-4xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" style={{ 
              textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '700'
            }}>{score}</div>
            <div className="text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ 
              textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
              fontFamily: 'Inter, sans-serif'
            }}>out of 100</div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center">
          <div className="text-base font-semibold text-white" style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600'
          }}>{personalScore}%</div>
          <div className="text-xs text-white/80" style={{ 
            fontFamily: 'Inter, sans-serif'
          }}>Personal Score</div>
        </div>
        <div className="text-center">
          <div className="text-base font-semibold text-white" style={{ 
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600'
          }}>{poolScore}%</div>
          <div className="text-xs text-white/80" style={{ 
            fontFamily: 'Inter, sans-serif'
          }}>Pool Score</div>
        </div>
      </div>

      {/* Projected Refund */}
      <div className="text-center p-3 rounded-xl" style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="text-xs text-white mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
          fontFamily: 'Inter, sans-serif'
        }}>Projected Annual Refund</div>
        <div className="text-2xl font-bold text-white" style={{ 
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700'
        }}>£{projectedRefund}</div>
        <div className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
          fontFamily: 'Inter, sans-serif'
        }}>
          <span className="font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ 
            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600'
          }}>{((projectedRefund / Number(premiumAmount)) * 100).toFixed(1)}%</span> of £{premiumAmount} premium
        </div>
      </div>
    </>
  );
}