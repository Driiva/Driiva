/**
 * DRIIVA CLOUD FUNCTIONS
 * ======================
 * Firebase Cloud Functions for Driiva telematics app.
 * 
 * Triggers:
 *   - onTripCreate: Initial trip validation and enrichment
 *   - onTripStatusChange: 
 *       • recording → processing: Finalize trip (compute metrics from GPS points)
 *       • processing → completed: Manual approval (update driver profile)
 *   - onPolicyWrite: Sync policy to user document
 *   - onPoolShareWrite: Sync pool share to user document
 * 
 * Scheduled:
 *   - updateLeaderboards: Every 15 minutes
 *   - finalizePoolPeriod: 1st of each month
 * 
 * HTTP Callable:
 *   - initializePool: Admin-only pool setup
 *   - addPoolContribution: Add premium contribution to pool
 *   - cancelTrip: Cancel an in-progress trip
 *   - classifyTrip: Classify trip stops/segments (Stop-Go-Classifier)
 *   - batchClassifyTrips: Admin batch classification
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Firestore instance for other modules
export const db = admin.firestore();

// ============================================================================
// FIRESTORE TRIGGERS
// ============================================================================

export { onTripCreate, onTripStatusChange } from './triggers/trips';
export { onPolicyWrite } from './triggers/policies';
export { onPoolShareWrite } from './triggers/pool';

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

export { updateLeaderboards } from './scheduled/leaderboard';
export { finalizePoolPeriod, recalculatePoolShares } from './scheduled/pool';

// ============================================================================
// HTTP CALLABLE FUNCTIONS
// ============================================================================

// Admin functions
export { initializePool } from './http/admin';

// User-callable functions (require admin SDK for protected collection writes)
export { addPoolContribution, cancelTrip } from './http/admin';

// Trip classification (Stop-Go-Classifier integration)
export { classifyTrip, batchClassifyTrips } from './http/classifier';

// GDPR: data export and account deletion
export { exportUserData, deleteUserAccount } from './http/gdpr';
