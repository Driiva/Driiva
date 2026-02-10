/**
 * POLICY TRIGGERS
 * ===============
 * Cloud Functions triggered by policy document changes.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  COLLECTION_NAMES,
  PolicyDocument,
  ActivePolicySummary,
} from '../types';

const db = admin.firestore();

/**
 * Triggered when a policy is created or updated
 * Syncs active policy summary to user document
 */
export const onPolicyWrite = functions.firestore
  .document(`${COLLECTION_NAMES.POLICIES}/{policyId}`)
  .onWrite(async (change, context) => {
    const policyId = context.params.policyId;
    
    // Handle deletion
    if (!change.after.exists) {
      functions.logger.info(`Policy ${policyId} deleted`);
      // Note: We don't auto-clear user.activePolicy on delete
      // This should be handled manually or by a cleanup job
      return;
    }
    
    const policy = change.after.data() as PolicyDocument;
    const beforeData = change.before.exists ? change.before.data() as PolicyDocument : null;
    
    functions.logger.info(`Policy ${policyId} changed`, {
      userId: policy.userId,
      status: policy.status,
      previousStatus: beforeData?.status,
    });
    
    try {
      const userRef = db.collection(COLLECTION_NAMES.USERS).doc(policy.userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        functions.logger.warn(`User ${policy.userId} not found for policy ${policyId}`);
        return;
      }
      
      // Only sync if this is an active policy
      if (policy.status === 'active') {
        const policySummary: ActivePolicySummary = {
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
      
    } catch (error) {
      functions.logger.error(`Error syncing policy ${policyId}:`, error);
      throw error;
    }
  });

/**
 * Find another active policy for a user (excluding a specific policy)
 */
async function findActivePolicy(
  userId: string,
  excludePolicyId: string
): Promise<ActivePolicySummary | null> {
  const policiesRef = db.collection(COLLECTION_NAMES.POLICIES);
  const query = policiesRef
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .limit(2);
  
  const snapshot = await query.get();
  
  for (const doc of snapshot.docs) {
    if (doc.id !== excludePolicyId) {
      const policy = doc.data() as PolicyDocument;
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
