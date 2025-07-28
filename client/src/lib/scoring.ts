// Driiva Scoring System - Optimized for Runtime Stability

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

/**
 * Calculate personal driving score (0-100)
 * Higher scores indicate better driving
 */
export function calculatePersonalScore(metrics: ScoringMetrics): number {
  try {
    if (!metrics || typeof metrics !== 'object') {
      return 0;
    }

    // Ensure all metrics are numbers
    const safeMetrics = {
      hardBrakingScore: Number(metrics.hardBrakingScore) || 0,
      accelerationScore: Number(metrics.accelerationScore) || 0,
      speedAdherenceScore: Number(metrics.speedAdherenceScore) || 0,
      nightDrivingScore: Number(metrics.nightDrivingScore) || 0,
      totalMiles: Number(metrics.totalMiles) || 0,
      totalTrips: Number(metrics.totalTrips) || 1
    };

    // Calculate base score (lower incident counts = higher scores)
    const hardBrakingScore = Math.max(0, 100 - (safeMetrics.hardBrakingScore * 5));
    const accelerationScore = Math.max(0, 100 - (safeMetrics.accelerationScore * 8));
    const speedScore = Math.max(0, 100 - (safeMetrics.speedAdherenceScore * 10));
    const nightScore = Math.max(0, 100 - (safeMetrics.nightDrivingScore * 3));

    // Weight the components
    const weightedScore = (
      hardBrakingScore * 0.3 +
      accelerationScore * 0.25 +
      speedScore * 0.35 +
      nightScore * 0.1
    );

    // Apply experience bonus for more trips
    const experienceBonus = Math.min(5, safeMetrics.totalTrips * 0.1);

    // Apply mileage consistency bonus
    const avgMilesPerTrip = safeMetrics.totalMiles / safeMetrics.totalTrips;
    const consistencyBonus = avgMilesPerTrip > 20 && avgMilesPerTrip < 100 ? 2 : 0;

    const finalScore = Math.min(100, Math.max(0, weightedScore + experienceBonus + consistencyBonus));
    return Math.round(finalScore);
  } catch (error) {
    console.error('Error calculating personal score:', error);
    return 0;
  }
}

/**
 * Calculate community score based on pool safety factor
 */
export function calculateCommunityScore(poolSafetyFactor: number): number {
  try {
    const safeFactor = Number(poolSafetyFactor) || 0.5;
    return Math.round(Math.max(0, Math.min(100, safeFactor * 100)));
  } catch (error) {
    console.error('Error calculating community score:', error);
    return 50;
  }
}

/**
 * Calculate total weighted score (70% personal, 30% community)
 */
export function calculateTotalScore(personalScore: number, communityScore: number): number {
  try {
    const safePersonal = Number(personalScore) || 0;
    const safeCommunity = Number(communityScore) || 0;

    const totalScore = (safePersonal * 0.7) + (safeCommunity * 0.3);
    return Math.round(Math.max(0, Math.min(100, totalScore)));
  } catch (error) {
    console.error('Error calculating total score:', error);
    return 0;
  }
}

/**
 * Calculate refund eligibility and amount
 * Users with 70+ personal score qualify for up to 15% refund
 */
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

    // Qualification threshold: 70+ personal score
    const qualifiesForRefund = safePersonal >= 70;

    let refundPercentage = 0;
    if (qualifiesForRefund) {
      // Scale refund from 5% to 15% based on personal score (70-100)
      const scoreRange = Math.max(0, safePersonal - 70);
      refundPercentage = 5 + (scoreRange / 30) * 10; // 5% + up to 10% more

      // Apply community factor (0.8 to 1.2 multiplier)
      const communityMultiplier = 0.8 + (safeFactor * 0.4);
      refundPercentage *= communityMultiplier;

      // Cap at 15%
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

/**
 * Simulate score changes for refund calculator
 */
export function simulateScoreChange(
  currentScore: number,
  targetScore: number,
  premiumAmount: number,
  poolSafetyFactor: number = 0.85
): RefundCalculation {
  try {
    const safeTarget = Math.max(0, Math.min(100, Number(targetScore) || 0));
    return calculateRefund(safeTarget, premiumAmount, poolSafetyFactor);
  } catch (error) {
    console.error('Error simulating score change:', error);
    return calculateRefund(currentScore, premiumAmount, poolSafetyFactor);
  }
}