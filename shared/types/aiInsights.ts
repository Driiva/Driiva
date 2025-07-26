export interface AIInsight {
  riskTrend: 'decreasing' | 'stable' | 'increasing';
  refundPrediction: {
    amount: number;
    confidence: number;
    timeline: string;
  };
  recommendations: string[];
  sustainabilityScore: {
    co2Saved: number;
    ecoRank: number;
    monthlyTrend: 'improving' | 'stable' | 'declining';
  };
  behaviorPatterns: {
    bestDays: string[];
    riskiestTimes: string[];
    improvementAreas: string[];
  };
  communityComparison: {
    betterThan: number;
    topPercentile: boolean;
    potentialRefundBoost: number;
  };
}