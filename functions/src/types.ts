/**
 * SHARED TYPES FOR CLOUD FUNCTIONS
 * ================================
 * Mirrors the shared/firestore-types.ts from the main app.
 * Keep in sync with the client types.
 */

import * as admin from 'firebase-admin';

export type Timestamp = admin.firestore.Timestamp;
export type FieldValue = admin.firestore.FieldValue;

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const COLLECTION_NAMES = {
  USERS: 'users',
  TRIPS: 'trips',
  TRIP_POINTS: 'tripPoints',
  POLICIES: 'policies',
  COMMUNITY_POOL: 'communityPool',
  POOL_SHARES: 'poolShares',
  LEADERBOARD: 'leaderboard',
} as const;

export type RiskTier = 'low' | 'medium' | 'high';
export type PolicyStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended';
export type CoverageType = 'basic' | 'standard' | 'premium';
export type TripStatus = 'recording' | 'processing' | 'completed' | 'failed' | 'disputed';
export type PoolShareStatus = 'active' | 'finalized' | 'paid_out';
export type LeaderboardPeriodType = 'weekly' | 'monthly' | 'all_time';

// ============================================================================
// DOCUMENT INTERFACES
// ============================================================================

export interface ScoreBreakdown {
  speedScore: number;
  brakingScore: number;
  accelerationScore: number;
  corneringScore: number;
  phoneUsageScore: number;
}

export interface DrivingProfileData {
  currentScore: number;
  scoreBreakdown: ScoreBreakdown;
  totalTrips: number;
  totalMiles: number;
  totalDrivingMinutes: number;
  lastTripAt: Timestamp | null;
  streakDays: number;
  riskTier: RiskTier;
}

export interface TripLocation {
  lat: number;
  lng: number;
  address: string | null;
  placeType: 'home' | 'work' | 'other' | null;
}

export interface TripEvents {
  hardBrakingCount: number;
  hardAccelerationCount: number;
  speedingSeconds: number;
  sharpTurnCount: number;
  phonePickupCount: number;
}

export interface TripAnomalyFlags {
  hasGpsJumps: boolean;
  hasImpossibleSpeed: boolean;
  isDuplicate: boolean;
  flaggedForReview: boolean;
}

export interface TripContext {
  weatherCondition: string | null;
  isNightDriving: boolean;
  isRushHour: boolean;
}

export interface TripDocument {
  tripId: string;
  userId: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSeconds: number;
  startLocation: TripLocation;
  endLocation: TripLocation;
  distanceMeters: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  events: TripEvents;
  anomalies: TripAnomalyFlags;
  status: TripStatus;
  processedAt: Timestamp | null;
  context: TripContext | null;
  createdAt: Timestamp;
  createdBy: string;
  pointsCount: number;
}

export interface RecentTripSummary {
  tripId: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  distanceMiles: number;
  durationMinutes: number;
  score: number;
  routeSummary: string;
}

export interface PoolShareSummary {
  currentShareCents: number;
  contributionCents: number;
  sharePercentage: number;
  lastUpdatedAt: Timestamp;
}

export interface ActivePolicySummary {
  policyId: string;
  status: PolicyStatus;
  premiumCents: number;
  coverageType: CoverageType;
  renewalDate: Timestamp;
}

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  drivingProfile: DrivingProfileData;
  activePolicy: ActivePolicySummary | null;
  poolShare: PoolShareSummary;
  recentTrips: RecentTripSummary[];
  fcmTokens: string[];
  settings: {
    notificationsEnabled: boolean;
    autoTripDetection: boolean;
    unitSystem: 'imperial' | 'metric';
  };
  createdBy: string;
  updatedBy: string;
}

export interface PolicyDocument {
  policyId: string;
  userId: string;
  policyNumber: string;
  status: PolicyStatus;
  coverageType: CoverageType;
  coverageDetails: {
    liabilityLimitCents: number;
    collisionDeductibleCents: number;
    comprehensiveDeductibleCents: number;
    includesRoadside: boolean;
    includesRental: boolean;
  };
  basePremiumCents: number;
  currentPremiumCents: number;
  discountPercentage: number;
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  renewalDate: Timestamp | null;
  vehicle: {
    vin: string | null;
    make: string;
    model: string;
    year: number;
    color: string | null;
  } | null;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  stripeSubscriptionId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface PoolShareDocument {
  shareId: string;
  poolPeriod: string;
  userId: string;
  contributionCents: number;
  contributionCount: number;
  sharePercentage: number;
  weightedScore: number;
  baseRefundCents: number;
  projectedRefundCents: number;
  status: PoolShareStatus;
  eligibleForRefund: boolean;
  tripsIncluded: number;
  milesIncluded: number;
  averageScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  finalizedAt: Timestamp | null;
}

export interface CommunityPoolDocument {
  poolId: string;
  totalPoolCents: number;
  totalContributionsCents: number;
  totalPayoutsCents: number;
  reserveCents: number;
  activeParticipants: number;
  totalParticipantsEver: number;
  averagePoolScore: number;
  safetyFactor: number;
  claimsThisPeriod: number;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  periodType: 'monthly' | 'quarterly';
  projectedRefundRate: number;
  lastCalculatedAt: Timestamp;
  version: number;
}

export interface LeaderboardRanking {
  rank: number;
  userId: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  totalMiles: number;
  totalTrips: number;
  change: number;
}

export interface LeaderboardDocument {
  leaderboardId: string;
  period: string;
  periodType: LeaderboardPeriodType;
  rankings: LeaderboardRanking[];
  totalParticipants: number;
  averageScore: number;
  medianScore: number;
  calculatedAt: Timestamp;
  nextCalculationAt: Timestamp;
}
