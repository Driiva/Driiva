import { TelematicsData, GPSPoint, AccelerometerReading, GyroscopeReading, SpeedReading } from './telematics';

export interface RiskProfile {
  riskScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedClaimProbability: number;
  confidenceScore: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  factor: string;
  impact: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface DrivingMetrics {
  hardBrakingEvents: number;
  harshAccelerationEvents: number;
  speedViolations: number;
  nightDriving: boolean;
  sharpCorners: number;
  consistencyScore: number;
  score: number;
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  ecoScore: number;
  aiRiskProfile?: RiskProfile;
}

export interface ScoreBreakdown {
  hardBraking: { score: number; weight: number; events: number };
  acceleration: { score: number; weight: number; events: number };
  speed: { score: number; weight: number; violations: number };
  nightDriving: { score: number; weight: number; hours: number };
  cornering: { score: number; weight: number; events: number };
  consistency: { score: number; weight: number; days: number };
}

export interface DrivingProfile {
  id?: number;
  userId: number;
  currentScore?: number;
  hardBrakingScore?: number;
  accelerationScore?: number;
  speedAdherenceScore?: number;
  nightDrivingScore?: number;
  corneringScore?: number;
  consistencyScore?: number;
  totalTrips?: number;
  totalMiles?: string;
  averageSpeed?: number;
  hardBraking?: number;
  rapidAcceleration?: number;
  totalDistance?: number;
  tripCount?: number;
  scoreDeviation?: number;
  createdAt?: string;
  updatedAt?: string;
}

export class DrivingScorer {
  private readonly SCORING_WEIGHTS = {
    hardBraking: 0.25,
    acceleration: 0.20,
    speed: 0.20,
    nightDriving: 0.15,
    cornering: 0.10,
    consistency: 0.10
  };

  private readonly THRESHOLDS = {
    hardBraking: 0.3, // g-force
    harshAcceleration: 0.2, // g-force
    cornering: 0.25, // lateral g-force
    speedViolation: 5, // mph over limit
    nightHours: { start: 22, end: 5 } // 10 PM to 5 AM
  };

  calculateDrivingMetrics(telematicsData: TelematicsData): DrivingMetrics {
    const metrics: DrivingMetrics = {
      hardBrakingEvents: 0,
      harshAccelerationEvents: 0,
      speedViolations: 0,
      nightDriving: false,
      sharpCorners: 0,
      consistencyScore: 100,
      score: 0,
      distance: 0,
      duration: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      ecoScore: 100
    };

    // Calculate basic trip metrics
    metrics.distance = this.calculateDistance(telematicsData.gpsPoints);
    metrics.duration = this.calculateDuration(telematicsData.gpsPoints);
    metrics.avgSpeed = this.calculateAverageSpeed(telematicsData.speedData);
    metrics.maxSpeed = this.calculateMaxSpeed(telematicsData.speedData);

    // Check for night driving
    metrics.nightDriving = this.isNightDriving(telematicsData.gpsPoints);

    // Analyze driving behaviors
    metrics.hardBrakingEvents = this.detectHardBraking(telematicsData.accelerometerData);
    metrics.harshAccelerationEvents = this.detectHarshAcceleration(telematicsData.accelerometerData);
    metrics.sharpCorners = this.detectSharpCorners(telematicsData.gyroscopeData);
    metrics.speedViolations = this.detectSpeedViolations(telematicsData.speedData);

    // Calculate eco score
    metrics.ecoScore = this.calculateEcoScore(telematicsData);

    // Calculate overall score
    metrics.score = this.calculateOverallScore(metrics);

    return metrics;
  }

  calculateScoreBreakdown(metrics: DrivingMetrics): ScoreBreakdown {
    return {
      hardBraking: {
        score: Math.max(0, 100 - (metrics.hardBrakingEvents * 5)),
        weight: this.SCORING_WEIGHTS.hardBraking,
        events: metrics.hardBrakingEvents
      },
      acceleration: {
        score: Math.max(0, 100 - (metrics.harshAccelerationEvents * 3)),
        weight: this.SCORING_WEIGHTS.acceleration,
        events: metrics.harshAccelerationEvents
      },
      speed: {
        score: Math.max(0, 100 - (metrics.speedViolations * 2)),
        weight: this.SCORING_WEIGHTS.speed,
        violations: metrics.speedViolations
      },
      nightDriving: {
        score: metrics.nightDriving ? 85 : 100,
        weight: this.SCORING_WEIGHTS.nightDriving,
        hours: metrics.nightDriving ? metrics.duration / 60 : 0
      },
      cornering: {
        score: Math.max(0, 100 - (metrics.sharpCorners * 2)),
        weight: this.SCORING_WEIGHTS.cornering,
        events: metrics.sharpCorners
      },
      consistency: {
        score: metrics.consistencyScore,
        weight: this.SCORING_WEIGHTS.consistency,
        days: 1 // This would be calculated over multiple trips
      }
    };
  }

  /**
   * Calculate refund projection based on corrected business logic
   * Only drivers with personal score >= 70 are eligible for refunds
   */
  calculateRefundProjection(
    personalScore: number,
    poolSafetyFactor: number,
    premiumAmount: number
  ): number {
    // Eligibility check: Only drivers with personal score >= 70 qualify
    if (personalScore < 70) {
      return 0;
    }

    // Community average score is 75 as per documentation
    const communityScore = 75;

    // Weighting: 80% personal, 20% community (per documentation)
    const weightedScore = (personalScore * 0.8) + (communityScore * 0.2);

    // Base refund calculation: 5% at 70 score, scaling to 15% at 100 score
    const minRefundRate = 0.05; // 5% minimum refund at 70+ score
    const maxRefundRate = 0.15; // 15% maximum refund at 100 score
    const scoreRange = 100 - 70; // 30 point scoring range
    const scoreAboveMin = Math.max(0, weightedScore - 70);

    // Linear interpolation between min and max refund rates
    const refundRate = minRefundRate + ((maxRefundRate - minRefundRate) * (scoreAboveMin / scoreRange));

    // Calculate base refund amount
    const baseRefund = Number(premiumAmount || 1840) * Math.min(refundRate, maxRefundRate);

    // Apply pool safety factor adjustment (typically 0.8-1.0)
    const adjustedRefund = baseRefund * (poolSafetyFactor || 1.0);

    // Ensure refund doesn't exceed maximum possible
    const finalRefund = Math.min(adjustedRefund, Number(premiumAmount || 1840) * maxRefundRate);

    return Number(Math.max(0, finalRefund).toFixed(2));
  }

  private calculateDistance(gpsPoints: GPSPoint[]): number {
    if (gpsPoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < gpsPoints.length; i++) {
      totalDistance += this.haversineDistance(
        gpsPoints[i - 1].latitude,
        gpsPoints[i - 1].longitude,
        gpsPoints[i].latitude,
        gpsPoints[i].longitude
      );
    }
    return totalDistance;
  }

  private calculateDuration(gpsPoints: GPSPoint[]): number {
    if (gpsPoints.length < 2) return 0;
    return Math.round((gpsPoints[gpsPoints.length - 1].timestamp - gpsPoints[0].timestamp) / 60000); // minutes
  }

  private calculateAverageSpeed(speedData: SpeedReading[]): number {
    if (speedData.length === 0) return 0;
    const totalSpeed = speedData.reduce((sum, reading) => sum + reading.speed, 0);
    return Number((totalSpeed / speedData.length).toFixed(1));
  }

  private calculateMaxSpeed(speedData: SpeedReading[]): number {
    if (speedData.length === 0) return 0;
    return Math.max(...speedData.map(reading => reading.speed));
  }

  private isNightDriving(gpsPoints: GPSPoint[]): boolean {
    for (const point of gpsPoints) {
      const hour = new Date(point.timestamp).getHours();
      if (hour >= this.THRESHOLDS.nightHours.start || hour <= this.THRESHOLDS.nightHours.end) {
        return true;
      }
    }
    return false;
  }

  private detectHardBraking(accelerometerData: AccelerometerReading[]): number {
    let events = 0;
    const threshold = this.THRESHOLDS.hardBraking;

    for (let i = 1; i < accelerometerData.length; i++) {
      const prevReading = accelerometerData[i - 1];
      const currentReading = accelerometerData[i];

      // Calculate deceleration in the forward direction
      const deceleration = Math.abs(currentReading.x - prevReading.x);

      if (deceleration > threshold) {
        events++;
        // Prevent multiple detections for the same event
        i += 10; // Skip next 10 readings (~1 second)
      }
    }

    return events;
  }

  private detectHarshAcceleration(accelerometerData: AccelerometerReading[]): number {
    let events = 0;
    const threshold = this.THRESHOLDS.harshAcceleration;

    for (let i = 1; i < accelerometerData.length; i++) {
      const prevReading = accelerometerData[i - 1];
      const currentReading = accelerometerData[i];

      // Calculate acceleration in the forward direction
      const acceleration = Math.abs(currentReading.x - prevReading.x);

      if (acceleration > threshold) {
        events++;
        // Prevent multiple detections for the same event
        i += 10; // Skip next 10 readings (~1 second)
      }
    }

    return events;
  }

  private detectSharpCorners(gyroscopeData: GyroscopeReading[]): number {
    let corners = 0;
    const threshold = this.THRESHOLDS.cornering;

    for (const reading of gyroscopeData) {
      // Calculate lateral force from gyroscope data
      const lateralForce = Math.sqrt(reading.x * reading.x + reading.y * reading.y);

      if (lateralForce > threshold) {
        corners++;
      }
    }

    // Filter out minor variations - only count significant cornering events
    return Math.floor(corners / 20); // Group consecutive readings into single events
  }

  private detectSpeedViolations(speedData: SpeedReading[]): number {
    let violations = 0;
    const threshold = this.THRESHOLDS.speedViolation;

    for (const reading of speedData) {
      if (reading.speedLimit && reading.speed > reading.speedLimit + threshold) {
        violations++;
      }
    }

    // Group consecutive violations
    return Math.floor(violations / 10);
  }

  private calculateEcoScore(telematicsData: TelematicsData): number {
    let score = 100;

    // Penalize excessive speeding
    const avgSpeed = this.calculateAverageSpeed(telematicsData.speedData);
    if (avgSpeed > 70) {
      score -= (avgSpeed - 70) * 0.5;
    }

    // Reward smooth driving
    const harshEvents = this.detectHardBraking(telematicsData.accelerometerData) + 
                       this.detectHarshAcceleration(telematicsData.accelerometerData);
    score -= harshEvents * 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallScore(metrics: DrivingMetrics): number {
    const breakdown = this.calculateScoreBreakdown(metrics);

    let weightedScore = 0;
    Object.values(breakdown).forEach(component => {
      weightedScore += component.score * component.weight;
    });

    return Math.max(0, Math.min(100, Math.round(weightedScore)));
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const drivingScorer = new DrivingScorer();

export function calculatePersonalScore(profile: DrivingProfile): number {
  if (!profile) return 0;

  const safetyWeight = 0.4;
  const efficiencyWeight = 0.25;
  const experienceWeight = 0.25;
  const consistencyWeight = 0.1;

  // Safety Score (0-100) - primary factor
  const hardBrakingPenalty = (profile.hardBraking || 0) * 2;
  const rapidAccelPenalty = (profile.rapidAcceleration || 0) * 1.5;
  const safetyScore = Math.max(0, 100 - hardBrakingPenalty - rapidAccelPenalty);

  // Efficiency Score (0-100) - based on fuel efficiency and speed consistency
  const avgSpeed = profile.averageSpeed || 45;
  const optimalSpeed = 55; // optimal efficiency speed
  const speedEfficiency = 100 - Math.abs(avgSpeed - optimalSpeed) * 2;
  const efficiencyScore = Math.max(0, Math.min(100, speedEfficiency));

  // Experience Score (0-100) - logarithmic based on distance and trips
  const totalDistance = profile.totalDistance || 0;
  const tripCount = profile.tripCount || 0;
  const distanceScore = Math.min(70, (totalDistance / 5000) * 70);
  const tripScore = Math.min(30, (tripCount / 50) * 30);
  const experienceScore = distanceScore + tripScore;

  // Consistency Score (0-100) - reward consistent safe driving
  const scoreDeviation = profile.scoreDeviation || 15;
  const consistencyScore = Math.max(0, 100 - scoreDeviation * 3);

  const weightedScore = 
    safetyScore * safetyWeight +
    efficiencyScore * efficiencyWeight +
    experienceScore * experienceWeight +
    consistencyScore * consistencyWeight;

  // Apply bonus for excellent drivers
  let finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

  // Bonus system for consistent safe drivers
  if (safetyScore >= 85 && consistencyScore >= 70 && experienceScore >= 50) {
    finalScore = Math.min(100, finalScore + 5);
  }

  return finalScore;
}