import { TripDocument, TripPoint, DrivingProfileData } from '../types';
/**
 * Non-blocking check: flag any unreviewed data types in trip points.
 * Writes an alert to admin/dpiaAlerts if new fields are detected.
 */
export declare function checkDpiaCompliance(tripId: string, points: unknown[]): Promise<void>;
/**
 * Async wrapper for trip classification
 *
 * Calls the Stop-Go-Classifier Python function without blocking trip processing.
 * Classification is an enhancement, not critical to trip completion.
 */
export declare function classifyCompletedTripAsync(tripId: string, trip: TripDocument): void;
/**
 * Check whether AI insights feature flag is enabled.
 *
 * Set via environment variable FEATURE_AI_INSIGHTS (default: "true").
 * Disable by setting it to "false" in Cloud Functions config / .env.
 */
export declare function isAIInsightsEnabled(): boolean;
/**
 * Async wrapper for AI trip analysis
 *
 * Calls Claude Sonnet 4 to generate advanced driving insights.
 * Non-blocking: the driver sees the algorithmic score immediately,
 * and AI insights are layered on asynchronously (typically < 5 s).
 *
 * Gated by the FEATURE_AI_INSIGHTS environment variable.
 */
export declare function analyzeCompletedTripAsync(tripId: string, trip: TripDocument, points: TripPoint[], profile: DrivingProfileData): void;
/**
 * Async wrapper for achievement checking + push notifications.
 * Non-blocking: these are enhancements, not critical to trip completion.
 */
export declare function checkAchievementsAsync(userId: string, trip: TripDocument, tripId: string): void;
//# sourceMappingURL=tripSideEffects.d.ts.map