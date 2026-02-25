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
import { DrivingProfileData, TripDocument } from '../types';
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
export declare const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[];
/**
 * Ensure all achievement definitions exist in Firestore.
 * Idempotent — only writes if the doc is missing or has a different version.
 */
export declare function seedAchievementDefinitions(): Promise<void>;
/**
 * After a trip completes, check all achievement criteria against the user's
 * updated profile and the just-completed trip. Unlock any newly earned
 * achievements by writing to users/{userId}/achievements/{achId}.
 */
export declare function checkAndUnlockAchievements(userId: string, profile: DrivingProfileData, trip: TripDocument, tripId: string): Promise<string[]>;
//# sourceMappingURL=achievements.d.ts.map