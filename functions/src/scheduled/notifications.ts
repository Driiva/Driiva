/**
 * SCHEDULED NOTIFICATION FUNCTIONS
 * ================================
 * Sends periodic push notifications (weekly driving summary).
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLECTION_NAMES, UserDocument } from '../types';
import { sendPushToUser } from '../utils/notifications';
import { EUROPE_LONDON } from '../lib/region';

const db = admin.firestore();

/**
 * Send weekly driving summary push notification every Monday at 9 AM UK.
 */
export const sendWeeklySummary = functions
  .region(EUROPE_LONDON)
  .pubsub
  .schedule('every monday 09:00')
  .timeZone('Europe/London')
  .onRun(async (_context) => {
    functions.logger.info('Starting weekly summary notifications');

    const usersSnap = await db.collection(COLLECTION_NAMES.USERS)
      .where('settings.notificationsEnabled', '==', true)
      .where('drivingProfile.totalTrips', '>', 0)
      .get();

    if (usersSnap.empty) {
      functions.logger.info('No eligible users for weekly summary');
      return;
    }

    let sent = 0;
    let skipped = 0;

    for (const doc of usersSnap.docs) {
      const user = doc.data() as UserDocument;

      if (!user.fcmTokens || user.fcmTokens.length === 0) {
        skipped++;
        continue;
      }

      const score = user.drivingProfile.currentScore;
      const trips = user.drivingProfile.totalTrips;
      const streak = user.drivingProfile.streakDays;

      let body = `Your driving score is ${score}/100 across ${trips} trips.`;
      if (streak > 0) {
        body += ` ${streak}-day streak!`;
      }

      try {
        await sendPushToUser(user.uid, {
          title: 'Weekly Driving Summary',
          body,
          data: { url: '/dashboard', type: 'weekly_summary' },
        });
        sent++;
      } catch (err) {
        functions.logger.warn(`Failed to send weekly summary to ${user.uid}:`, err);
      }
    }

    functions.logger.info(`Weekly summary: sent ${sent}, skipped ${skipped} (no tokens)`);
  });
