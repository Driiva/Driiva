import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeaderboardPage() {
  // Extended leaderboard data with GDPR-compliant usernames and weekly changes
  const fullLeaderboard = [
    { rank: 1, username: "speedracer42", score: 87, weeklyChange: -2, changeType: "down" },
    { rank: 2, username: "safejenny", score: 85, weeklyChange: +3, changeType: "up" },
    { rank: 3, username: "carlover88", score: 83, weeklyChange: 0, changeType: "same" },
    { rank: 4, username: "roadmaster", score: 82, weeklyChange: +7, changeType: "up" },
    { rank: 5, username: "eco_driver", score: 81, weeklyChange: -1, changeType: "down" },
    { rank: 6, username: "nighthawk", score: 80, weeklyChange: +2, changeType: "up" },
    { rank: 7, username: "citycommuter", score: 79, weeklyChange: -4, changeType: "down" },
    { rank: 8, username: "highway_hero", score: 78, weeklyChange: +1, changeType: "up" },
    { rank: 9, username: "cruisecontrol", score: 77, weeklyChange: 0, changeType: "same" },
    { rank: 10, username: "smoothrider", score: 76, weeklyChange: +3, changeType: "up" },
    { rank: 11, username: "careful_kate", score: 75, weeklyChange: -2, changeType: "down" },
    { rank: 12, username: "autopilot_ai", score: 74, weeklyChange: +4, changeType: "up" },
    { rank: 13, username: "weekend_warrior", score: 73, weeklyChange: -1, changeType: "down" },
    { rank: 14, username: "driiva1", score: 72, weeklyChange: +5, changeType: "up" },
    { rank: 15, username: "slow_and_steady", score: 72, weeklyChange: +2, changeType: "up" },
  ];

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "up": return <TrendingUp className="w-3 h-3 text-green-400" />;
      case "down": return <TrendingDown className="w-3 h-3 text-red-400" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "up": return "text-green-400";
      case "down": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-black";
    if (rank === 2) return "bg-gray-400 text-black";
    if (rank === 3) return "bg-orange-500 text-black";
    return "bg-gray-600 text-white";
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-morphism">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <button className="w-10 h-10 glass-morphism rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">Community Leaderboard</h1>
              <p className="text-xs text-gray-300">All Driivas • This Week</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      <main className="px-4 pb-20">
        {/* Weekly Summary */}
        <div className="pt-4 mb-6">
          <Card className="glass-morphism border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span>Weekly Challenge</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">1,247</div>
                  <div className="text-xs text-gray-400">Active Drivers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">83.2</div>
                  <div className="text-xs text-gray-400">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">£127k</div>
                  <div className="text-xs text-gray-400">Pool Refunds</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="glass-morphism border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rankings</span>
              <div className="text-xs text-gray-400">Score • Change</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fullLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    entry.username === "driiva1" 
                      ? "bg-blue-500/20 border border-blue-400/30" 
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(entry.rank)}`}>
                      {entry.rank}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${
                        entry.username === "driiva1" ? "text-blue-300" : "text-white"
                      }`}>
                        {entry.username}
                        {entry.username === "driiva1" && (
                          <span className="ml-2 text-xs text-blue-400">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{entry.score}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(entry.changeType)}
                      <span className={`text-xs font-medium ${getChangeColor(entry.changeType)}`}>
                        {entry.weeklyChange === 0 ? "0" : 
                         entry.weeklyChange > 0 ? `+${entry.weeklyChange}%` : 
                         `${entry.weeklyChange}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom padding for safe area */}
        <div className="h-8" />
      </main>
    </div>
  );
}