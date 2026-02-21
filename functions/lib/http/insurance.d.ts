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
import * as functions from 'firebase-functions';
/**
 * Generate an insurance quote based on the user's driving score.
 *
 * Input: { coverageType: 'basic' | 'standard' | 'premium' }
 * Output: { quoteId, premiumCents, billingAmountCents, expiresAt, coverageType }
 */
export declare const getInsuranceQuote: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Accept a quote and bind a policy via Root Platform.
 *
 * Input: { quoteId: string }
 * Output: { policyId, policyNumber, status, monthlyPremiumCents }
 */
export declare const acceptInsuranceQuote: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Fetch the user's current policy status from Root Platform.
 *
 * Input: { policyId: string }
 * Output: Root policy details synced with local Firestore
 */
export declare const syncInsurancePolicy: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=insurance.d.ts.map