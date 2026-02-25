/**
 * PUSH NOTIFICATION HELPERS
 * =========================
 * Sends FCM push notifications to user devices.
 *
 * All notification sends are non-blocking — callers should fire-and-forget.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { COLLECTION_NAMES, UserDocument } from '../types';

const db = admin.firestore();

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification to all of a user's registered FCM tokens.
 * Automatically removes invalid/expired tokens.
 */
export async function sendPushToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<number> {
  const userDoc = await db.collection(COLLECTION_NAMES.USERS).doc(userId).get();
  if (!userDoc.exists) return 0;

  const user = userDoc.data() as UserDocument;
  const tokens = user.fcmTokens ?? [];

  if (tokens.length === 0) return 0;

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data ?? {},
    webpush: {
      fcmOptions: {
        link: payload.data?.url ?? '/dashboard',
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  // Remove invalid tokens
  const invalidTokens: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (resp.error) {
      const code = resp.error.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[idx]);
      }
    }
  });

  if (invalidTokens.length > 0) {
    const userRef = db.collection(COLLECTION_NAMES.USERS).doc(userId);
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
    });
    functions.logger.info(`Removed ${invalidTokens.length} invalid FCM tokens for user ${userId}`);
  }

  functions.logger.info(`Sent push to ${userId}: ${response.successCount} success, ${response.failureCount} failed`);
  return response.successCount;
}

/**
 * Send a trip-complete notification.
 */
export async function notifyTripComplete(
  userId: string,
  tripId: string,
  score: number,
): Promise<void> {
  await sendPushToUser(userId, {
    title: 'Trip Complete',
    body: `You scored ${score}/100! Tap to see your trip details.`,
    data: { url: `/trips/${tripId}`, tripId, type: 'trip_complete' },
  });
}

/**
 * Send a notification when new achievements are unlocked.
 */
export async function notifyAchievementsUnlocked(
  userId: string,
  achievementNames: string[],
): Promise<void> {
  if (achievementNames.length === 0) return;

  const body = achievementNames.length === 1
    ? `You unlocked "${achievementNames[0]}"!`
    : `You unlocked ${achievementNames.length} achievements!`;

  await sendPushToUser(userId, {
    title: 'Achievement Unlocked',
    body,
    data: { url: '/achievements', type: 'achievement_unlocked' },
  });
}
