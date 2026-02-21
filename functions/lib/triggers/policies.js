"use strict";
/**
 * POLICY TRIGGERS
 * ===============
 * Cloud Functions triggered by policy document changes.
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
exports.onPolicyWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
const db = admin.firestore();
/**
 * Triggered when a policy is created or updated
 * Syncs active policy summary to user document
 */
exports.onPolicyWrite = functions.firestore
    .document(`${types_1.COLLECTION_NAMES.POLICIES}/{policyId}`)
    .onWrite(async (change, context) => {
    const policyId = context.params.policyId;
    // Handle deletion
    if (!change.after.exists) {
        functions.logger.info(`Policy ${policyId} deleted`);
        // Note: We don't auto-clear user.activePolicy on delete
        // This should be handled manually or by a cleanup job
        return;
    }
    const policy = change.after.data();
    const beforeData = change.before.exists ? change.before.data() : null;
    functions.logger.info(`Policy ${policyId} changed`, {
        userId: policy.userId,
        status: policy.status,
        previousStatus: beforeData?.status,
    });
    try {
        const userRef = db.collection(types_1.COLLECTION_NAMES.USERS).doc(policy.userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            functions.logger.warn(`User ${policy.userId} not found for policy ${policyId}`);
            return;
        }
        // Only sync if this is an active policy
        if (policy.status === 'active') {
            const policySummary = {
                policyId: policy.policyId,
                status: policy.status,
                premiumCents: policy.currentPremiumCents,
                coverageType: policy.coverageType,
                renewalDate: policy.renewalDate || policy.expirationDate,
            };
            await userRef.update({
                activePolicy: policySummary,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: 'cloud-function',
            });
            functions.logger.info(`Synced active policy to user ${policy.userId}`);
        }
        // If policy was active and is now inactive, clear from user
        else if (beforeData?.status === 'active') {
            // Check if user's activePolicy is this one
            const userData = userDoc.data();
            if (userData?.activePolicy?.policyId === policyId) {
                // Try to find another active policy for this user
                const otherActivePolicy = await findActivePolicy(policy.userId, policyId);
                await userRef.update({
                    activePolicy: otherActivePolicy,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedBy: 'cloud-function',
                });
                functions.logger.info(`Cleared/replaced active policy for user ${policy.userId}`);
            }
        }
    }
    catch (error) {
        functions.logger.error(`Error syncing policy ${policyId}:`, error);
        throw error;
    }
});
/**
 * Find another active policy for a user (excluding a specific policy)
 */
async function findActivePolicy(userId, excludePolicyId) {
    const policiesRef = db.collection(types_1.COLLECTION_NAMES.POLICIES);
    const query = policiesRef
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .limit(2);
    const snapshot = await query.get();
    for (const doc of snapshot.docs) {
        if (doc.id !== excludePolicyId) {
            const policy = doc.data();
            return {
                policyId: policy.policyId,
                status: policy.status,
                premiumCents: policy.currentPremiumCents,
                coverageType: policy.coverageType,
                renewalDate: policy.renewalDate || policy.expirationDate,
            };
        }
    }
    return null;
}
//# sourceMappingURL=policies.js.map