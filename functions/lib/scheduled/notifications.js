"use strict";
/**
 * SCHEDULED NOTIFICATION FUNCTIONS
 * ================================
 * Sends periodic push notifications (weekly driving summary).
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
exports.sendWeeklySummary = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
const notifications_1 = require("../utils/notifications");
const region_1 = require("../lib/region");
const db = admin.firestore();
/**
 * Send weekly driving summary push notification every Monday at 9 AM UK.
 */
exports.sendWeeklySummary = functions
    .region(region_1.EUROPE_LONDON)
    .pubsub
    .schedule('every monday 09:00')
    .timeZone('Europe/London')
    .onRun(async (_context) => {
    functions.logger.info('Starting weekly summary notifications');
    const usersSnap = await db.collection(types_1.COLLECTION_NAMES.USERS)
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
        const user = doc.data();
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
            await (0, notifications_1.sendPushToUser)(user.uid, {
                title: 'Weekly Driving Summary',
                body,
                data: { url: '/dashboard', type: 'weekly_summary' },
            });
            sent++;
        }
        catch (err) {
            functions.logger.warn(`Failed to send weekly summary to ${user.uid}:`, err);
        }
    }
    functions.logger.info(`Weekly summary: sent ${sent}, skipped ${skipped} (no tokens)`);
});
//# sourceMappingURL=notifications.js.map