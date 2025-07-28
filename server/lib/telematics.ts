
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
  altitude?: number;
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
  score: number;
  hardBrakingEvents: number;
  harshAccelerationEvents: number;
  speedViolations: number;
  nightDriving: boolean;
  sharpCorners: number;
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  ecoScore: number;
}

export class TelematicsProcessor {
  private readonly HARD_BRAKING_THRESHOLD = 0.3;
  private readonly HARSH_ACCELERATION_THRESHOLD = 0.2;
  private readonly CORNERING_THRESHOLD = 0.25;
  private readonly SPEED_VIOLATION_THRESHOLD = 5;
  private readonly NIGHT_HOURS = { start: 22, end: 5 };

  private readonly SCORING_WEIGHTS = {
    hardBraking: 0.25,
    acceleration: 0.20,
    speed: 0.20,
    nightDriving: 0.15,
    cornering: 0.10,
    consistency: 0.10
  };

  async processTrip(telematicsData: TelematicsData, userId: number): Promise<DrivingMetrics> {
    const distance = this.calculateDistance(telematicsData.gpsPoints);
    const duration = this.calculateDuration(telematicsData.gpsPoints);
    const avgSpeed = this.calculateAverageSpeed(telematicsData.speedData);
    const maxSpeed = this.calculateMaxSpeed(telematicsData.speedData);
    
    const hardBrakingEvents = this.detectHardBraking(telematicsData.accelerometerData);
    const harshAccelerationEvents = this.detectHarshAcceleration(telematicsData.accelerometerData);
    const speedViolations = this.detectSpeedViolations(telematicsData.speedData);
    const nightDriving = this.isNightDriving(telematicsData.gpsPoints);
    const sharpCorners = this.detectSharpCorners(telematicsData.gyroscopeData);
    
    const ecoScore = this.calculateEcoScore({
      avgSpeed,
      hardBrakingEvents,
      harshAccelerationEvents
    });

    const score = this.calculateOverallScore({
      hardBrakingEvents,
      harshAccelerationEvents,
      speedViolations,
      nightDriving,
      sharpCorners,
      ecoScore
    });

    return {
      score,
      hardBrakingEvents,
      harshAccelerationEvents,
      speedViolations,
      nightDriving,
      sharpCorners,
      distance,
      duration,
      avgSpeed,
      maxSpeed,
      ecoScore
    };
  }

  /**
   * Calculate refund projection with corrected business logic
   * Only drivers with personal score >= 70 are eligible
   */
  calculateRefund(personalScore: number, poolSafetyFactor: number, premiumAmount: number): number {
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
    const baseRefund = premiumAmount * Math.min(refundRate, maxRefundRate);

    // Apply pool safety factor adjustment (typically 0.8-1.0)
    const adjustedRefund = baseRefund * poolSafetyFactor;

    // Ensure refund doesn't exceed maximum possible
    const finalRefund = Math.min(adjustedRefund, premiumAmount * maxRefundRate);

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
    return Math.round((gpsPoints[gpsPoints.length - 1].timestamp - gpsPoints[0].timestamp) / 60000);
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
    return Math.floor(corners / 10); // Group consecutive readings
  }

  private detectSpeedViolations(speedData: SpeedReading[]): number {
    let violations = 0;
    for (const reading of speedData) {
      if (reading.speedLimit && reading.speed > reading.speedLimit + this.SPEED_VIOLATION_THRESHOLD) {
        violations++;
      }
    }
    return Math.floor(violations / 5); // Group consecutive violations
  }

  private calculateEcoScore(metrics: {
    avgSpeed: number;
    hardBrakingEvents: number;
    harshAccelerationEvents: number;
  }): number {
    let score = 100;

    // Penalize excessive speeding
    if (metrics.avgSpeed > 70) {
      score -= (metrics.avgSpeed - 70) * 0.5;
    }

    // Penalize harsh driving behaviors
    score -= (metrics.hardBrakingEvents + metrics.harshAccelerationEvents) * 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallScore(metrics: {
    hardBrakingEvents: number;
    harshAccelerationEvents: number;
    speedViolations: number;
    nightDriving: boolean;
    sharpCorners: number;
    ecoScore: number;
  }): number {
    const hardBrakingScore = Math.max(0, 100 - (metrics.hardBrakingEvents * 5));
    const accelerationScore = Math.max(0, 100 - (metrics.harshAccelerationEvents * 3));
    const speedScore = Math.max(0, 100 - (metrics.speedViolations * 2));
    const nightScore = metrics.nightDriving ? 85 : 100;
    const corneringScore = Math.max(0, 100 - (metrics.sharpCorners * 2));
    const consistencyScore = 100; // Would be calculated over multiple trips

    const weightedScore = 
      hardBrakingScore * this.SCORING_WEIGHTS.hardBraking +
      accelerationScore * this.SCORING_WEIGHTS.acceleration +
      speedScore * this.SCORING_WEIGHTS.speed +
      nightScore * this.SCORING_WEIGHTS.nightDriving +
      corneringScore * this.SCORING_WEIGHTS.cornering +
      consistencyScore * this.SCORING_WEIGHTS.consistency;

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

export const telematicsProcessor = new TelematicsProcessor();
