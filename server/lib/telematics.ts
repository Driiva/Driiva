import {
  haversineMeters,
  tripDistanceMeters,
  tripDurationSeconds,
} from '../../shared/tripProcessor.js';

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
  harshBrakingCount: number; // Alias for hardBrakingEvents for consistency
  harshAccelerationEvents: number;
  speedViolations: number;
  nightDriving: boolean;
  sharpCorners: number;
  distance: number; // in kilometers
  distanceKm: number; // Explicit km field
  duration: number; // in minutes
  avgSpeed: number; // in km/h
  maxSpeed: number; // in km/h
  ecoScore: number;
  anomalies: TripAnomalies;
}

export interface TripAnomalies {
  hasImpossibleSpeed: boolean;
  hasGPSJumps: boolean;
  isDuplicate: boolean;
  impossibleSpeedDetails?: { speed: number; timestamp: number }[];
  gpsJumpDetails?: { distance: number; timeDelta: number; from: GPSPoint; to: GPSPoint }[];
  anomalyScore: number; // 0-100, lower = more anomalies
}

export interface TripJSON {
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  gpsPoints: GPSPoint[];
  events?: {
    braking?: Array<{ timestamp: number; intensity: number }>;
    acceleration?: Array<{ timestamp: number; intensity: number }>;
    cornering?: Array<{ timestamp: number; intensity: number }>;
  };
  accelerometerData?: AccelerometerReading[];
  gyroscopeData?: GyroscopeReading[];
  speedData?: SpeedReading[];
}

export class TelematicsProcessor {
  private readonly HARD_BRAKING_THRESHOLD = 0.3;
  private readonly HARSH_ACCELERATION_THRESHOLD = 0.2;
  private readonly CORNERING_THRESHOLD = 0.25;
  private readonly SPEED_VIOLATION_THRESHOLD = 5;
  private readonly NIGHT_HOURS = { start: 22, end: 5 };
  
  // Anomaly detection thresholds
  private readonly MAX_REALISTIC_SPEED_KMH = 200; // ~124 mph
  private readonly GPS_JUMP_THRESHOLD_KM = 5; // 5km jump in short time
  private readonly GPS_JUMP_TIME_THRESHOLD_MS = 60000; // 1 minute
  private readonly DUPLICATE_TRIP_TIME_THRESHOLD_MS = 300000; // 5 minutes
  private readonly DUPLICATE_TRIP_DISTANCE_THRESHOLD_KM = 0.5; // 500m

  // Canonical weights per CLAUDE.md — must match functions/src/utils/helpers.ts
  private readonly SCORING_WEIGHTS = {
    speed: 0.25,
    hardBraking: 0.25,
    acceleration: 0.20,
    cornering: 0.20,
    // TODO: Implement real phone pickup detection (accelerometer pattern recognition)
    // Currently hardcoded to 100 (no penalty) — weight is 10% per CLAUDE.md scoring spec
    phoneUsage: 0.10,
  };

  /**
   * Parse trip JSON with start/end times, GPS coordinates, and events
   */
  parseTripJSON(tripJSON: TripJSON | TelematicsData): TelematicsData {
    // If already in TelematicsData format, return as-is
    if ('gpsPoints' in tripJSON && Array.isArray(tripJSON.gpsPoints)) {
      return tripJSON as TelematicsData;
    }

    // Parse from TripJSON format
    const json = tripJSON as TripJSON;
    
    // Validate ISO 8601 timestamps
    const startTime = new Date(json.startTime);
    const endTime = new Date(json.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid ISO 8601 timestamps in trip JSON');
    }

    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }

    // Normalize GPS points timestamps to be relative to start time
    const normalizedGPSPoints = json.gpsPoints.map(point => ({
      ...point,
      timestamp: point.timestamp || startTime.getTime() + (point.timestamp || 0)
    }));

    // Convert events to sensor data if provided
    const accelerometerData = json.accelerometerData || this.convertEventsToAccelerometer(json.events);
    const gyroscopeData = json.gyroscopeData || this.convertEventsToGyroscope(json.events);
    const speedData = json.speedData || this.extractSpeedFromGPS(normalizedGPSPoints);

    return {
      gpsPoints: normalizedGPSPoints,
      accelerometerData,
      gyroscopeData,
      speedData
    };
  }

  async processTrip(telematicsData: TelematicsData | TripJSON, userId: number, existingTrips?: Array<{ startTime: Date; endTime: Date; distance: number }>): Promise<DrivingMetrics> {
    // Parse if needed
    const parsedData = this.parseTripJSON(telematicsData);
    
    // Detect anomalies first
    const anomalies = this.detectAnomalies(parsedData, existingTrips || []);
    
    // Calculate metrics
    const distanceKm = this.calculateDistanceKm(parsedData.gpsPoints);
    const duration = this.calculateDuration(parsedData.gpsPoints);
    const avgSpeed = this.calculateAverageSpeedKmh(parsedData.speedData, parsedData.gpsPoints);
    const maxSpeed = this.calculateMaxSpeedKmh(parsedData.speedData, parsedData.gpsPoints);
    
    const hardBrakingEvents = this.detectHardBraking(parsedData.accelerometerData);
    const harshAccelerationEvents = this.detectHarshAcceleration(parsedData.accelerometerData);
    const speedViolations = this.detectSpeedViolations(parsedData.speedData);
    const nightDriving = this.isNightDriving(parsedData.gpsPoints);
    const sharpCorners = this.detectSharpCorners(parsedData.gyroscopeData);
    
    const ecoScore = this.calculateEcoScore({
      avgSpeed,
      hardBrakingEvents,
      harshAccelerationEvents
    });

    // Adjust score based on anomalies
    const baseScore = this.calculateOverallScore({
      hardBrakingEvents,
      harshAccelerationEvents,
      speedViolations,
      nightDriving,
      sharpCorners,
      ecoScore
    });

    // Apply anomaly penalty
    const finalScore = Math.max(0, Math.min(100, baseScore - (100 - anomalies.anomalyScore) * 0.3));

    return {
      score: Math.round(finalScore),
      hardBrakingEvents,
      harshBrakingCount: hardBrakingEvents,
      harshAccelerationEvents,
      speedViolations,
      nightDriving,
      sharpCorners,
      distance: distanceKm,
      distanceKm,
      duration,
      avgSpeed,
      maxSpeed,
      ecoScore,
      anomalies
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

    return Math.round(Math.max(0, finalRefund) * 100); // integer cents
  }

  /**
   * Calculate distance in kilometers (uses shared/tripProcessor as source of truth)
   */
  private calculateDistanceKm(gpsPoints: GPSPoint[]): number {
    if (gpsPoints.length < 2) return 0;
    const points = gpsPoints.map((p) => ({ lat: p.latitude, lng: p.longitude }));
    const meters = tripDistanceMeters(points);
    return Number((meters / 1000).toFixed(2));
  }

  /**
   * Legacy method - kept for backward compatibility (returns km)
   */
  private calculateDistance(gpsPoints: GPSPoint[]): number {
    return this.calculateDistanceKm(gpsPoints);
  }

  /**
   * Duration in minutes (uses shared/tripProcessor for canonical duration in seconds)
   */
  private calculateDuration(gpsPoints: GPSPoint[]): number {
    if (gpsPoints.length < 2) return 0;
    const points = gpsPoints.map((p) => ({ timestamp: p.timestamp }));
    const durationSeconds = tripDurationSeconds(points);
    return Math.round(durationSeconds / 60);
  }

  /**
   * Calculate average speed in km/h
   */
  private calculateAverageSpeedKmh(speedData: SpeedReading[], gpsPoints: GPSPoint[]): number {
    // If speed data is available, use it (assuming it's in km/h)
    if (speedData.length > 0) {
      const totalSpeed = speedData.reduce((sum, reading) => sum + reading.speed, 0);
      const avgSpeed = totalSpeed / speedData.length;
      // If speed seems to be in mph (common in US), convert to km/h
      if (avgSpeed < 50) {
        return Number((avgSpeed * 1.60934).toFixed(1));
      }
      return Number(avgSpeed.toFixed(1));
    }
    
    // Calculate from GPS points if no speed data (distance/duration from shared tripProcessor)
    if (gpsPoints.length < 2) return 0;
    
    const distanceKm = this.calculateDistanceKm(gpsPoints);
    const points = gpsPoints.map((p) => ({ timestamp: p.timestamp }));
    const durationSeconds = tripDurationSeconds(points);
    const durationHours = durationSeconds / 3600;
    if (durationHours <= 0) return 0;
    return Number((distanceKm / durationHours).toFixed(1));
  }

  /**
   * Calculate max speed in km/h (segment distances from shared tripProcessor)
   */
  private calculateMaxSpeedKmh(speedData: SpeedReading[], gpsPoints: GPSPoint[]): number {
    if (speedData.length > 0) {
      const maxSpeed = Math.max(...speedData.map(reading => reading.speed));
      // Convert from mph if needed
      if (maxSpeed < 100) {
        return Number((maxSpeed * 1.60934).toFixed(1));
      }
      return Number(maxSpeed.toFixed(1));
    }
    
    // Calculate from GPS points using shared haversine
    if (gpsPoints.length < 2) return 0;
    
    let maxSpeed = 0;
    for (let i = 1; i < gpsPoints.length; i++) {
      const prev = gpsPoints[i - 1];
      const curr = gpsPoints[i];
      const distanceKm = haversineMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude) / 1000;
      const timeDeltaHours = (curr.timestamp - prev.timestamp) / (1000 * 60 * 60);
      if (timeDeltaHours > 0) {
        const speed = distanceKm / timeDeltaHours;
        maxSpeed = Math.max(maxSpeed, speed);
      }
    }
    
    return Number(maxSpeed.toFixed(1));
  }

  /**
   * Legacy methods for backward compatibility
   */
  private calculateAverageSpeed(speedData: SpeedReading[]): number {
    if (speedData.length === 0) return 0;
    const totalSpeed = speedData.reduce((sum, reading) => sum + reading.speed, 0);
    const avgSpeed = totalSpeed / speedData.length;
    // Assume input is in mph, convert to km/h
    return Number((avgSpeed * 1.60934).toFixed(1));
  }

  private calculateMaxSpeed(speedData: SpeedReading[]): number {
    if (speedData.length === 0) return 0;
    const maxSpeed = Math.max(...speedData.map(reading => reading.speed));
    // Assume input is in mph, convert to km/h
    return Number((maxSpeed * 1.60934).toFixed(1));
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
    const speedScore = Math.max(0, 100 - (metrics.speedViolations * 2));
    const hardBrakingScore = Math.max(0, 100 - (metrics.hardBrakingEvents * 5));
    const accelerationScore = Math.max(0, 100 - (metrics.harshAccelerationEvents * 3));
    const corneringScore = Math.max(0, 100 - (metrics.sharpCorners * 2));
    // Phone usage: placeholder — always 100 until phone detection is implemented
    const phoneUsageScore = 100;

    const weightedScore = 
      speedScore * this.SCORING_WEIGHTS.speed +
      hardBrakingScore * this.SCORING_WEIGHTS.hardBraking +
      accelerationScore * this.SCORING_WEIGHTS.acceleration +
      corneringScore * this.SCORING_WEIGHTS.cornering +
      phoneUsageScore * this.SCORING_WEIGHTS.phoneUsage;

    return Math.max(0, Math.min(100, Math.round(weightedScore)));
  }

  /**
   * Detect anomalies in trip data (uses shared tripProcessor for distance)
   */
  private detectAnomalies(
    telematicsData: TelematicsData,
    existingTrips: Array<{ startTime: Date; endTime: Date; distance: number }>
  ): TripAnomalies {
    const anomalies: TripAnomalies = {
      hasImpossibleSpeed: false,
      hasGPSJumps: false,
      isDuplicate: false,
      anomalyScore: 100
    };

    // Check for impossible speeds
    const impossibleSpeeds: { speed: number; timestamp: number }[] = [];
    for (const reading of telematicsData.speedData) {
      // Convert to km/h if needed (assuming input might be in mph)
      const speedKmh = reading.speed > 100 ? reading.speed : reading.speed * 1.60934;
      if (speedKmh > this.MAX_REALISTIC_SPEED_KMH) {
        impossibleSpeeds.push({ speed: speedKmh, timestamp: reading.timestamp });
        anomalies.hasImpossibleSpeed = true;
      }
    }

    // Check GPS points for impossible speeds
    for (let i = 1; i < telematicsData.gpsPoints.length; i++) {
      const point1 = telematicsData.gpsPoints[i - 1];
      const point2 = telematicsData.gpsPoints[i];
      const distanceKm = haversineMeters(
        point1.latitude, point1.longitude,
        point2.latitude, point2.longitude
      ) / 1000;
      const timeDelta = (point2.timestamp - point1.timestamp) / 1000; // seconds
      
      if (timeDelta > 0) {
        const speedKmh = (distanceKm / timeDelta) * 3.6; // m/s to km/h
        if (speedKmh > this.MAX_REALISTIC_SPEED_KMH) {
          impossibleSpeeds.push({ speed: speedKmh, timestamp: point2.timestamp });
          anomalies.hasImpossibleSpeed = true;
        }
      }
    }

    if (impossibleSpeeds.length > 0) {
      anomalies.impossibleSpeedDetails = impossibleSpeeds;
    }

    // Check for GPS jumps
    const gpsJumps: { distance: number; timeDelta: number; from: GPSPoint; to: GPSPoint }[] = [];
    for (let i = 1; i < telematicsData.gpsPoints.length; i++) {
      const point1 = telematicsData.gpsPoints[i - 1];
      const point2 = telematicsData.gpsPoints[i];
      const distanceKm = haversineMeters(
        point1.latitude, point1.longitude,
        point2.latitude, point2.longitude
      ) / 1000;
      const timeDelta = point2.timestamp - point1.timestamp;

      if (distanceKm > this.GPS_JUMP_THRESHOLD_KM && timeDelta < this.GPS_JUMP_TIME_THRESHOLD_MS) {
        gpsJumps.push({
          distance: distanceKm,
          timeDelta,
          from: point1,
          to: point2
        });
        anomalies.hasGPSJumps = true;
      }
    }

    if (gpsJumps.length > 0) {
      anomalies.gpsJumpDetails = gpsJumps;
    }

    // Check for duplicate trips
    if (telematicsData.gpsPoints.length >= 2) {
      const tripStartTime = new Date(telematicsData.gpsPoints[0].timestamp);
      const tripEndTime = new Date(telematicsData.gpsPoints[telematicsData.gpsPoints.length - 1].timestamp);
      const tripDistance = this.calculateDistanceKm(telematicsData.gpsPoints);

      for (const existingTrip of existingTrips) {
        const timeDiff = Math.abs(tripStartTime.getTime() - existingTrip.startTime.getTime());
        const distanceDiff = Math.abs(tripDistance - existingTrip.distance);

        if (
          timeDiff < this.DUPLICATE_TRIP_TIME_THRESHOLD_MS &&
          distanceDiff < this.DUPLICATE_TRIP_DISTANCE_THRESHOLD_KM
        ) {
          anomalies.isDuplicate = true;
          break;
        }
      }
    }

    // Calculate anomaly score (0-100, lower = more anomalies)
    let penalty = 0;
    if (anomalies.hasImpossibleSpeed) penalty += 30;
    if (anomalies.hasGPSJumps) penalty += 25;
    if (anomalies.isDuplicate) penalty += 40;
    
    anomalies.anomalyScore = Math.max(0, 100 - penalty);

    return anomalies;
  }

  /**
   * Convert events to accelerometer data format
   */
  private convertEventsToAccelerometer(events?: TripJSON['events']): AccelerometerReading[] {
    if (!events) return [];
    
    const readings: AccelerometerReading[] = [];
    
    // Convert braking events
    if (events.braking) {
      for (const event of events.braking) {
        readings.push({
          x: -event.intensity, // Negative for braking
          y: 0,
          z: 0,
          timestamp: event.timestamp
        });
      }
    }
    
    // Convert acceleration events
    if (events.acceleration) {
      for (const event of events.acceleration) {
        readings.push({
          x: event.intensity,
          y: 0,
          z: 0,
          timestamp: event.timestamp
        });
      }
    }
    
    return readings.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Convert events to gyroscope data format
   */
  private convertEventsToGyroscope(events?: TripJSON['events']): GyroscopeReading[] {
    if (!events) return [];
    
    const readings: GyroscopeReading[] = [];
    
    // Convert cornering events
    if (events.cornering) {
      for (const event of events.cornering) {
        readings.push({
          x: event.intensity,
          y: event.intensity * 0.5, // Lateral component
          z: 0,
          timestamp: event.timestamp
        });
      }
    }
    
    return readings.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Extract speed data from GPS points
   */
  private extractSpeedFromGPS(gpsPoints: GPSPoint[]): SpeedReading[] {
    const readings: SpeedReading[] = [];
    
    for (let i = 1; i < gpsPoints.length; i++) {
      const point1 = gpsPoints[i - 1];
      const point2 = gpsPoints[i];
      
      // Use GPS speed if available
      if (point2.speed !== undefined) {
        readings.push({
          speed: point2.speed,
          timestamp: point2.timestamp
        });
        continue;
      }
      
      // Calculate speed from distance and time (shared tripProcessor)
      const distanceKm = haversineMeters(
        point1.latitude, point1.longitude,
        point2.latitude, point2.longitude
      ) / 1000;
      const timeDelta = (point2.timestamp - point1.timestamp) / 1000; // seconds
      
      if (timeDelta > 0) {
        const speedKmh = (distanceKm / timeDelta) * 3.6; // m/s to km/h
        readings.push({
          speed: speedKmh,
          timestamp: point2.timestamp
        });
      }
    }
    
    return readings;
  }
}

export const telematicsProcessor = new TelematicsProcessor();
