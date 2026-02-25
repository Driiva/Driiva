/**
 * ACHIEVEMENTS HTTP ENDPOINTS
 * ===========================
 * Admin-callable function to seed achievement definitions to Firestore.
 */
import * as functions from 'firebase-functions';
/**
 * Seed all achievement definitions to the achievements collection.
 * Idempotent — safe to call multiple times.
 */
export declare const seedAchievements: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=achievements.d.ts.map