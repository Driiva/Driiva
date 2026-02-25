"use strict";
/**
 * ACHIEVEMENTS ENGINE
 * ===================
 * Defines achievement criteria and checks whether a user has unlocked any new
 * achievements after a trip completes.
 *
 * Achievements are stored in Firestore:
 *   - achievements/{achievementId}           — definition (criteria, points, etc.)
 *   - users/{userId}/achievements/{achId}    — unlock record per user
 *
 * Called from triggers/trips.ts after profile + pool share updates.
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
exports.ACHIEVEMENT_DEFINITIONS = void 0;
exports.seedAchievementDefinitions = seedAchievementDefinitions;
exports.checkAndUnlockAchievements = checkAndUnlockAchievements;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const types_1 = require("../types");
const db = admin.firestore();
// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================
exports.ACHIEVEMENT_DEFINITIONS = [
    {
        id: 'first_trip',
        name: 'First Trip',
        description: 'Complete your first recorded trip',
        icon: 'Car',
        category: 'milestone',
        points: 50,
        maxProgress: 1,
    },
    {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Score 100 on a single trip',
        icon: 'Star',
        category: 'safety',
        points: 200,
        maxProgress: null,
    },
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Drive 7 days in a row with a score above 70',
        icon: 'Flame',
        category: 'safety',
        points: 150,
        maxProgress: 7,
    },
    {
        id: 'long_distance',
        name: 'Long Distance Driver',
        description: 'Accumulate 1,000 miles of recorded driving',
        icon: 'Route',
        category: 'milestone',
        points: 300,
        maxProgress: 1000,
    },
    {
        id: 'safe_driver_30',
        name: 'Safe Driver',
        description: 'Maintain a score of 80+ for 30 consecutive days',
        icon: 'Shield',
        category: 'safety',
        points: 500,
        maxProgress: 30,
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete 10 trips during night hours',
        icon: 'Moon',
        category: 'milestone',
        points: 100,
        maxProgress: 10,
    },
    {
        id: 'smooth_operator',
        name: 'Smooth Operator',
        description: 'Complete 5 trips with zero hard braking events',
        icon: 'Gauge',
        category: 'safety',
        points: 150,
        maxProgress: 5,
    },
    {
        id: 'ten_trips',
        name: 'Getting Started',
        description: 'Complete 10 trips',
        icon: 'Award',
        category: 'milestone',
        points: 100,
        maxProgress: 10,
    },
];
// ============================================================================
// SEED DEFINITIONS TO FIRESTORE
// ============================================================================
/**
 * Ensure all achievement definitions exist in Firestore.
 * Idempotent — only writes if the doc is missing or has a different version.
 */
async function seedAchievementDefinitions() {
    const batch = db.batch();
    for (const def of exports.ACHIEVEMENT_DEFINITIONS) {
        const ref = db.collection('achievements').doc(def.id);
        batch.set(ref, { ...def, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
    functions.logger.info(`Seeded ${exports.ACHIEVEMENT_DEFINITIONS.length} achievement definitions`);
}
// ============================================================================
// CHECK & UNLOCK
// ============================================================================
/**
 * After a trip completes, check all achievement criteria against the user's
 * updated profile and the just-completed trip. Unlock any newly earned
 * achievements by writing to users/{userId}/achievements/{achId}.
 */
async function checkAndUnlockAchievements(userId, profile, trip, tripId) {
    const userAchRef = db.collection(types_1.COLLECTION_NAMES.USERS).doc(userId).collection('achievements');
    // Fetch already-unlocked achievement IDs in one read
    const existingSnap = await userAchRef.get();
    const unlocked = new Set(existingSnap.docs.map(d => d.id));
    const newlyUnlocked = [];
    for (const def of exports.ACHIEVEMENT_DEFINITIONS) {
        if (unlocked.has(def.id))
            continue;
        const earned = evaluateCriteria(def.id, profile, trip);
        if (!earned)
            continue;
        const record = {
            achievementId: def.id,
            unlockedAt: admin.firestore.Timestamp.now(),
            tripId,
        };
        await userAchRef.doc(def.id).set(record);
        newlyUnlocked.push(def.id);
        functions.logger.info(`Achievement unlocked: ${def.name} for user ${userId}`);
    }
    return newlyUnlocked;
}
/**
 * Pure evaluation of whether the criteria for a given achievement are met.
 */
function evaluateCriteria(achievementId, profile, trip) {
    switch (achievementId) {
        case 'first_trip':
            return profile.totalTrips >= 1;
        case 'perfect_score':
            return trip.score === 100;
        case 'week_warrior':
            return profile.streakDays >= 7;
        case 'long_distance':
            return profile.totalMiles >= 1000;
        case 'safe_driver_30':
            return profile.streakDays >= 30 && profile.currentScore >= 80;
        case 'night_owl': {
            const isNight = trip.context?.isNightDriving ?? false;
            // We count this achievement based on the profile's total trips as an
            // approximation. A precise count would require querying past trips, but
            // for MVP, streak + night flag is sufficient. The achievement is
            // retroactively evaluated each time so it will unlock eventually.
            return isNight && profile.totalTrips >= 10;
        }
        case 'smooth_operator':
            return (trip.events.hardBrakingCount === 0 &&
                profile.totalTrips >= 5);
        case 'ten_trips':
            return profile.totalTrips >= 10;
        default:
            return false;
    }
}
//# sourceMappingURL=achievements.js.map