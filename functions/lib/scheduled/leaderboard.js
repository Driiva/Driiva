"use strict";
/**
 * LEADERBOARD SCHEDULED FUNCTIONS
 * ===============================
 * Scheduled functions to update leaderboard rankings.
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
exports.updateLeaderboards = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
const helpers_1 = require("../utils/helpers");
const db = admin.firestore();
// Maximum rankings to store
const MAX_RANKINGS = 100;
/**
 * Update all leaderboards every 15 minutes
 */
exports.updateLeaderboards = functions.pubsub
    .schedule('every 15 minutes')
    .onRun(async (_context) => {
    functions.logger.info('Starting leaderboard update');
    try {
        await Promise.all([
            calculateLeaderboard('weekly'),
            calculateLeaderboard('monthly'),
            calculateLeaderboard('all_time'),
        ]);
        functions.logger.info('All leaderboards updated successfully');
    }
    catch (error) {
        functions.logger.error('Error updating leaderboards:', error);
        throw error;
    }
});
/**
 * Calculate and store leaderboard for a specific period type
 */
async function calculateLeaderboard(periodType) {
    const period = (0, helpers_1.getCurrentPeriodForType)(periodType);
    const leaderboardId = `${period}_${periodType}`;
    functions.logger.info(`Calculating ${periodType} leaderboard`, { leaderboardId });
    // Fetch all users with driving profiles, sorted by score
    // For production, you'd want to paginate this or use a different approach
    const usersRef = db.collection(types_1.COLLECTION_NAMES.USERS);
    let query = usersRef
        .where('drivingProfile.totalTrips', '>', 0)
        .orderBy('drivingProfile.totalTrips', 'desc') // Need this for the where clause
        .orderBy('drivingProfile.currentScore', 'desc')
        .limit(MAX_RANKINGS * 2); // Fetch extra to account for filtering
    // For weekly/monthly, filter by recent activity
    // Note: This is a simplified approach; production might need a separate collection
    const snapshot = await query.get();
    if (snapshot.empty) {
        functions.logger.info(`No users found for ${periodType} leaderboard`);
        return;
    }
    // Get previous leaderboard for position changes
    const prevLeaderboard = await getPreviousLeaderboard(periodType);
    const prevRankings = new Map();
    if (prevLeaderboard) {
        prevLeaderboard.rankings.forEach(r => prevRankings.set(r.userId, r.rank));
    }
    // Build rankings
    const rankings = [];
    const scores = [];
    let rank = 0;
    for (const doc of snapshot.docs) {
        const user = doc.data();
        // Skip users with no score or inactive
        if (!user.drivingProfile.currentScore || user.drivingProfile.totalTrips === 0) {
            continue;
        }
        // For weekly/monthly, could filter by lastTripAt date range
        // Simplified: include all users with trips
        rank++;
        if (rank > MAX_RANKINGS)
            break;
        const prevRank = prevRankings.get(user.uid);
        const change = prevRank ? prevRank - rank : 0; // Positive = moved up
        rankings.push({
            rank,
            userId: user.uid,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL,
            score: user.drivingProfile.currentScore,
            totalMiles: user.drivingProfile.totalMiles,
            totalTrips: user.drivingProfile.totalTrips,
            change,
        });
        scores.push(user.drivingProfile.currentScore);
    }
    // Calculate stats
    const totalParticipants = rankings.length;
    const averageScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100
        : 0;
    const medianScore = scores.length > 0
        ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
        : 0;
    // Calculate next update time
    const now = admin.firestore.Timestamp.now();
    const nextUpdate = admin.firestore.Timestamp.fromMillis(now.toMillis() + 15 * 60 * 1000 // 15 minutes
    );
    // Build leaderboard document
    const leaderboardData = {
        leaderboardId,
        period,
        periodType,
        rankings,
        totalParticipants,
        averageScore,
        medianScore,
        calculatedAt: now,
        nextCalculationAt: nextUpdate,
    };
    // Save to Firestore
    await db.collection(types_1.COLLECTION_NAMES.LEADERBOARD)
        .doc(leaderboardId)
        .set(leaderboardData);
    functions.logger.info(`Updated ${periodType} leaderboard`, {
        leaderboardId,
        participants: totalParticipants,
        averageScore,
    });
}
/**
 * Get previous leaderboard for comparison
 */
async function getPreviousLeaderboard(periodType) {
    const prevPeriod = getPreviousPeriod(periodType);
    const prevLeaderboardId = `${prevPeriod}_${periodType}`;
    const doc = await db.collection(types_1.COLLECTION_NAMES.LEADERBOARD)
        .doc(prevLeaderboardId)
        .get();
    if (!doc.exists) {
        return null;
    }
    return doc.data();
}
/**
 * Get previous period string
 */
function getPreviousPeriod(periodType) {
    const now = new Date();
    switch (periodType) {
        case 'weekly':
            const prevWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const weekNum = (0, helpers_1.getWeekNumber)(prevWeekDate);
            return `${prevWeekDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        case 'monthly':
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        case 'all_time':
            return 'all_time'; // Same document, compare to self
        default:
            return (0, helpers_1.getCurrentPeriodForType)(periodType);
    }
}
//# sourceMappingURL=leaderboard.js.map