/**
 * DRIIVA CLOUD FUNCTIONS
 * ======================
 * Firebase Cloud Functions for Driiva telematics app.
 * 
 * Triggers:
 *   - onTripCreate: Process and enrich new trips
 *   - onTripComplete: Update driver profile and pool share
 *   - onPolicyChange: Sync policy to user document
 *   - onPoolShareUpdate: Sync pool share to user document
 * 
 * Scheduled:
 *   - updateLeaderboards: Every 15 minutes
 *   - finalizePoolPeriod: 1st of each month
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
// HTTP FUNCTIONS (Optional - for admin/testing)
// ============================================================================

export { initializePool } from './http/admin';
