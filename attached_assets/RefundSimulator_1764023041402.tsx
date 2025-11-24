import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { drivingScorer } from '@/lib/scoring';

interface RefundSimulatorProps {
  currentScore: number;
  premiumAmount: number;
  poolSafetyFactor: number;
}

export default function RefundSimulator({ 
  currentScore, 
  premiumAmount, 
  poolSafetyFactor 
}: RefundSimulatorProps) {
  const [simulatedScore, setSimulatedScore] = useState(currentScore);

  const refundCalculation = useMemo(() => {
    return drivingScorer.calculateRefund(simulatedScore, premiumAmount, poolSafetyFactor);
  }, [simulatedScore, premiumAmount, poolSafetyFactor]);

  const improvement = simulatedScore - currentScore;
  const refundIncrease = refundCalculation.refundAmount - 
    drivingScorer.calculateRefund(currentScore, premiumAmount, poolSafetyFactor).refundAmount;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Refund Simulator</h3>
          <p className="text-sm text-gray-400">See how improving your score affects refunds</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Simulated Score</span>
          <span className="text-lg font-bold text-white">{simulatedScore}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={simulatedScore}
            onChange={(e) => setSimulatedScore(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f59e0b 40%, #10b981 70%, #06b6d4 100%)`
            }}
          />
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg"
            style={{ 
              left: `${(simulatedScore / 100) * 100}%`,
              marginLeft: '-10px',
              boxShadow: '0 2px 8px rgba(113, 63, 18, 0.6), 0 0 20px rgba(88, 28, 135, 0.4)'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-400">
            £{refundCalculation.refundAmount.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Projected Refund</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">
            {refundCalculation.refundPercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Refund Rate</div>
        </div>
      </div>

      {improvement > 0 && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span>
              +{improvement} points = £{refundIncrease.toFixed(2)} more refund
            </span>
          </div>
        </div>
      )}

      {!refundCalculation.qualifiesForRefund && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
          <div className="text-sm text-orange-400">
            Score 70+ to qualify for refunds. You need {70 - simulatedScore} more points.
          </div>
        </div>
      )}
    </div>
  );
}

