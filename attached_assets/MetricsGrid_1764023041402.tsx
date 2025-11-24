import React from 'react';

interface MetricsGridProps {
  profile: {
    currentScore: number;
    projectedRefund: number;
    totalMiles: number;
    totalTrips: number;
    hardBrakingScore: number;
    accelerationScore: number;
    speedAdherenceScore: number;
    nightDrivingScore: number;
  };
}

export default function MetricsGrid({ profile }: MetricsGridProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Driving Metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">Total Miles</div>
          <div className="text-xl font-bold text-white">{profile.totalMiles.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Total Trips</div>
          <div className="text-xl font-bold text-white">{profile.totalTrips}</div>
        </div>
      </div>
    </div>
  );
}

