/**
 * LEADERBOARD SCHEDULED FUNCTIONS
 * ===============================
 * Scheduled functions to update leaderboard rankings.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  COLLECTION_NAMES,
  UserDocument,
  LeaderboardDocument,
  LeaderboardRanking,
  LeaderboardPeriodType,
} from '../types';
import { getCurrentPeriodForType, getWeekNumber } from '../utils/helpers';
import { EUROPE_LONDON } from '../lib/region';

const db = admin.firestore();

// Maximum rankings to store
const MAX_RANKINGS = 100;

/**
 * Update all leaderboards every 15 minutes
 */
export const updateLeaderboards = functions
  .region(EUROPE_LONDON)
  .pubsub
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
    } catch (error) {
      functions.logger.error('Error updating leaderboards:', error);
      throw error;
    }
  });

/**
 * Calculate and store leaderboard for a specific period type
 */
async function calculateLeaderboard(periodType: LeaderboardPeriodType): Promise<void> {
  const period = getCurrentPeriodForType(periodType);
  const leaderboardId = `${period}_${periodType}`;
  
  functions.logger.info(`Calculating ${periodType} leaderboard`, { leaderboardId });
  
  // Fetch all users with driving profiles, sorted by score
  // For production, you'd want to paginate this or use a different approach
  const usersRef = db.collection(COLLECTION_NAMES.USERS);
  
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
  const prevRankings = new Map<string, number>();
  if (prevLeaderboard) {
    prevLeaderboard.rankings.forEach(r => prevRankings.set(r.userId, r.rank));
  }
  
  // Build rankings
  const rankings: LeaderboardRanking[] = [];
  const scores: number[] = [];
  let rank = 0;
  
  for (const doc of snapshot.docs) {
    const user = doc.data() as UserDocument;
    
    // Skip users with no score or inactive
    if (!user.drivingProfile.currentScore || user.drivingProfile.totalTrips === 0) {
      continue;
    }
    
    // For weekly/monthly, could filter by lastTripAt date range
    // Simplified: include all users with trips
    
    rank++;
    if (rank > MAX_RANKINGS) break;
    
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
  const nextUpdate = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + 15 * 60 * 1000 // 15 minutes
  );
  
  // Build leaderboard document
  const leaderboardData: LeaderboardDocument = {
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
  await db.collection(COLLECTION_NAMES.LEADERBOARD)
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
async function getPreviousLeaderboard(
  periodType: LeaderboardPeriodType
): Promise<LeaderboardDocument | null> {
  const prevPeriod = getPreviousPeriod(periodType);
  const prevLeaderboardId = `${prevPeriod}_${periodType}`;
  
  const doc = await db.collection(COLLECTION_NAMES.LEADERBOARD)
    .doc(prevLeaderboardId)
    .get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as LeaderboardDocument;
}

/**
 * Get previous period string
 */
function getPreviousPeriod(periodType: LeaderboardPeriodType): string {
  const now = new Date();
  
  switch (periodType) {
    case 'weekly':
      const prevWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekNum = getWeekNumber(prevWeekDate);
      return `${prevWeekDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    
    case 'monthly':
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    
    case 'all_time':
      return 'all_time'; // Same document, compare to self
    
    default:
      return getCurrentPeriodForType(periodType);
  }
}
