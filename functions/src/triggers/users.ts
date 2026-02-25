/**
 * USER TRIGGERS
 * =============
 * Cloud Functions triggered by user document changes.
 * 
 * onUserCreate: Auto-create a default policy for new users.
 * This ensures every registered user has an active policy from day one.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  COLLECTION_NAMES,
  PolicyDocument,
  PolicyStatus,
  CoverageType,
} from '../types';
import { EUROPE_LONDON } from '../lib/region';

const db = admin.firestore();

/**
 * Triggered when a new user document is created in Firestore.
 * 
 * Actions:
 *   1. Checks if the user already has an active policy (idempotency)
 *   2. Creates a default 'pending' policy with standard coverage
 *   3. Links the policy reference back to the user document
 * 
 * Notes:
 *   - Policy status starts as 'pending' (not 'active') until payment/quote is confirmed
 *   - Premium defaults to 0 cents until a quote is generated
 *   - Uses integer cents for all financial fields (never floats)
 */
export const onUserCreate = functions
  .region(EUROPE_LONDON)
  .firestore
  .document(`${COLLECTION_NAMES.USERS}/{userId}`)
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const userData = snap.data();

    functions.logger.info(`New user created: ${userId}`, {
      email: userData?.email,
      displayName: userData?.displayName || userData?.fullName,
    });

    try {
      // 1. Check if a policy already exists for this user (idempotency guard)
      const existingPolicies = await db
        .collection(COLLECTION_NAMES.POLICIES)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!existingPolicies.empty) {
        functions.logger.info(`User ${userId} already has a policy, skipping creation`);
        return;
      }

      // 2. Generate policy number
      const policyNumber = await generatePolicyNumber();

      // 3. Create timestamps
      const now = admin.firestore.Timestamp.now();
      const oneYearFromNow = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      );

      // 4. Create the policy document
      const policyId = `policy_${userId}`;
      const policyData: PolicyDocument = {
        policyId,
        userId,
        policyNumber,
        status: 'pending' as PolicyStatus,
        coverageType: 'standard' as CoverageType,
        coverageDetails: {
          liabilityLimitCents: 100000_00, // £100,000
          collisionDeductibleCents: 500_00, // £500
          comprehensiveDeductibleCents: 250_00, // £250
          includesRoadside: true,
          includesRental: false,
        },
        basePremiumCents: 0, // Will be updated when quote is generated
        currentPremiumCents: 0, // Will be updated when quote is generated
        discountPercentage: 0,
        effectiveDate: now,
        expirationDate: oneYearFromNow,
        renewalDate: oneYearFromNow,
        vehicle: null, // Will be populated during onboarding or profile setup
        billingCycle: 'annual',
        stripeSubscriptionId: null,
        createdAt: now,
        updatedAt: now,
        createdBy: 'cloud-function',
        updatedBy: 'cloud-function',
      };

      await db
        .collection(COLLECTION_NAMES.POLICIES)
        .doc(policyId)
        .set(policyData);

      functions.logger.info(`Created default policy ${policyId} for user ${userId}`, {
        policyNumber,
        status: 'pending',
      });

      // 5. Initialize driving profile defaults on the user document
      // This ensures the dashboard has valid data from the start
      await snap.ref.update({
        drivingProfile: {
          currentScore: 100, // Start at 100 (perfect) - will decrease with bad driving
          scoreBreakdown: {
            speedScore: 100,
            brakingScore: 100,
            accelerationScore: 100,
            corneringScore: 100,
            phoneUsageScore: 100,
          },
          totalTrips: 0,
          totalMiles: 0,
          totalDrivingMinutes: 0,
          lastTripAt: null,
          streakDays: 0,
          riskTier: 'low',
        },
        activePolicy: {
          policyId,
          policyNumber,
          status: 'pending' as PolicyStatus,
          premiumCents: 0,
          coverageType: 'standard' as CoverageType,
          renewalDate: oneYearFromNow,
        },
        poolShare: {
          currentShareCents: 0,
          contributionCents: 0,
          sharePercentage: 0,
          lastUpdatedAt: now,
        },
        recentTrips: [],
        displayName: userData?.fullName || userData?.displayName || userData?.email?.split('@')[0] || 'Driver',
        photoURL: null,
        phoneNumber: null,
        fcmTokens: [],
        settings: {
          notificationsEnabled: true,
          autoTripDetection: false,
          unitSystem: 'imperial',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'cloud-function',
      });

      functions.logger.info(`Initialized driving profile for user ${userId}`);

    } catch (error) {
      functions.logger.error(`Error creating policy for user ${userId}:`, error);
      // Don't throw - user creation should not fail because of policy creation
      // The policy can be created manually or on retry
    }
  });

/**
 * Generate a unique policy number in format DRV-001, DRV-002, etc.
 * Uses a Firestore transaction on a counter document for sequential generation.
 */
async function generatePolicyNumber(): Promise<string> {
  const counterRef = db.collection(COLLECTION_NAMES.COUNTERS).doc('policy');

  return await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextValue = 1;

    if (counterDoc.exists) {
      nextValue = (counterDoc.data()?.currentValue || 0) + 1;
    }

    transaction.set(counterRef, { currentValue: nextValue }, { merge: true });

    const paddedNumber = String(nextValue).padStart(3, '0');
    return `DRV-${paddedNumber}`;
  });
}
