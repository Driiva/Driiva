/**
 * The tripPoints subcollection.
 * Extracted verbatim from functions/src/types.ts, which re-exports this module
 * so every existing import keeps working.
 */
import type { Timestamp } from './firestoreScalars';
import type { ScoreBreakdown, TripEvents } from './documents';
/**
 * Single GPS/sensor data point (compressed format)
 */
export interface TripPoint {
    t: number;
    lat: number;
    lng: number;
    spd: number;
    hdg: number;
    acc: number;
    ax?: number;
    ay?: number;
    az?: number;
    gx?: number;
    gy?: number;
    gz?: number;
}
/**
 * Trip points document
 * Collection: tripPoints/{tripId}
 */
export interface TripPointsDocument {
    tripId: string;
    userId: string;
    points: TripPoint[];
    samplingRateHz: number;
    totalPoints: number;
    compressedSize: number;
    createdAt: Timestamp;
}
/**
 * Computed trip metrics from GPS points
 */
export interface ComputedTripMetrics {
    distanceMeters: number;
    durationSeconds: number;
    avgSpeedMps: number;
    maxSpeedMps: number;
    score: number;
    scoreBreakdown: ScoreBreakdown;
    events: TripEvents;
}
//# sourceMappingURL=tripPoints.d.ts.map