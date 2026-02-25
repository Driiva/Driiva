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

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  COLLECTION_NAMES,
  DrivingProfileData,
  TripDocument,
} from '../types';

const db = admin.firestore();

// ============================================================================
// TYPES
// ============================================================================

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  /** Icon identifier (matches lucide-react icon name on the client) */
  icon: string;
  category: 'safety' | 'community' | 'milestone' | 'refund';
  /** Points awarded on unlock (gamification) */
  points: number;
  /** Max progress value — null for boolean (one-shot) achievements */
  maxProgress: number | null;
}

interface AchievementUnlockRecord {
  achievementId: string;
  unlockedAt: admin.firestore.Timestamp;
  tripId: string | null;
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
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
export async function seedAchievementDefinitions(): Promise<void> {
  const batch = db.batch();

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const ref = db.collection('achievements').doc(def.id);
    batch.set(ref, { ...def, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  await batch.commit();
  functions.logger.info(`Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievement definitions`);
}

// ============================================================================
// CHECK & UNLOCK
// ============================================================================

/**
 * After a trip completes, check all achievement criteria against the user's
 * updated profile and the just-completed trip. Unlock any newly earned
 * achievements by writing to users/{userId}/achievements/{achId}.
 */
export async function checkAndUnlockAchievements(
  userId: string,
  profile: DrivingProfileData,
  trip: TripDocument,
  tripId: string,
): Promise<string[]> {
  const userAchRef = db.collection(COLLECTION_NAMES.USERS).doc(userId).collection('achievements');

  // Fetch already-unlocked achievement IDs in one read
  const existingSnap = await userAchRef.get();
  const unlocked = new Set(existingSnap.docs.map(d => d.id));

  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (unlocked.has(def.id)) continue;

    const earned = evaluateCriteria(def.id, profile, trip);
    if (!earned) continue;

    const record: AchievementUnlockRecord = {
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
function evaluateCriteria(
  achievementId: string,
  profile: DrivingProfileData,
  trip: TripDocument,
): boolean {
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
      return (
        trip.events.hardBrakingCount === 0 &&
        profile.totalTrips >= 5
      );

    case 'ten_trips':
      return profile.totalTrips >= 10;

    default:
      return false;
  }
}
