import { InsertTrip, InsertDrivingProfile } from "@shared/schema";
import { aiRiskScoringEngine, RiskProfile } from './aiRiskScoring';

export interface TelematicsData {
  gpsPoints: GPSPoint[];
  accelerometerData: AccelerometerReading[];
  gyroscopeData: GyroscopeReading[];
  speedData: SpeedReading[];
}

export interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  speed?: number;
}

export interface AccelerometerReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface GyroscopeReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface SpeedReading {
  speed: number;
  timestamp: number;
  speedLimit?: number;
}

export interface DrivingMetrics {
  hardBrakingEvents: number;
  harshAccelerationEvents: number;
  speedViolations: number;
  nightDriving: boolean;
  sharpCorners: number;
  score: number;
  distance: number;
  duration: number;
  aiRiskProfile?: RiskProfile;
}

export class TelematicsProcessor {
  private readonly HARD_BRAKING_THRESHOLD = 0.3; // g-force
  private readonly HARSH_ACCELERATION_THRESHOLD = 0.2; // g-force
  private readonly CORNERING_THRESHOLD = 0.25; // lateral g-force
  private readonly SPEED_VIOLATION_THRESHOLD = 5; // mph over limit
  private readonly NIGHT_HOURS = { start: 22, end: 5 }; // 10 PM to 5 AM

  processTrip(telematicsData: TelematicsData): DrivingMetrics {
    const metrics: DrivingMetrics = {
      hardBrakingEvents: 0,
      harshAccelerationEvents: 0,
      speedViolations: 0,
      nightDriving: false,
      sharpCorners: 0,
      score: 0,
      distance: 0,
      duration: 0,
      aiRiskProfile: undefined
    };

    // Calculate distance and duration
    metrics.distance = this.calculateDistance(telematicsData.gpsPoints);
    metrics.duration = this.calculateDuration(telematicsData.gpsPoints);

    // Check for night driving
    metrics.nightDriving = this.isNightDriving(telematicsData.gpsPoints);

    // Analyze accelerometer data for hard braking and harsh acceleration
    metrics.hardBrakingEvents = this.detectHardBraking(telematicsData.accelerometerData);
    metrics.harshAccelerationEvents = this.detectHarshAcceleration(telematicsData.accelerometerData);

    // Analyze gyroscope data for sharp cornering
    metrics.sharpCorners = this.detectSharpCorners(telematicsData.gyroscopeData);

    // Analyze speed violations
    metrics.speedViolations = this.detectSpeedViolations(telematicsData.speedData);

    // Calculate overall score
    metrics.score = this.calculateScore(metrics);

    // Calculate AI risk profile
    try {
      metrics.aiRiskProfile = aiRiskScoringEngine.calculateAIRiskScore(
        telematicsData,
        metrics
        // TODO: Pass historical data when available
      );
    } catch (error) {
      console.error('AI risk scoring failed:', error);
      // Continue without AI scoring if it fails
    }

    return metrics;
  }

  private calculateDistance(gpsPoints: GPSPoint[]): number {
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

  private isNightDriving(gpsPoints: GPSPoint[]): boolean {
    for (const point of gpsPoints) {
      const hour = new Date(point.timestamp).getHours();
      if (hour >= this.NIGHT_HOURS.start || hour <= this.NIGHT_HOURS.end) {
        return true;
      }
    }
    return false;
  }

  private detectHardBraking(accelerometerData: AccelerometerReading[]): number {
    let events = 0;
    for (let i = 1; i < accelerometerData.length; i++) {
      const deceleration = accelerometerData[i - 1].x - accelerometerData[i].x;
      if (Math.abs(deceleration) > this.HARD_BRAKING_THRESHOLD) {
        events++;
      }
    }
    return events;
  }

  private detectHarshAcceleration(accelerometerData: AccelerometerReading[]): number {
    let events = 0;
    for (let i = 1; i < accelerometerData.length; i++) {
      const acceleration = accelerometerData[i].x - accelerometerData[i - 1].x;
      if (Math.abs(acceleration) > this.HARSH_ACCELERATION_THRESHOLD) {
        events++;
      }
    }
    return events;
  }

  private detectSharpCorners(gyroscopeData: GyroscopeReading[]): number {
    let corners = 0;
    for (const reading of gyroscopeData) {
      const lateralForce = Math.sqrt(reading.x * reading.x + reading.y * reading.y);
      if (lateralForce > this.CORNERING_THRESHOLD) {
        corners++;
      }
    }
    return corners;
  }

  private detectSpeedViolations(speedData: SpeedReading[]): number {
    let violations = 0;
    for (const reading of speedData) {
      if (reading.speedLimit && reading.speed > reading.speedLimit + this.SPEED_VIOLATION_THRESHOLD) {
        violations++;
      }
    }
    return violations;
  }

  private calculateScore(metrics: DrivingMetrics): number {
    // Scoring weights as per business requirements
    const weights = {
      hardBraking: 0.25,
      acceleration: 0.20,
      speed: 0.20,
      nightDriving: 0.15,
      cornering: 0.10,
      consistency: 0.10
    };

    let score = 100;

    // Deduct points for violations
    score -= metrics.hardBrakingEvents * 2;
    score -= metrics.harshAccelerationEvents * 1;
    score -= metrics.speedViolations * 1;
    score -= metrics.nightDriving ? 2 : 0;
    score -= metrics.sharpCorners * 1;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  calculateRefund(personalScore: number, poolSafetyFactor: number, premiumAmount: number): number {
    const maxRefundPercentage = 0.15; // 15% max refund
    const weightedScore = (personalScore * 0.8) + (poolSafetyFactor * 100 * 0.2);
    const refundPercentage = (weightedScore / 100) * maxRefundPercentage;
    return Number((premiumAmount * refundPercentage).toFixed(2));
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

export const telematicsProcessor = new TelematicsProcessor();
