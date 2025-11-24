import React from 'react';
import { Users, Shield, TrendingUp } from 'lucide-react';

interface CommunityPoolProps {
  pool: {
    poolAmount: number;
    safetyFactor: number;
    participantCount: number;
    safeDriverCount: number;
    averageScore?: number;
  };
}

export default function CommunityPool({ pool }: CommunityPoolProps) {
  const poolPercentage = (pool.safetyFactor * 100).toFixed(0);
  const safeDriverPercentage = ((pool.safeDriverCount / pool.participantCount) * 100).toFixed(0);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Community Pool</h3>
            <p className="text-sm text-gray-400">Shared safety rewards</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            £{(pool.poolAmount / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-gray-400">Total Pool</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400">{poolPercentage}%</div>
          <div className="text-xs text-gray-400">Safety Factor</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-400">{pool.participantCount.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Drivers</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-400">{safeDriverPercentage}%</div>
          <div className="text-xs text-gray-400">Safe Drivers</div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span>Community safety is trending upward this month</span>
        </div>
      </div>
    </div>
  );
}

