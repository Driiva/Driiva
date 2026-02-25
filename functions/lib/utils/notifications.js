"use strict";
/**
 * PUSH NOTIFICATION HELPERS
 * =========================
 * Sends FCM push notifications to user devices.
 *
 * All notification sends are non-blocking — callers should fire-and-forget.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = sendPushToUser;
exports.notifyTripComplete = notifyTripComplete;
exports.notifyAchievementsUnlocked = notifyAchievementsUnlocked;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const types_1 = require("../types");
const db = admin.firestore();
/**
 * Send a push notification to all of a user's registered FCM tokens.
 * Automatically removes invalid/expired tokens.
 */
async function sendPushToUser(userId, payload) {
    const userDoc = await db.collection(types_1.COLLECTION_NAMES.USERS).doc(userId).get();
    if (!userDoc.exists)
        return 0;
    const user = userDoc.data();
    const tokens = user.fcmTokens ?? [];
    if (tokens.length === 0)
        return 0;
    const message = {
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
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
        if (resp.error) {
            const code = resp.error.code;
            if (code === 'messaging/invalid-registration-token' ||
                code === 'messaging/registration-token-not-registered') {
                invalidTokens.push(tokens[idx]);
            }
        }
    });
    if (invalidTokens.length > 0) {
        const userRef = db.collection(types_1.COLLECTION_NAMES.USERS).doc(userId);
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
async function notifyTripComplete(userId, tripId, score) {
    await sendPushToUser(userId, {
        title: 'Trip Complete',
        body: `You scored ${score}/100! Tap to see your trip details.`,
        data: { url: `/trips/${tripId}`, tripId, type: 'trip_complete' },
    });
}
/**
 * Send a notification when new achievements are unlocked.
 */
async function notifyAchievementsUnlocked(userId, achievementNames) {
    if (achievementNames.length === 0)
        return;
    const body = achievementNames.length === 1
        ? `You unlocked "${achievementNames[0]}"!`
        : `You unlocked ${achievementNames.length} achievements!`;
    await sendPushToUser(userId, {
        title: 'Achievement Unlocked',
        body,
        data: { url: '/achievements', type: 'achievement_unlocked' },
    });
}
//# sourceMappingURL=notifications.js.map