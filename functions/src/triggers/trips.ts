/**
 * TRIP TRIGGERS
 * =============
 * Cloud Functions triggered by trip document changes.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  COLLECTION_NAMES,
  TripDocument,
  UserDocument,
  PoolShareDocument,
  RecentTripSummary,
  ScoreBreakdown,
} from '../types';
import {
  detectAnomalies,
  isNightTime,
  isRushHour,
  buildRouteSummary,
  weightedAverage,
  calculateRiskTier,
  getCurrentPoolPeriod,
  getShareId,
} from '../utils/helpers';

const db = admin.firestore();

/**
 * Triggered when a new trip is created
 * - Detects anomalies
 * - Enriches with context (night driving, rush hour)
 * - Updates trip status
 */
export const onTripCreate = functions.firestore
  .document(`${COLLECTION_NAMES.TRIPS}/{tripId}`)
  .onCreate(async (snap, context) => {
    const tripId = context.params.tripId;
    const trip = snap.data() as TripDocument;
    
    functions.logger.info(`Processing new trip: ${tripId}`, { userId: trip.userId });
    
    try {
      // 1. Detect anomalies
      const anomalies = detectAnomalies({
        distanceMeters: trip.distanceMeters,
        durationSeconds: trip.durationSeconds,
        startLocation: trip.startLocation,
        endLocation: trip.endLocation,
      });
      
      // 2. Calculate context
      const tripContext = {
        weatherCondition: null, // TODO: Integrate weather API
        isNightDriving: isNightTime(trip.startedAt) || isNightTime(trip.endedAt),
        isRushHour: isRushHour(trip.startedAt),
      };
      
      // 3. Determine status
      const newStatus = anomalies.flaggedForReview ? 'processing' : 'completed';
      
      // 4. Update trip document
      await snap.ref.update({
        anomalies,
        context: tripContext,
        status: newStatus,
        processedAt: newStatus === 'completed' ? admin.firestore.FieldValue.serverTimestamp() : null,
      });
      
      functions.logger.info(`Trip ${tripId} processed`, { 
        status: newStatus, 
        flagged: anomalies.flaggedForReview 
      });
      
      // 5. If trip is completed (no anomalies), trigger profile update
      if (newStatus === 'completed') {
        await updateDriverProfileAndPoolShare(trip, tripId);
      }
      
    } catch (error) {
      functions.logger.error(`Error processing trip ${tripId}:`, error);
      
      // Mark trip as failed
      await snap.ref.update({
        status: 'failed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      throw error;
    }
  });

/**
 * Triggered when trip status changes
 * Handles manual review completion
 */
export const onTripStatusChange = functions.firestore
  .document(`${COLLECTION_NAMES.TRIPS}/{tripId}`)
  .onUpdate(async (change, context) => {
    const tripId = context.params.tripId;
    const before = change.before.data() as TripDocument;
    const after = change.after.data() as TripDocument;
    
    // Only process status transitions to 'completed'
    if (before.status === after.status || after.status !== 'completed') {
      return;
    }
    
    // If transitioning from 'processing' to 'completed' (manual review)
    if (before.status === 'processing') {
      functions.logger.info(`Trip ${tripId} manually approved, updating profile`);
      await updateDriverProfileAndPoolShare(after, tripId);
    }
  });

/**
 * Update driver profile and pool share after trip completion
 * This is the main business logic for trip processing
 */
async function updateDriverProfileAndPoolShare(
  trip: TripDocument,
  tripId: string
): Promise<void> {
  const period = getCurrentPoolPeriod();
  
  await db.runTransaction(async (transaction) => {
    // References
    const userRef = db.collection(COLLECTION_NAMES.USERS).doc(trip.userId);
    const poolShareRef = db.collection(COLLECTION_NAMES.POOL_SHARES).doc(getShareId(trip.userId, period));
    
    // Read current state
    const [userDoc, poolShareDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(poolShareRef),
    ]);
    
    if (!userDoc.exists) {
      functions.logger.error(`User ${trip.userId} not found for trip ${tripId}`);
      throw new Error(`User ${trip.userId} not found`);
    }
    
    const user = userDoc.data() as UserDocument;
    const poolShare = poolShareDoc.exists ? poolShareDoc.data() as PoolShareDocument : null;
    
    // Calculate new profile values
    const distanceMiles = trip.distanceMeters / 1609.34;
    const durationMinutes = trip.durationSeconds / 60;
    
    const newTotalTrips = user.drivingProfile.totalTrips + 1;
    const newTotalMiles = user.drivingProfile.totalMiles + distanceMiles;
    const newTotalMinutes = user.drivingProfile.totalDrivingMinutes + durationMinutes;
    
    // Recalculate weighted average score
    const oldWeight = user.drivingProfile.totalTrips;
    const newScore = oldWeight === 0 
      ? trip.score 
      : (user.drivingProfile.currentScore * oldWeight + trip.score) / newTotalTrips;
    
    // Update score breakdown (weighted average)
    const newScoreBreakdown: ScoreBreakdown = {
      speedScore: weightedAverage(
        user.drivingProfile.scoreBreakdown.speedScore, 
        trip.scoreBreakdown.speedScore, 
        oldWeight
      ),
      brakingScore: weightedAverage(
        user.drivingProfile.scoreBreakdown.brakingScore, 
        trip.scoreBreakdown.brakingScore, 
        oldWeight
      ),
      accelerationScore: weightedAverage(
        user.drivingProfile.scoreBreakdown.accelerationScore, 
        trip.scoreBreakdown.accelerationScore, 
        oldWeight
      ),
      corneringScore: weightedAverage(
        user.drivingProfile.scoreBreakdown.corneringScore, 
        trip.scoreBreakdown.corneringScore, 
        oldWeight
      ),
      phoneUsageScore: weightedAverage(
        user.drivingProfile.scoreBreakdown.phoneUsageScore, 
        trip.scoreBreakdown.phoneUsageScore, 
        oldWeight
      ),
    };
    
    // Determine risk tier
    const riskTier = calculateRiskTier(newScore);
    
    // Update recent trips (FIFO, max 3)
    const tripSummary: RecentTripSummary = {
      tripId,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
      distanceMiles: Math.round(distanceMiles * 100) / 100,
      durationMinutes: Math.round(durationMinutes),
      score: trip.score,
      routeSummary: buildRouteSummary(trip.startLocation, trip.endLocation),
    };
    
    const newRecentTrips = [tripSummary, ...user.recentTrips].slice(0, 3);
    
    // Calculate streak days
    let streakDays = user.drivingProfile.streakDays;
    if (user.drivingProfile.lastTripAt) {
      const lastTripDate = user.drivingProfile.lastTripAt.toDate();
      const currentTripDate = trip.endedAt.toDate();
      const daysDiff = Math.floor(
        (currentTripDate.getTime() - lastTripDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff <= 1 && trip.score >= 70) {
        streakDays += 1;
      } else if (daysDiff > 1) {
        streakDays = trip.score >= 70 ? 1 : 0;
      }
    } else {
      streakDays = trip.score >= 70 ? 1 : 0;
    }
    
    // Write: Update user profile
    transaction.update(userRef, {
      'drivingProfile.currentScore': Math.round(newScore * 100) / 100,
      'drivingProfile.scoreBreakdown': newScoreBreakdown,
      'drivingProfile.totalTrips': newTotalTrips,
      'drivingProfile.totalMiles': Math.round(newTotalMiles * 100) / 100,
      'drivingProfile.totalDrivingMinutes': Math.round(newTotalMinutes),
      'drivingProfile.lastTripAt': trip.endedAt,
      'drivingProfile.riskTier': riskTier,
      'drivingProfile.streakDays': streakDays,
      recentTrips: newRecentTrips,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'cloud-function',
    });
    
    // Write: Update pool share (if exists)
    if (poolShare) {
      const newShareTrips = poolShare.tripsIncluded + 1;
      const newShareMiles = poolShare.milesIncluded + distanceMiles;
      const newShareAvgScore = (poolShare.averageScore * poolShare.tripsIncluded + trip.score) / newShareTrips;
      
      transaction.update(poolShareRef, {
        tripsIncluded: newShareTrips,
        milesIncluded: Math.round(newShareMiles * 100) / 100,
        averageScore: Math.round(newShareAvgScore * 100) / 100,
        weightedScore: Math.round(newShareAvgScore * poolShare.contributionCents / 100),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    functions.logger.info(`Updated profile for user ${trip.userId}`, {
      newScore: Math.round(newScore * 100) / 100,
      totalTrips: newTotalTrips,
      totalMiles: Math.round(newTotalMiles * 100) / 100,
      riskTier,
      streakDays,
    });
  });
}
