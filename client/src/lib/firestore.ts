/**
 * FIRESTORE SERVICE LAYER
 * =======================
 * CRUD operations and queries for Driiva's Firestore data model.
 * 
 * Features:
 *   - Type-safe document operations
 *   - Transactional updates for consistency
 *   - Optimized queries for dashboard reads
 *   - Audit trail support
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  QueryConstraint,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  COLLECTION_NAMES,
  UserDocument,
  UserDocumentUpdate,
  TripDocument,
  TripCreateInput,
  TripPointsDocument,
  TripPoint,
  PolicyDocument,
  CommunityPoolDocument,
  PoolShareDocument,
  LeaderboardDocument,
  RecentTripSummary,
  DrivingProfileData,
  ScoreBreakdown,
  TripQueryOptions,
  LeaderboardQueryOptions,
  DEFAULT_DRIVING_PROFILE,
  DEFAULT_POOL_SHARE,
  DEFAULT_USER_SETTINGS,
  TripStatus,
  PoolShareSummary,
} from '../../../shared/firestore-types';

// ============================================================================
// FIRESTORE INSTANCE CHECK
// ============================================================================

function assertFirestore(): void {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured. Check Firebase environment variables.');
  }
}

// ============================================================================
// USERS COLLECTION
// ============================================================================

/**
 * Get a user document by ID
 */
export async function getUser(userId: string): Promise<UserDocument | null> {
  assertFirestore();
  
  const userRef = doc(db!, COLLECTION_NAMES.USERS, userId);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as UserDocument;
}

/**
 * Create a new user document after Firebase Auth signup
 */
export async function createUser(
  userId: string,
  email: string,
  displayName: string,
  photoURL: string | null = null
): Promise<UserDocument> {
  assertFirestore();
  
  const now = Timestamp.now();
  const currentPeriod = getCurrentPoolPeriod();
  
  const userData: UserDocument = {
    uid: userId,
    email,
    displayName,
    photoURL,
    phoneNumber: null,
    createdAt: now,
    updatedAt: now,
    
    drivingProfile: { ...DEFAULT_DRIVING_PROFILE },
    activePolicy: null,
    poolShare: {
      ...DEFAULT_POOL_SHARE,
      lastUpdatedAt: now,
    },
    recentTrips: [],
    fcmTokens: [],
    settings: { ...DEFAULT_USER_SETTINGS },
    
    createdBy: userId,
    updatedBy: userId,
  };
  
  const userRef = doc(db!, COLLECTION_NAMES.USERS, userId);
  await setDoc(userRef, userData);
  
  // Also initialize their pool share for the current period
  await initializePoolShare(userId, currentPeriod);
  
  return userData;
}

/**
 * Update user document fields
 */
export async function updateUser(
  userId: string,
  updates: UserDocumentUpdate
): Promise<void> {
  assertFirestore();
  
  const userRef = doc(db!, COLLECTION_NAMES.USERS, userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Add FCM token for push notifications
 */
export async function addFcmToken(userId: string, token: string): Promise<void> {
  assertFirestore();
  
  const userRef = doc(db!, COLLECTION_NAMES.USERS, userId);
  await updateDoc(userRef, {
    fcmTokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove FCM token
 */
export async function removeFcmToken(userId: string, token: string): Promise<void> {
  assertFirestore();
  
  const userRef = doc(db!, COLLECTION_NAMES.USERS, userId);
  await updateDoc(userRef, {
    fcmTokens: arrayRemove(token),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get user's dashboard data (single read, denormalized)
 */
export async function getUserDashboard(userId: string): Promise<{
  profile: DrivingProfileData;
  policy: UserDocument['activePolicy'];
  poolShare: PoolShareSummary;
  recentTrips: RecentTripSummary[];
} | null> {
  const user = await getUser(userId);
  
  if (!user) {
    return null;
  }
  
  return {
    profile: user.drivingProfile,
    policy: user.activePolicy,
    poolShare: user.poolShare,
    recentTrips: user.recentTrips,
  };
}

// ============================================================================
// TRIPS COLLECTION
// ============================================================================

/**
 * Create a new trip document
 */
export async function createTrip(input: TripCreateInput): Promise<string> {
  assertFirestore();
  
  const tripsRef = collection(db!, COLLECTION_NAMES.TRIPS);
  const tripRef = doc(tripsRef);
  const tripId = tripRef.id;
  
  const tripData: TripDocument = {
    tripId,
    userId: input.userId,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationSeconds: input.durationSeconds,
    startLocation: input.startLocation,
    endLocation: input.endLocation,
    distanceMeters: input.distanceMeters,
    score: input.score,
    scoreBreakdown: input.scoreBreakdown,
    events: input.events,
    anomalies: {
      hasGpsJumps: false,
      hasImpossibleSpeed: false,
      isDuplicate: false,
      flaggedForReview: false,
    },
    status: 'processing',
    processedAt: null,
    context: null,
    createdAt: Timestamp.now(),
    createdBy: input.createdBy,
    pointsCount: input.pointsCount,
  };
  
  await setDoc(tripRef, tripData);
  
  return tripId;
}

/**
 * Get a trip by ID
 */
export async function getTrip(tripId: string): Promise<TripDocument | null> {
  assertFirestore();
  
  const tripRef = doc(db!, COLLECTION_NAMES.TRIPS, tripId);
  const snapshot = await getDoc(tripRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as TripDocument;
}

/**
 * Query trips for a user with pagination
 */
export async function getUserTrips(options: TripQueryOptions): Promise<TripDocument[]> {
  assertFirestore();
  
  const constraints: QueryConstraint[] = [
    where('userId', '==', options.userId),
    orderBy('startedAt', 'desc'),
  ];
  
  if (options.status) {
    constraints.push(where('status', '==', options.status));
  }
  
  if (options.startAfter) {
    constraints.push(startAfter(options.startAfter));
  }
  
  constraints.push(limit(options.limit || 20));
  
  const tripsRef = collection(db!, COLLECTION_NAMES.TRIPS);
  const q = query(tripsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as TripDocument);
}

/**
 * Update trip status
 */
export async function updateTripStatus(
  tripId: string,
  status: TripStatus,
  additionalData?: Partial<TripDocument>
): Promise<void> {
  assertFirestore();
  
  const tripRef = doc(db!, COLLECTION_NAMES.TRIPS, tripId);
  await updateDoc(tripRef, {
    status,
    ...additionalData,
    processedAt: status === 'completed' ? serverTimestamp() : null,
  });
}

// ============================================================================
// TRIP POINTS COLLECTION
// ============================================================================

/**
 * Save trip GPS/sensor points
 */
export async function saveTripPoints(
  tripId: string,
  userId: string,
  points: TripPoint[],
  samplingRateHz: number = 1
): Promise<void> {
  assertFirestore();
  
  const pointsData: TripPointsDocument = {
    tripId,
    userId,
    points,
    samplingRateHz,
    totalPoints: points.length,
    compressedSize: JSON.stringify(points).length,
    createdAt: Timestamp.now(),
  };
  
  // For trips with many points, batch into multiple documents
  if (points.length > 1000) {
    await saveTripPointsBatched(tripId, userId, points, samplingRateHz);
  } else {
    const pointsRef = doc(db!, COLLECTION_NAMES.TRIP_POINTS, tripId);
    await setDoc(pointsRef, pointsData);
  }
}

/**
 * Save trip points in batches for long trips
 */
async function saveTripPointsBatched(
  tripId: string,
  userId: string,
  points: TripPoint[],
  samplingRateHz: number
): Promise<void> {
  assertFirestore();
  
  const batchSize = 1000;
  const batch = writeBatch(db!);
  
  // Create parent document with metadata only
  const pointsRef = doc(db!, COLLECTION_NAMES.TRIP_POINTS, tripId);
  batch.set(pointsRef, {
    tripId,
    userId,
    points: [], // Empty - points stored in subcollection
    samplingRateHz,
    totalPoints: points.length,
    compressedSize: JSON.stringify(points).length,
    createdAt: Timestamp.now(),
  });
  
  // Create batch documents in subcollection
  for (let i = 0; i < points.length; i += batchSize) {
    const batchPoints = points.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    const batchRef = doc(collection(pointsRef, 'batches'), String(batchIndex));
    
    batch.set(batchRef, {
      tripId,
      batchIndex,
      startOffset: batchPoints[0]?.t ?? 0,
      endOffset: batchPoints[batchPoints.length - 1]?.t ?? 0,
      points: batchPoints,
    });
  }
  
  await batch.commit();
}

/**
 * Get trip points
 */
export async function getTripPoints(tripId: string): Promise<TripPoint[]> {
  assertFirestore();
  
  const pointsRef = doc(db!, COLLECTION_NAMES.TRIP_POINTS, tripId);
  const snapshot = await getDoc(pointsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const data = snapshot.data() as TripPointsDocument;
  
  // If points are in the main document
  if (data.points.length > 0) {
    return data.points;
  }
  
  // Otherwise, fetch from batches
  const batchesRef = collection(pointsRef, 'batches');
  const batchesSnapshot = await getDocs(query(batchesRef, orderBy('batchIndex')));
  
  const allPoints: TripPoint[] = [];
  batchesSnapshot.docs.forEach(doc => {
    const batch = doc.data();
    allPoints.push(...batch.points);
  });
  
  return allPoints;
}

// ============================================================================
// POLICIES COLLECTION
// ============================================================================

/**
 * Get user's active policy
 */
export async function getUserPolicy(userId: string): Promise<PolicyDocument | null> {
  assertFirestore();
  
  const policiesRef = collection(db!, COLLECTION_NAMES.POLICIES);
  const q = query(
    policiesRef,
    where('userId', '==', userId),
    where('status', '==', 'active'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as PolicyDocument;
}

/**
 * Get policy by ID
 */
export async function getPolicy(policyId: string): Promise<PolicyDocument | null> {
  assertFirestore();
  
  const policyRef = doc(db!, COLLECTION_NAMES.POLICIES, policyId);
  const snapshot = await getDoc(policyRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as PolicyDocument;
}

/**
 * Create a new policy
 */
export async function createPolicy(
  policyData: Omit<PolicyDocument, 'policyId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  assertFirestore();
  
  const policiesRef = collection(db!, COLLECTION_NAMES.POLICIES);
  const policyRef = doc(policiesRef);
  const policyId = policyRef.id;
  
  const now = Timestamp.now();
  
  await setDoc(policyRef, {
    ...policyData,
    policyId,
    createdAt: now,
    updatedAt: now,
  });
  
  return policyId;
}

// ============================================================================
// COMMUNITY POOL COLLECTION
// ============================================================================

const POOL_DOC_ID = 'current';

/**
 * Get community pool state
 */
export async function getCommunityPool(): Promise<CommunityPoolDocument | null> {
  assertFirestore();
  
  const poolRef = doc(db!, COLLECTION_NAMES.COMMUNITY_POOL, POOL_DOC_ID);
  const snapshot = await getDoc(poolRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as CommunityPoolDocument;
}

/**
 * Initialize community pool (admin only)
 */
export async function initializeCommunityPool(
  periodType: 'monthly' | 'quarterly' = 'monthly'
): Promise<void> {
  assertFirestore();
  
  const now = Timestamp.now();
  const { start, end } = getPoolPeriodDates(periodType);
  
  const poolData: CommunityPoolDocument = {
    poolId: POOL_DOC_ID,
    totalPoolCents: 0,
    totalContributionsCents: 0,
    totalPayoutsCents: 0,
    reserveCents: 0,
    activeParticipants: 0,
    totalParticipantsEver: 0,
    averagePoolScore: 100,
    safetyFactor: 1.0,
    claimsThisPeriod: 0,
    periodStart: start,
    periodEnd: end,
    periodType,
    projectedRefundRate: 0.15, // 15% default
    lastCalculatedAt: now,
    version: 1,
  };
  
  const poolRef = doc(db!, COLLECTION_NAMES.COMMUNITY_POOL, POOL_DOC_ID);
  await setDoc(poolRef, poolData);
}

// ============================================================================
// POOL SHARES COLLECTION
// ============================================================================

/**
 * Get share ID for a user and period
 */
function getShareId(userId: string, period: string): string {
  return `${period}_${userId}`;
}

/**
 * Get current pool period string (e.g., "2026-02")
 */
function getCurrentPoolPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get pool period date range
 */
function getPoolPeriodDates(periodType: 'monthly' | 'quarterly'): {
  start: Timestamp;
  end: Timestamp;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  let startDate: Date;
  let endDate: Date;
  
  if (periodType === 'monthly') {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  } else {
    const quarter = Math.floor(month / 3);
    startDate = new Date(year, quarter * 3, 1);
    endDate = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59, 999);
  }
  
  return {
    start: Timestamp.fromDate(startDate),
    end: Timestamp.fromDate(endDate),
  };
}

/**
 * Initialize pool share for a user
 */
export async function initializePoolShare(
  userId: string,
  period: string = getCurrentPoolPeriod()
): Promise<void> {
  assertFirestore();
  
  const shareId = getShareId(userId, period);
  const shareRef = doc(db!, COLLECTION_NAMES.POOL_SHARES, shareId);
  
  const existingShare = await getDoc(shareRef);
  if (existingShare.exists()) {
    return; // Already initialized
  }
  
  const now = Timestamp.now();
  
  const shareData: PoolShareDocument = {
    shareId,
    poolPeriod: period,
    userId,
    contributionCents: 0,
    contributionCount: 0,
    sharePercentage: 0,
    weightedScore: 0,
    baseRefundCents: 0,
    projectedRefundCents: 0,
    status: 'active',
    eligibleForRefund: true,
    tripsIncluded: 0,
    milesIncluded: 0,
    averageScore: 100,
    createdAt: now,
    updatedAt: now,
    finalizedAt: null,
  };
  
  await setDoc(shareRef, shareData);
}

/**
 * Get user's pool share for current period
 */
export async function getUserPoolShare(
  userId: string,
  period: string = getCurrentPoolPeriod()
): Promise<PoolShareDocument | null> {
  assertFirestore();
  
  const shareId = getShareId(userId, period);
  const shareRef = doc(db!, COLLECTION_NAMES.POOL_SHARES, shareId);
  const snapshot = await getDoc(shareRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as PoolShareDocument;
}

/**
 * Get user's pool share history
 */
export async function getUserPoolShareHistory(
  userId: string,
  limitCount: number = 12
): Promise<PoolShareDocument[]> {
  assertFirestore();
  
  const sharesRef = collection(db!, COLLECTION_NAMES.POOL_SHARES);
  const q = query(
    sharesRef,
    where('userId', '==', userId),
    orderBy('poolPeriod', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as PoolShareDocument);
}

// ============================================================================
// LEADERBOARD COLLECTION
// ============================================================================

/**
 * Get leaderboard for a period type
 */
export async function getLeaderboard(
  options: LeaderboardQueryOptions
): Promise<LeaderboardDocument | null> {
  assertFirestore();
  
  const period = options.period || getCurrentPeriodForType(options.periodType);
  const leaderboardId = `${period}_${options.periodType}`;
  
  const leaderboardRef = doc(db!, COLLECTION_NAMES.LEADERBOARD, leaderboardId);
  const snapshot = await getDoc(leaderboardRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as LeaderboardDocument;
}

/**
 * Get period string for leaderboard type
 */
function getCurrentPeriodForType(periodType: string): string {
  const now = new Date();
  
  switch (periodType) {
    case 'weekly':
      const weekNum = getWeekNumber(now);
      return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    case 'monthly':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    case 'all_time':
      return 'all_time';
    default:
      return getCurrentPoolPeriod();
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ============================================================================
// TRANSACTIONAL OPERATIONS
// ============================================================================

/**
 * Complete a trip and update all related documents atomically
 * This is the main transaction that runs after a trip ends
 */
export async function completeTripTransaction(
  tripId: string,
  tripData: TripDocument
): Promise<void> {
  assertFirestore();
  
  const period = getCurrentPoolPeriod();
  
  await runTransaction(db!, async (transaction) => {
    // References
    const tripRef = doc(db!, COLLECTION_NAMES.TRIPS, tripId);
    const userRef = doc(db!, COLLECTION_NAMES.USERS, tripData.userId);
    const poolShareRef = doc(db!, COLLECTION_NAMES.POOL_SHARES, getShareId(tripData.userId, period));
    const poolRef = doc(db!, COLLECTION_NAMES.COMMUNITY_POOL, POOL_DOC_ID);
    
    // Read current state
    const [userDoc, poolShareDoc, poolDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(poolShareRef),
      transaction.get(poolRef),
    ]);
    
    if (!userDoc.exists()) {
      throw new Error(`User ${tripData.userId} not found`);
    }
    
    const user = userDoc.data() as UserDocument;
    const poolShare = poolShareDoc.exists() ? poolShareDoc.data() as PoolShareDocument : null;
    const pool = poolDoc.exists() ? poolDoc.data() as CommunityPoolDocument : null;
    
    // Calculate new profile values
    const distanceMiles = tripData.distanceMeters / 1609.34;
    const durationMinutes = tripData.durationSeconds / 60;
    
    const newTotalTrips = user.drivingProfile.totalTrips + 1;
    const newTotalMiles = user.drivingProfile.totalMiles + distanceMiles;
    const newTotalMinutes = user.drivingProfile.totalDrivingMinutes + durationMinutes;
    
    // Recalculate weighted average score
    const oldWeight = user.drivingProfile.totalTrips;
    const newScore = oldWeight === 0 
      ? tripData.score 
      : (user.drivingProfile.currentScore * oldWeight + tripData.score) / newTotalTrips;
    
    // Update score breakdown (weighted average)
    const newScoreBreakdown: ScoreBreakdown = {
      speedScore: weightedAverage(user.drivingProfile.scoreBreakdown.speedScore, tripData.scoreBreakdown.speedScore, oldWeight),
      brakingScore: weightedAverage(user.drivingProfile.scoreBreakdown.brakingScore, tripData.scoreBreakdown.brakingScore, oldWeight),
      accelerationScore: weightedAverage(user.drivingProfile.scoreBreakdown.accelerationScore, tripData.scoreBreakdown.accelerationScore, oldWeight),
      corneringScore: weightedAverage(user.drivingProfile.scoreBreakdown.corneringScore, tripData.scoreBreakdown.corneringScore, oldWeight),
      phoneUsageScore: weightedAverage(user.drivingProfile.scoreBreakdown.phoneUsageScore, tripData.scoreBreakdown.phoneUsageScore, oldWeight),
    };
    
    // Determine risk tier
    const riskTier = newScore >= 80 ? 'low' : newScore >= 60 ? 'medium' : 'high';
    
    // Update recent trips (FIFO, max 3)
    const tripSummary: RecentTripSummary = {
      tripId,
      startedAt: tripData.startedAt,
      endedAt: tripData.endedAt,
      distanceMiles,
      durationMinutes,
      score: tripData.score,
      routeSummary: buildRouteSummary(tripData.startLocation, tripData.endLocation),
    };
    
    const newRecentTrips = [tripSummary, ...user.recentTrips].slice(0, 3);
    
    // Write: Update trip status
    transaction.update(tripRef, {
      status: 'completed',
      processedAt: serverTimestamp(),
    });
    
    // Write: Update user profile
    transaction.update(userRef, {
      'drivingProfile.currentScore': Math.round(newScore * 100) / 100,
      'drivingProfile.scoreBreakdown': newScoreBreakdown,
      'drivingProfile.totalTrips': newTotalTrips,
      'drivingProfile.totalMiles': Math.round(newTotalMiles * 100) / 100,
      'drivingProfile.totalDrivingMinutes': Math.round(newTotalMinutes),
      'drivingProfile.lastTripAt': tripData.endedAt,
      'drivingProfile.riskTier': riskTier,
      recentTrips: newRecentTrips,
      updatedAt: serverTimestamp(),
      updatedBy: tripData.userId,
    });
    
    // Write: Update pool share (if exists)
    if (poolShare) {
      const newShareTrips = poolShare.tripsIncluded + 1;
      const newShareMiles = poolShare.milesIncluded + distanceMiles;
      const newShareAvgScore = (poolShare.averageScore * poolShare.tripsIncluded + tripData.score) / newShareTrips;
      
      transaction.update(poolShareRef, {
        tripsIncluded: newShareTrips,
        milesIncluded: Math.round(newShareMiles * 100) / 100,
        averageScore: Math.round(newShareAvgScore * 100) / 100,
        weightedScore: Math.round(newShareAvgScore * poolShare.contributionCents / 100),
        updatedAt: serverTimestamp(),
      });
    }
    
    // Write: Update pool stats (if exists)
    if (pool) {
      const newAvgScore = (pool.averagePoolScore * pool.activeParticipants + tripData.score) / (pool.activeParticipants || 1);
      
      transaction.update(poolRef, {
        averagePoolScore: Math.round(newAvgScore * 100) / 100,
        lastCalculatedAt: serverTimestamp(),
        version: increment(1),
      });
    }
  });
}

/**
 * Add contribution to pool (payment processed)
 */
export async function addPoolContribution(
  userId: string,
  amountCents: number
): Promise<void> {
  assertFirestore();
  
  const period = getCurrentPoolPeriod();
  
  await runTransaction(db!, async (transaction) => {
    const poolRef = doc(db!, COLLECTION_NAMES.COMMUNITY_POOL, POOL_DOC_ID);
    const poolShareRef = doc(db!, COLLECTION_NAMES.POOL_SHARES, getShareId(userId, period));
    const userRef = doc(db!, COLLECTION_NAMES.USERS, userId);
    
    const [poolDoc, poolShareDoc] = await Promise.all([
      transaction.get(poolRef),
      transaction.get(poolShareRef),
    ]);
    
    if (!poolDoc.exists()) {
      throw new Error('Community pool not initialized');
    }
    
    const pool = poolDoc.data() as CommunityPoolDocument;
    const poolShare = poolShareDoc.exists() ? poolShareDoc.data() as PoolShareDocument : null;
    
    // Update pool totals
    const newTotalPool = pool.totalPoolCents + amountCents;
    
    transaction.update(poolRef, {
      totalPoolCents: newTotalPool,
      totalContributionsCents: increment(amountCents),
      lastCalculatedAt: serverTimestamp(),
      version: increment(1),
    });
    
    // Update or create pool share
    if (poolShare) {
      const newContribution = poolShare.contributionCents + amountCents;
      const newSharePercentage = (newContribution / newTotalPool) * 100;
      
      transaction.update(poolShareRef, {
        contributionCents: newContribution,
        contributionCount: increment(1),
        sharePercentage: Math.round(newSharePercentage * 10000) / 10000,
        updatedAt: serverTimestamp(),
      });
      
      // Update user's denormalized pool share
      transaction.update(userRef, {
        'poolShare.contributionCents': newContribution,
        'poolShare.sharePercentage': Math.round(newSharePercentage * 100) / 100,
        'poolShare.lastUpdatedAt': serverTimestamp(),
      });
    } else {
      // Create new pool share
      const shareId = getShareId(userId, period);
      const newSharePercentage = (amountCents / newTotalPool) * 100;
      const now = Timestamp.now();
      
      transaction.set(poolShareRef, {
        shareId,
        poolPeriod: period,
        userId,
        contributionCents: amountCents,
        contributionCount: 1,
        sharePercentage: Math.round(newSharePercentage * 10000) / 10000,
        weightedScore: 0,
        baseRefundCents: 0,
        projectedRefundCents: 0,
        status: 'active',
        eligibleForRefund: true,
        tripsIncluded: 0,
        milesIncluded: 0,
        averageScore: 100,
        createdAt: now,
        updatedAt: now,
        finalizedAt: null,
      });
      
      // Update pool participant count
      transaction.update(poolRef, {
        activeParticipants: increment(1),
        totalParticipantsEver: increment(1),
      });
      
      // Update user's denormalized pool share
      transaction.update(userRef, {
        'poolShare.contributionCents': amountCents,
        'poolShare.sharePercentage': Math.round(newSharePercentage * 100) / 100,
        'poolShare.lastUpdatedAt': serverTimestamp(),
      });
    }
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate weighted average for score components
 */
function weightedAverage(oldValue: number, newValue: number, oldWeight: number): number {
  if (oldWeight === 0) return newValue;
  const result = (oldValue * oldWeight + newValue) / (oldWeight + 1);
  return Math.round(result * 100) / 100;
}

/**
 * Build route summary string
 */
function buildRouteSummary(
  start: { placeType: string | null; address: string | null },
  end: { placeType: string | null; address: string | null }
): string {
  const startLabel = start.placeType 
    ? start.placeType.charAt(0).toUpperCase() + start.placeType.slice(1)
    : truncateAddress(start.address);
  
  const endLabel = end.placeType
    ? end.placeType.charAt(0).toUpperCase() + end.placeType.slice(1)
    : truncateAddress(end.address);
  
  return `${startLabel} → ${endLabel}`;
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string | null): string {
  if (!address) return 'Unknown';
  
  // Extract first part (street name or city)
  const parts = address.split(',');
  const firstPart = parts[0].trim();
  
  return firstPart.length > 20 ? firstPart.substring(0, 17) + '...' : firstPart;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getCurrentPoolPeriod,
  getShareId,
};
