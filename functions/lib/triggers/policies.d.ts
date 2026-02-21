/**
 * POLICY TRIGGERS
 * ===============
 * Cloud Functions triggered by policy document changes.
 */
import * as functions from 'firebase-functions';
/**
 * Triggered when a policy is created or updated
 * Syncs active policy summary to user document
 */
export declare const onPolicyWrite: functions.CloudFunction<functions.Change<functions.firestore.DocumentSnapshot>>;
//# sourceMappingURL=policies.d.ts.map