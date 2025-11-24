import React from 'react';

interface GamificationProps {
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    iconUrl: string;
    unlockedAt: string;
  }>;
  leaderboard: Array<{
    id: number;
    userId: number;
    rank: number;
    score: number;
    weeklyScore: number;
  }>;
  currentUser: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    premiumAmount: string;
  };
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
  premiumAmount: number;
}

export default function Gamification({ achievements, leaderboard }: GamificationProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
      <div className="space-y-2">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="flex items-center gap-3">
            <span className="text-2xl">{achievement.iconUrl}</span>
            <div>
              <div className="text-white font-medium">{achievement.name}</div>
              <div className="text-sm text-gray-400">{achievement.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

