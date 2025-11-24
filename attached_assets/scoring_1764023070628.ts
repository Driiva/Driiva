// Fixed: Driiva Scoring System with enhanced error handling

export interface ScoringMetrics {
  hardBrakingScore: number;
  accelerationScore: number;
  speedAdherenceScore: number;
  nightDrivingScore: number;
  totalMiles: number;
  totalTrips: number;
}

export interface RefundCalculation {
  personalScore: number;
  communityScore: number;
  totalScore: number;
  refundPercentage: number;
  refundAmount: number;
  qualifiesForRefund: boolean;
}

export function calculatePersonalScore(metrics: ScoringMetrics): number {
  try {
    if (!metrics || typeof metrics !== 'object') {
      return 0;
    }

    const safeMetrics = {
      hardBrakingScore: Number(metrics.hardBrakingScore) || 0,
      accelerationScore: Number(metrics.accelerationScore) || 0,
      speedAdherenceScore: Number(metrics.speedAdherenceScore) || 0,
      nightDrivingScore: Number(metrics.nightDrivingScore) || 0,
      totalMiles: Number(metrics.totalMiles) || 0,
      totalTrips: Number(metrics.totalTrips) || 1
    };

    const hardBrakingScore = Math.max(0, 100 - (safeMetrics.hardBrakingScore * 5));
    const accelerationScore = Math.max(0, 100 - (safeMetrics.accelerationScore * 8));
    const speedScore = Math.max(0, 100 - (safeMetrics.speedAdherenceScore * 10));
    const nightScore = Math.max(0, 100 - (safeMetrics.nightDrivingScore * 3));

    const weightedScore = (
      hardBrakingScore * 0.3 +
      accelerationScore * 0.25 +
      speedScore * 0.35 +
      nightScore * 0.1
    );

    const experienceBonus = Math.min(5, safeMetrics.totalTrips * 0.1);
    const avgMilesPerTrip = safeMetrics.totalMiles / safeMetrics.totalTrips;
    const consistencyBonus = avgMilesPerTrip > 20 && avgMilesPerTrip < 100 ? 2 : 0;

    const finalScore = Math.min(100, Math.max(0, weightedScore + experienceBonus + consistencyBonus));
    return Math.round(finalScore);
  } catch (error) {
    console.error('Error calculating personal score:', error);
    return 0;
  }
}

export function calculateCommunityScore(poolSafetyFactor: number): number {
  try {
    const safeFactor = Number(poolSafetyFactor) || 0.5;
    return Math.round(Math.max(0, Math.min(100, safeFactor * 100)));
  } catch (error) {
    console.error('Error calculating community score:', error);
    return 50;
  }
}

export function calculateTotalScore(personalScore: number, communityScore: number): number {
  try {
    const safePersonal = Number(personalScore) || 0;
    const safeCommunity = Number(communityScore) || 0;
    const totalScore = (safePersonal * 0.8) + (safeCommunity * 0.2);
    return Math.round(Math.max(0, Math.min(100, totalScore)));
  } catch (error) {
    console.error('Error calculating total score:', error);
    return 0;
  }
}

export function calculateRefund(
  personalScore: number,
  premiumAmount: number,
  poolSafetyFactor: number = 0.85
): RefundCalculation {
  try {
    const safePersonal = Number(personalScore) || 0;
    const safePremium = Number(premiumAmount) || 0;
    const safeFactor = Number(poolSafetyFactor) || 0.85;

    const communityScore = calculateCommunityScore(safeFactor);
    const totalScore = calculateTotalScore(safePersonal, communityScore);
    const qualifiesForRefund = safePersonal >= 70;

    let refundPercentage = 0;
    if (qualifiesForRefund) {
      const scoreRange = Math.max(0, safePersonal - 70);
      const baseRefund = 5;
      const additionalRefund = (scoreRange / 30) * 10;
      refundPercentage = baseRefund + additionalRefund;

      const poolAdjustment = safeFactor > 0.8 ? 1.0 : 0.9;
      refundPercentage *= poolAdjustment;
      refundPercentage = Math.min(15, refundPercentage);
    }

    const refundAmount = (safePremium * refundPercentage) / 100;

    return {
      personalScore: safePersonal,
      communityScore,
      totalScore,
      refundPercentage: Math.round(refundPercentage * 100) / 100,
      refundAmount: Math.round(refundAmount * 100) / 100,
      qualifiesForRefund
    };
  } catch (error) {
    console.error('Error calculating refund:', error);
    return {
      personalScore: 0,
      communityScore: 50,
      totalScore: 0,
      refundPercentage: 0,
      refundAmount: 0,
      qualifiesForRefund: false
    };
  }
}

export const drivingScorer = {
  calculatePersonalScore,
  calculateCommunityScore,
  calculateTotalScore,
  calculateRefund,
  
  calculateRefundProjection(
    score: number,
    poolSafetyFactor: number,
    premiumAmount: number
  ): number {
    try {
      const refundCalc = calculateRefund(score, premiumAmount, poolSafetyFactor);
      return refundCalc.refundAmount;
    } catch (error) {
      console.error('Error calculating refund projection:', error);
      return 0;
    }
  }
};

