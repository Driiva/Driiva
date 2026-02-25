/**
 * PUSH NOTIFICATION HELPERS
 * =========================
 * Sends FCM push notifications to user devices.
 *
 * All notification sends are non-blocking — callers should fire-and-forget.
 */
interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}
/**
 * Send a push notification to all of a user's registered FCM tokens.
 * Automatically removes invalid/expired tokens.
 */
export declare function sendPushToUser(userId: string, payload: NotificationPayload): Promise<number>;
/**
 * Send a trip-complete notification.
 */
export declare function notifyTripComplete(userId: string, tripId: string, score: number): Promise<void>;
/**
 * Send a notification when new achievements are unlocked.
 */
export declare function notifyAchievementsUnlocked(userId: string, achievementNames: string[]): Promise<void>;
export {};
//# sourceMappingURL=notifications.d.ts.map