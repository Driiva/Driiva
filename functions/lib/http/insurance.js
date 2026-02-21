"use strict";
/**
 * ROOT PLATFORM INSURANCE INTEGRATION
 * ====================================
 * Cloud Functions for interacting with the Root Platform insurance API.
 *
 * Root Platform (rootplatform.com) provides programmable insurance
 * infrastructure. This module handles:
 *   1. Generating insurance quotes based on driving scores
 *   2. Accepting quotes to create policies
 *   3. Retrieving policy details from Root
 *
 * Environment variables (set via Firebase secrets):
 *   ROOT_API_KEY        – Root Platform API key
 *   ROOT_API_URL        – Base URL (sandbox: https://sandbox.rootplatform.com/v1)
 *   ROOT_ENVIRONMENT    – "sandbox" | "production"
 *
 * All monetary values use integer cents (ZAR cents on Root sandbox).
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
exports.syncInsurancePolicy = exports.acceptInsuranceQuote = exports.getInsuranceQuote = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
function getRootConfig() {
    const apiKey = process.env.ROOT_API_KEY;
    const apiUrl = process.env.ROOT_API_URL || 'https://api.rootplatform.com/v1/insurance';
    const environment = (process.env.ROOT_ENVIRONMENT || 'sandbox');
    const productModuleKey = process.env.ROOT_PRODUCT_MODULE_KEY || 'camtest';
    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Root Platform API key is not configured. Set ROOT_API_KEY in functions environment.');
    }
    return { apiKey, apiUrl, environment, productModuleKey };
}
async function rootApiFetch(options) {
    const config = getRootConfig();
    const url = `${config.apiUrl}${options.path}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
    };
    const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
        const errorBody = await response.text();
        functions.logger.error(`[Root API] ${options.method} ${options.path} failed`, {
            status: response.status,
            body: errorBody,
        });
        throw new functions.https.HttpsError('internal', `Root Platform API error (${response.status}): ${errorBody}`);
    }
    return response.json();
}
// ============================================================================
// COVERAGE TYPE MAPPING
// ============================================================================
/** Map Driiva coverage type to Root module type */
function mapCoverageToRootModule(coverageType, drivingScore, totalTrips, totalMiles) {
    return {
        type: 'driiva_telematics',
        coverage_type: coverageType,
        driving_score: Math.round(drivingScore),
        total_trips: totalTrips,
        total_miles: Math.round(totalMiles * 100) / 100,
        // Root uses the score to calculate premium discount
        discount_factor: Math.max(0, Math.min(30, (drivingScore - 50) * 0.6)),
    };
}
// ============================================================================
// CALLABLE FUNCTIONS
// ============================================================================
const db = admin.firestore();
/**
 * Generate an insurance quote based on the user's driving score.
 *
 * Input: { coverageType: 'basic' | 'standard' | 'premium' }
 * Output: { quoteId, premiumCents, billingAmountCents, expiresAt, coverageType }
 */
exports.getInsuranceQuote = functions.https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const userId = context.auth.uid;
    const coverageType = data.coverageType || 'standard';
    if (!['basic', 'standard', 'premium'].includes(coverageType)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid coverage type');
    }
    // Fetch user profile for driving score
    const userDoc = await db.collection(types_1.COLLECTION_NAMES.USERS).doc(userId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
    }
    const user = userDoc.data();
    const profile = user.drivingProfile;
    if (profile.totalTrips < 1) {
        throw new functions.https.HttpsError('failed-precondition', 'At least 1 completed trip is required to generate a quote');
    }
    functions.logger.info(`[Insurance] Generating quote for user ${userId}`, {
        coverageType,
        drivingScore: profile.currentScore,
        totalTrips: profile.totalTrips,
    });
    // Build Root quote request
    const config = getRootConfig();
    const quoteRequest = {
        type: config.productModuleKey,
        module: mapCoverageToRootModule(coverageType, profile.currentScore, profile.totalTrips, profile.totalMiles),
    };
    const rootQuote = await rootApiFetch({
        method: 'POST',
        path: '/quotes',
        body: quoteRequest,
    });
    functions.logger.info(`[Insurance] Quote generated`, {
        quoteId: rootQuote.quote_package_id,
        premiumCents: rootQuote.suggested_premium,
    });
    return {
        quoteId: rootQuote.quote_package_id,
        premiumCents: rootQuote.suggested_premium,
        billingAmountCents: rootQuote.billing_amount,
        expiresAt: rootQuote.expiry_date,
        coverageType,
        drivingScore: Math.round(profile.currentScore),
        discountPercentage: Math.round(Math.max(0, Math.min(30, (profile.currentScore - 50) * 0.6))),
    };
});
/**
 * Accept a quote and bind a policy via Root Platform.
 *
 * Input: { quoteId: string }
 * Output: { policyId, policyNumber, status, monthlyPremiumCents }
 */
exports.acceptInsuranceQuote = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const userId = context.auth.uid;
    const quoteId = data.quoteId;
    if (!quoteId || typeof quoteId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'quoteId is required');
    }
    functions.logger.info(`[Insurance] User ${userId} accepting quote ${quoteId}`);
    // Create application (policy binding) on Root
    const application = await rootApiFetch({
        method: 'POST',
        path: '/applications',
        body: {
            quote_package_id: quoteId,
            policyholder_id: userId,
        },
    });
    if (!application.policy_id) {
        throw new functions.https.HttpsError('internal', `Root did not return a policy_id. Application status: ${application.status}`);
    }
    // Fetch the full policy from Root
    const rootPolicy = await rootApiFetch({
        method: 'GET',
        path: `/policies/${application.policy_id}`,
    });
    // Store policy in Firestore
    const policyData = {
        policyId: rootPolicy.policy_id,
        userId,
        policyNumber: rootPolicy.policy_number || `DRV-${Date.now()}`,
        status: 'active',
        coverageType: 'standard', // from quote
        coverageDetails: {
            liabilityLimitCents: 10000000, // $100,000 default
            collisionDeductibleCents: 50000, // $500 default
            comprehensiveDeductibleCents: 25000, // $250 default
            includesRoadside: false,
            includesRental: false,
        },
        basePremiumCents: rootPolicy.monthly_premium,
        currentPremiumCents: rootPolicy.monthly_premium,
        discountPercentage: 0,
        effectiveDate: admin.firestore.Timestamp.fromDate(new Date(rootPolicy.start_date)),
        expirationDate: admin.firestore.Timestamp.fromDate(new Date(rootPolicy.end_date)),
        renewalDate: null,
        vehicle: null,
        billingCycle: 'monthly',
        stripeSubscriptionId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: userId,
        updatedBy: 'cloud-function',
        // Root-specific fields
        rootPolicyId: rootPolicy.policy_id,
        rootApplicationId: application.application_id,
    };
    await db.collection(types_1.COLLECTION_NAMES.POLICIES).doc(rootPolicy.policy_id).set(policyData);
    functions.logger.info(`[Insurance] Policy created`, {
        policyId: rootPolicy.policy_id,
        policyNumber: rootPolicy.policy_number,
        userId,
    });
    return {
        policyId: rootPolicy.policy_id,
        policyNumber: rootPolicy.policy_number,
        status: 'active',
        monthlyPremiumCents: rootPolicy.monthly_premium,
        startDate: rootPolicy.start_date,
        endDate: rootPolicy.end_date,
    };
});
/**
 * Fetch the user's current policy status from Root Platform.
 *
 * Input: { policyId: string }
 * Output: Root policy details synced with local Firestore
 */
exports.syncInsurancePolicy = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const userId = context.auth.uid;
    const policyId = data.policyId;
    if (!policyId || typeof policyId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'policyId is required');
    }
    // Verify ownership
    const localPolicy = await db.collection(types_1.COLLECTION_NAMES.POLICIES).doc(policyId).get();
    if (!localPolicy.exists) {
        throw new functions.https.HttpsError('not-found', 'Policy not found');
    }
    const policyData = localPolicy.data();
    if (policyData.userId !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Not your policy');
    }
    // Fetch latest from Root
    const rootPolicy = await rootApiFetch({
        method: 'GET',
        path: `/policies/${policyId}`,
    });
    // Sync status
    const rootStatus = rootPolicy.status === 'active' ? 'active'
        : rootPolicy.status === 'cancelled' ? 'cancelled'
            : rootPolicy.status === 'expired' ? 'expired'
                : 'pending';
    await db.collection(types_1.COLLECTION_NAMES.POLICIES).doc(policyId).update({
        status: rootStatus,
        currentPremiumCents: rootPolicy.monthly_premium,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'cloud-function',
    });
    functions.logger.info(`[Insurance] Policy ${policyId} synced`, { status: rootStatus });
    return {
        policyId: rootPolicy.policy_id,
        policyNumber: rootPolicy.policy_number,
        status: rootStatus,
        monthlyPremiumCents: rootPolicy.monthly_premium,
        startDate: rootPolicy.start_date,
        endDate: rootPolicy.end_date,
    };
});
//# sourceMappingURL=insurance.js.map