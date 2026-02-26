/**
 * ACHIEVEMENTS ENGINE
 * ===================
 * Checks and unlocks achievements based on driving profile and trip data.
 * Called after each trip completion in a non-blocking fire-and-forget manner.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { DrivingProfileData, TripDocument, COLLECTION_NAMES } from '../types';

const db = admin.firestore();

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'safety' | 'community' | 'refund' | 'milestone';
  maxProgress: number | null;
  check: (profile: DrivingProfileData, trip: TripDocument) => boolean;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-trip',
    name: 'First Journey',
    description: 'Complete your first tracked trip',
    icon: 'Car',
    category: 'milestone',
    maxProgress: null,
    check: (profile) => profile.totalTrips >= 1,
  },
  {
    id: 'smooth-operator',
    name: 'Smooth Operator',
    description: '10 trips without hard braking',
    icon: 'Shield',
    category: 'safety',
    maxProgress: 10,
    check: (profile) => profile.totalTrips >= 10,
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Complete 100 safe trips',
    icon: 'Target',
    category: 'milestone',
    maxProgress: 100,
    check: (profile) => profile.totalTrips >= 100,
  },
  {
    id: 'high-scorer',
    name: 'High Scorer',
    description: 'Achieve a driving score of 90+',
    icon: 'Star',
    category: 'safety',
    maxProgress: null,
    check: (profile) => profile.currentScore >= 90,
  },
  {
    id: 'road-warrior',
    name: 'Road Warrior',
    description: 'Drive 500+ miles safely',
    icon: 'Route',
    category: 'milestone',
    maxProgress: 500,
    check: (profile) => profile.totalMiles >= 500,
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 7-day driving streak',
    icon: 'Flame',
    category: 'safety',
    maxProgress: 7,
    check: (profile) => profile.streakDays >= 7,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a safe night trip (after 9pm)',
    icon: 'Moon',
    category: 'safety',
    maxProgress: null,
    check: (_profile, trip) => {
      const startHour = trip.startedAt?.toDate?.()?.getHours?.() ?? 12;
      return startHour >= 21 && trip.score >= 70;
    },
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Score 100 on a single trip',
    icon: 'Award',
    category: 'safety',
    maxProgress: null,
    check: (_profile, trip) => trip.score >= 100,
  },
];

/**
 * Check and unlock eligible achievements for a user after a trip.
 * Returns an array of achievement IDs that were newly unlocked.
 */
export async function checkAndUnlockAchievements(
  userId: string,
  profile: DrivingProfileData,
  trip: TripDocument,
  tripId: string,
): Promise<string[]> {
  const userAchRef = db.collection(COLLECTION_NAMES.USERS).doc(userId).collection('achievements');
  const existingSnap = await userAchRef.get();
  const alreadyUnlocked = new Set(existingSnap.docs.map(d => d.id));

  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (alreadyUnlocked.has(def.id)) continue;

    try {
      if (def.check(profile, trip)) {
        await userAchRef.doc(def.id).set({
          achievementId: def.id,
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
          tripId,
        });
        newlyUnlocked.push(def.id);
      }
    } catch (err) {
      functions.logger.warn(`[Achievements] Error checking ${def.id}:`, err);
    }
  }

  return newlyUnlocked;
}
