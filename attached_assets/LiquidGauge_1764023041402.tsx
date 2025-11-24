import React from 'react';

interface LiquidGaugeProps {
  score: number;
  projectedRefund: number;
  premiumAmount: number;
}

export default function LiquidGauge({ score, projectedRefund, premiumAmount }: LiquidGaugeProps) {
  return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <div className="text-4xl font-bold text-white mb-2">{score}</div>
      <div className="text-sm text-gray-400 mb-4">Safety Score</div>
      <div className="text-lg font-semibold text-green-400">£{projectedRefund.toFixed(2)}</div>
      <div className="text-xs text-gray-400">Projected Refund</div>
    </div>
  );
}

