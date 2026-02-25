/**
 * ACHIEVEMENTS HTTP ENDPOINTS
 * ===========================
 * Admin-callable function to seed achievement definitions to Firestore.
 */

import * as functions from 'firebase-functions';
import { seedAchievementDefinitions } from '../utils/achievements';
import { EUROPE_LONDON } from '../lib/region';

/**
 * Seed all achievement definitions to the achievements collection.
 * Idempotent — safe to call multiple times.
 */
export const seedAchievements = functions
  .region(EUROPE_LONDON)
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    await seedAchievementDefinitions();
    return { success: true, message: 'Achievement definitions seeded' };
  });
