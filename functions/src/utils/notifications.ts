/**
 * PUSH NOTIFICATIONS
 * ==================
 * Firebase Cloud Messaging helpers for sending push notifications to users.
 * Each function fetches the user's FCM tokens from their Firestore document.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { COLLECTION_NAMES, UserDocument } from '../types';

const db = admin.firestore();

async function getUserTokens(userId: string): Promise<string[]> {
  const userSnap = await db.collection(COLLECTION_NAMES.USERS).doc(userId).get();
  if (!userSnap.exists) return [];
  const user = userSnap.data() as UserDocument;
  return (user.fcmTokens ?? []).filter(Boolean);
}

async function sendToTokens(
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> {
  if (tokens.length === 0) return;

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification,
    data,
    webpush: {
      fcmOptions: { link: '/dashboard' },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    if (response.failureCount > 0) {
      functions.logger.warn(
        `[Push] ${response.failureCount}/${tokens.length} deliveries failed`,
      );
    }
  } catch (err) {
    functions.logger.warn('[Push] sendEachForMulticast error:', err);
  }
}

/**
 * Notify a user that their trip has been scored.
 */
export async function notifyTripComplete(
  userId: string,
  tripId: string,
  score: number,
): Promise<void> {
  const tokens = await getUserTokens(userId);
  await sendToTokens(
    tokens,
    {
      title: 'Trip Scored',
      body: `Your trip scored ${Math.round(score)}/100. ${score >= 80 ? 'Great driving!' : 'Keep improving!'}`,
    },
    { type: 'trip_complete', tripId },
  );
}

/**
 * Notify a user about newly unlocked achievements.
 */
export async function notifyAchievementsUnlocked(
  userId: string,
  achievementNames: string[],
): Promise<void> {
  if (achievementNames.length === 0) return;
  const tokens = await getUserTokens(userId);
  const nameList = achievementNames.join(', ');
  await sendToTokens(
    tokens,
    {
      title: 'Achievement Unlocked!',
      body: `You earned: ${nameList}`,
    },
    { type: 'achievement_unlocked' },
  );
}

/**
 * Send a weekly driving summary to a user (called by scheduled function).
 */
export async function sendWeeklySummaryToUser(
  userId: string,
  score: number,
  trips: number,
  miles: number,
): Promise<void> {
  const tokens = await getUserTokens(userId);
  await sendToTokens(
    tokens,
    {
      title: 'Your Weekly Summary',
      body: `This week: ${trips} trips, ${miles} miles, avg score ${score}. Keep it up!`,
    },
    { type: 'weekly_summary' },
  );
}
