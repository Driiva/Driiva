interface LiquidGaugeProps {
  score: number;
  projectedRefund: number;
  premiumAmount: number;
}

import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Info } from "lucide-react";

export default function LiquidGauge({ score, projectedRefund, premiumAmount }: LiquidGaugeProps) {
  const { toast } = useToast();
  const strokeOffset = 283 - (score / 100) * 283;
  const personalScore = Math.round(score * 0.8);
  const poolScore = Math.round(score * 0.2);
  const gaugeSize = 150; // Define gaugeSize here

  const handleScoreClick = () => {
    toast({
      title: "Score Breakdown",
      description: `Personal driving: ${personalScore}/100 (80% weight)\nCommunity pool: ${poolScore}/100 (20% weight)\nTotal score: ${score}/100`,
    });
  };

  return (
    <>
      {/* Liquid Fill Gauge for Driving Score */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Dynamic Illumination Ring */}
        <div className="absolute inset-2 rounded-full animate-pulse" style={{
          background: 'conic-gradient(from 0deg, #D97706, #DC2626, #7C3AED, #3B82F6, #D97706)',
          filter: 'blur(12px)',
          opacity: 0.4,
          animation: 'spin 6s linear infinite',
        }} />
        
        <svg 
          className="relative w-full h-full progress-ring z-10" 
          viewBox="0 0 100 100"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(217, 119, 6, 0.6))',
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
              <stop offset="0%" style={{ stopColor: '#D97706', stopOpacity: 1 }} />
              <stop offset="25%" style={{ stopColor: '#DC2626', stopOpacity: 1 }} />
              <stop offset="75%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            onClick={handleScoreClick} 
            className="text-center hover:scale-105 transition-transform duration-200" 
            data-testid="driving-score-button"
          >
            <div 
              className="text-white font-semibold" 
              style={{ 
                fontSize: 'var(--font-display)', // 28px professional scale
                fontFamily: 'SF Pro Display, Inter, sans-serif',
                fontWeight: '600', // Semi-bold instead of bold
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                lineHeight: '1.1'
              }}
              data-testid="driving-score-value"
            >
              {score}
            </div>
            <div 
              className="text-white/90 mt-1" 
              style={{ 
                fontSize: 'var(--font-caption)', // 12px professional scale
                fontFamily: 'SF Pro Text, Inter, sans-serif',
                fontWeight: '400',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                letterSpacing: '0.5px'
              }}
            >
              out of 100
            </div>
          </button>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <div 
            className="text-white font-semibold" 
            style={{ 
              fontSize: 'var(--font-body)', // 16px professional scale
              fontFamily: 'SF Pro Display, Inter, sans-serif',
              fontWeight: '600',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
            data-testid="personal-score"
          >
            {personalScore}%
          </div>
          <div 
            className="text-white/80 mt-1" 
            style={{ 
              fontSize: 'var(--font-caption)', // 12px professional scale
              fontFamily: 'SF Pro Text, Inter, sans-serif',
              fontWeight: '400',
              textShadow: '0 1px 1px rgba(0,0,0,0.4)'
            }}
          >
            Personal Score
          </div>
        </div>
        <div className="text-center">
          <div 
            className="text-white font-semibold" 
            style={{ 
              fontSize: 'var(--font-body)', // 16px professional scale
              fontFamily: 'SF Pro Display, Inter, sans-serif',
              fontWeight: '600',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
            data-testid="pool-score"
          >
            {poolScore}%
          </div>
          <div 
            className="text-white/80 mt-1" 
            style={{ 
              fontSize: 'var(--font-caption)', // 12px professional scale
              fontFamily: 'SF Pro Text, Inter, sans-serif',
              fontWeight: '400',
              textShadow: '0 1px 1px rgba(0,0,0,0.4)'
            }}
          >
            Pool Score
          </div>
        </div>
      </div>

      {/* Projected Refund */}
      <div 
        className="text-center glass-card" 
        style={{
          padding: 'var(--space-4)', // 16px using design token
          borderRadius: 'var(--radius-card)', // 12px using design token
          marginBottom: 'var(--space-3)' // 12px
        }}
        data-testid="projected-refund-card"
      >
        <div 
          className="text-white/90 mb-2" 
          style={{ 
            fontSize: 'var(--font-body)', // 16px professional scale for subheadings
            fontFamily: 'SF Pro Text, Inter, sans-serif',
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            letterSpacing: '0.5px'
          }}
        >
          Projected Annual Refund
        </div>
        <div 
          className="text-white font-semibold" 
          style={{ 
            fontSize: 'var(--font-heading)', // 20px professional scale
            fontFamily: 'SF Pro Display, Inter, sans-serif',
            fontWeight: '600', // Semi-bold instead of bold
            textShadow: '0 1px 3px rgba(0,0,0,0.5)'
          }}
          data-testid="refund-amount"
        >
          £{projectedRefund.toFixed(2)}
        </div>
        <div 
          className="text-white/80 mt-2" 
          style={{ 
            fontSize: 'var(--font-caption)', // 12px professional scale
            fontFamily: 'SF Pro Text, Inter, sans-serif',
            fontWeight: '400',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          <span 
            className="font-semibold text-white" 
            style={{ 
              fontWeight: '600'
            }}
          >
            {((projectedRefund / Number(premiumAmount)) * 100).toFixed(1)}%
          </span> of £{premiumAmount.toLocaleString()} premium
        </div>
      </div>
    </>
  );
}