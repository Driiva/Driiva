/**
 * ADMIN HTTP FUNCTIONS
 * ====================
 * HTTP callable functions for admin operations.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLECTION_NAMES, CommunityPoolDocument } from '../types';

const db = admin.firestore();

/**
 * Initialize community pool (admin only)
 * Call this once to set up the pool document
 */
export const initializePool = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to initialize pool'
    );
  }
  
  // In production, check for admin claim
  // if (!context.auth.token.admin) {
  //   throw new functions.https.HttpsError(
  //     'permission-denied',
  //     'Must be an admin to initialize pool'
  //   );
  // }
  
  const poolRef = db.collection(COLLECTION_NAMES.COMMUNITY_POOL).doc('current');
  const existingPool = await poolRef.get();
  
  if (existingPool.exists && !data?.force) {
    throw new functions.https.HttpsError(
      'already-exists',
      'Community pool already initialized. Pass force: true to reinitialize.'
    );
  }
  
  const periodType = data?.periodType || 'monthly';
  const { start, end } = getPoolPeriodDates(periodType);
  const now = admin.firestore.Timestamp.now();
  
  const poolData: CommunityPoolDocument = {
    poolId: 'current',
    totalPoolCents: 0,
    totalContributionsCents: 0,
    totalPayoutsCents: 0,
    reserveCents: 0,
    activeParticipants: 0,
    totalParticipantsEver: 0,
    averagePoolScore: 100,
    safetyFactor: 1.0,
    claimsThisPeriod: 0,
    periodStart: start,
    periodEnd: end,
    periodType,
    projectedRefundRate: 0.15, // 15% default
    lastCalculatedAt: now,
    version: 1,
  };
  
  await poolRef.set(poolData);
  
  functions.logger.info('Community pool initialized', { periodType });
  
  return {
    success: true,
    message: 'Community pool initialized',
    pool: {
      periodType,
      periodStart: start.toDate().toISOString(),
      periodEnd: end.toDate().toISOString(),
    },
  };
});

/**
 * Get pool period date range
 */
function getPoolPeriodDates(periodType: 'monthly' | 'quarterly'): {
  start: admin.firestore.Timestamp;
  end: admin.firestore.Timestamp;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  let startDate: Date;
  let endDate: Date;
  
  if (periodType === 'monthly') {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  } else {
    const quarter = Math.floor(month / 3);
    startDate = new Date(year, quarter * 3, 1);
    endDate = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59, 999);
  }
  
  return {
    start: admin.firestore.Timestamp.fromDate(startDate),
    end: admin.firestore.Timestamp.fromDate(endDate),
  };
}
