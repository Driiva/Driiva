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
  TripPointsDocument,
  TripPoint,
  UserDocument,
  PoolShareDocument,
  RecentTripSummary,
  ScoreBreakdown,
  DrivingProfileData,
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
  computeTripMetrics,
} from '../utils/helpers';
import { classifyCompletedTrip } from '../http/classifier';
import { analyzeTrip } from '../ai/tripAnalysis';

const db = admin.firestore();

/**
 * Async wrapper for trip classification
 * 
 * Calls the Stop-Go-Classifier Python function without blocking trip processing.
 * Classification is an enhancement, not critical to trip completion.
 */
function classifyCompletedTripAsync(tripId: string, trip: TripDocument): void {
  // Fire and forget - don't await
  classifyCompletedTrip(tripId, trip)
    .catch(error => {
      functions.logger.warn(`Non-blocking classification error for trip ${tripId}:`, error);
    });
}

/**
 * Async wrapper for AI trip analysis
 * 
 * Calls Claude Sonnet 4 to generate advanced driving insights.
 * Non-blocking: the driver sees the algorithmic score immediately,
 * and AI insights are layered on asynchronously (typically < 5 s).
 */
function analyzeCompletedTripAsync(
  tripId: string,
  trip: TripDocument,
  points: TripPoint[],
  profile: DrivingProfileData,
): void {
  analyzeTrip(tripId, trip, points, profile)
    .then(result => {
      if (result) {
        functions.logger.info(`[AI] Trip ${tripId} analysis completed`);
      }
    })
    .catch(error => {
      functions.logger.warn(`Non-blocking AI analysis error for trip ${tripId}:`, error);
    });
}

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
 * Handles:
 * 1. Trip finalization (recording → processing): Compute metrics from GPS points
 * 2. Manual review completion (processing → completed): Update driver profile
 */
export const onTripStatusChange = functions.firestore
  .document(`${COLLECTION_NAMES.TRIPS}/{tripId}`)
  .onUpdate(async (change, context) => {
    const tripId = context.params.tripId;
    const before = change.before.data() as TripDocument;
    const after = change.after.data() as TripDocument;
    
    // Skip if status hasn't changed
    if (before.status === after.status) {
      return;
    }
    
    functions.logger.info(`Trip ${tripId} status change: ${before.status} → ${after.status}`);
    
    // -------------------------------------------------------------------------
    // CASE 1: Trip ended (recording → processing)
    // Finalize trip by computing metrics from GPS points
    // -------------------------------------------------------------------------
    if (before.status === 'recording' && after.status === 'processing') {
      functions.logger.info(`Trip ${tripId} ended, computing metrics from GPS points`);
      await finalizeTripFromPoints(tripId, after);
      return;
    }
    
    // -------------------------------------------------------------------------
    // CASE 2: Manual review completion (processing → completed)
    // Update driver profile and pool share
    // -------------------------------------------------------------------------
    if (before.status === 'processing' && after.status === 'completed') {
      functions.logger.info(`Trip ${tripId} manually approved, updating profile`);
      
      // Set processedAt timestamp if not already set
      if (!after.processedAt) {
        const tripRef = admin.firestore().collection(COLLECTION_NAMES.TRIPS).doc(tripId);
        await tripRef.update({
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Set processedAt timestamp for trip ${tripId}`);
      }
      
      await updateDriverProfileAndPoolShare(after, tripId);
      
      // Trigger intelligent trip segmentation (async, non-blocking)
      classifyCompletedTripAsync(tripId, after);
      
      // Trigger AI analysis (async, non-blocking)
      try {
        const userDoc = await db.collection(COLLECTION_NAMES.USERS).doc(after.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data() as UserDocument;
          // Read GPS points for AI analysis
          const pointsRef = db.collection(COLLECTION_NAMES.TRIP_POINTS).doc(tripId);
          const pointsSnap = await pointsRef.get();
          const pointsData = pointsSnap.exists ? (pointsSnap.data()?.points || []) as TripPoint[] : [];
          analyzeCompletedTripAsync(tripId, after, pointsData, userData.drivingProfile);
        }
      } catch (aiSetupErr) {
        functions.logger.warn(`[AI] Failed to setup AI analysis for trip ${tripId}:`, aiSetupErr);
      }
    }
  });

/**
 * Finalize trip by reading GPS points and computing metrics
 * 
 * Steps:
 * 1. Read all points from tripPoints/{tripId}
 * 2. Compute duration, distance (Haversine), average speed
 * 3. Compute driving score from events
 * 4. Update trip document with computed metrics
 * 5. Detect anomalies and set final status
 * 6. Update driver stats transactionally
 */
async function finalizeTripFromPoints(
  tripId: string,
  tripData: TripDocument
): Promise<void> {
  try {
    // 1. Read all GPS points
    const points = await readTripPoints(tripId);
    
    if (points.length < 2) {
      functions.logger.warn(`Trip ${tripId} has insufficient points (${points.length}), marking as failed`);
      await db.collection(COLLECTION_NAMES.TRIPS).doc(tripId).update({
        status: 'failed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }
    
    functions.logger.info(`Processing ${points.length} GPS points for trip ${tripId}`);
    
    // 2. Compute metrics from points
    const startTimestampMs = tripData.startedAt.toMillis();
    const metrics = computeTripMetrics(points, startTimestampMs);
    
    functions.logger.info(`Computed metrics for trip ${tripId}:`, {
      distanceMeters: metrics.distanceMeters,
      durationSeconds: metrics.durationSeconds,
      avgSpeedMph: Math.round(metrics.avgSpeedMps * 2.237 * 100) / 100,
      score: metrics.score,
    });
    
    // 3. Detect anomalies
    const anomalies = detectAnomalies({
      distanceMeters: metrics.distanceMeters,
      durationSeconds: metrics.durationSeconds,
      startLocation: tripData.startLocation,
      endLocation: tripData.endLocation,
    });
    
    // 4. Calculate context
    const tripContext = {
      weatherCondition: null,
      isNightDriving: isNightTime(tripData.startedAt) || isNightTime(tripData.endedAt),
      isRushHour: isRushHour(tripData.startedAt),
    };
    
    // 5. Determine final status
    const finalStatus = anomalies.flaggedForReview ? 'processing' : 'completed';
    
    // 6. Update trip document with computed metrics
    const tripRef = db.collection(COLLECTION_NAMES.TRIPS).doc(tripId);
    await tripRef.update({
      // Computed metrics
      distanceMeters: metrics.distanceMeters,
      durationSeconds: metrics.durationSeconds,
      score: metrics.score,
      scoreBreakdown: metrics.scoreBreakdown,
      events: metrics.events,
      
      // Enrichment
      anomalies,
      context: tripContext,
      
      // Status
      status: finalStatus,
      processedAt: finalStatus === 'completed' ? admin.firestore.FieldValue.serverTimestamp() : null,
    });
    
    functions.logger.info(`Trip ${tripId} finalized with status: ${finalStatus}`, {
      flaggedForReview: anomalies.flaggedForReview,
    });
    
    // 7. If completed (no anomalies), update driver profile
    if (finalStatus === 'completed') {
      // Re-fetch the updated trip data
      const updatedTrip = (await tripRef.get()).data() as TripDocument;
      await updateDriverProfileAndPoolShare(updatedTrip, tripId);
      
      // 8. Trigger intelligent trip segmentation (async, non-blocking)
      // This calls the Python Stop-Go-Classifier to detect stops and trip segments
      classifyCompletedTripAsync(tripId, updatedTrip);
      
      // 9. Trigger AI analysis with Claude (async, non-blocking)
      // Fetches the user's latest profile for historical comparison
      try {
        const userDoc = await db.collection(COLLECTION_NAMES.USERS).doc(updatedTrip.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data() as UserDocument;
          analyzeCompletedTripAsync(tripId, updatedTrip, points, userData.drivingProfile);
        }
      } catch (aiSetupErr) {
        functions.logger.warn(`[AI] Failed to fetch user profile for AI analysis of trip ${tripId}:`, aiSetupErr);
      }
    }
    
  } catch (error) {
    functions.logger.error(`Error finalizing trip ${tripId}:`, error);
    
    // Mark trip as failed
    await db.collection(COLLECTION_NAMES.TRIPS).doc(tripId).update({
      status: 'failed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    throw error;
  }
}

/**
 * Read all GPS points for a trip
 * Handles both single-document and batched storage
 */
async function readTripPoints(tripId: string): Promise<TripPoint[]> {
  const pointsRef = db.collection(COLLECTION_NAMES.TRIP_POINTS).doc(tripId);
  const snapshot = await pointsRef.get();
  
  if (!snapshot.exists) {
    functions.logger.warn(`No trip points document found for trip ${tripId}`);
    return [];
  }
  
  const data = snapshot.data() as TripPointsDocument;
  
  // If points are in the main document
  if (data.points && data.points.length > 0) {
    return data.points;
  }
  
  // Otherwise, fetch from batches subcollection
  const batchesSnapshot = await pointsRef
    .collection('batches')
    .orderBy('batchIndex')
    .get();
  
  const allPoints: TripPoint[] = [];
  batchesSnapshot.docs.forEach(doc => {
    const batch = doc.data();
    if (batch.points && Array.isArray(batch.points)) {
      allPoints.push(...batch.points);
    }
  });
  
  return allPoints;
}

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
