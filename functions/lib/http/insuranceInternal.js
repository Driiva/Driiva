"use strict";
/**
 * Internal Root Platform policy binding - shared between the callable function
 * and the Stripe payment trigger.
 *
 * Extracted here to avoid duplicating Root API logic across modules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapRootPolicyStatus = mapRootPolicyStatus;
exports.acceptInsuranceQuoteInternal = acceptInsuranceQuoteInternal;
const firestore_1 = require("firebase-admin/firestore");
const types_1 = require("../types");
const db = (0, firestore_1.getFirestore)();
/**
 * Root's policy status, mapped onto ours. Only Root saying "active" makes a
 * policy active here.
 *
 * This used to be the literal `status: 'active'`, written regardless of what
 * Root reported, so a policy Root was still holding in a pending state was
 * recorded, rendered and pushed to the driver's phone as live cover. Anything
 * we do not recognise is 'pending', because an unrecognised status is a status
 * we have not verified, and the rule is that we never assert a state we have
 * not verified.
 */
function mapRootPolicyStatus(rootStatus) {
    switch ((rootStatus ?? '').toLowerCase()) {
        case 'active':
            return 'active';
        case 'cancelled':
        case 'canceled':
            return 'cancelled';
        case 'expired':
        case 'lapsed':
            return 'expired';
        case 'suspended':
            return 'suspended';
        default:
            return 'pending';
    }
}
function getRootConfig() {
    const apiKey = process.env.ROOT_API_KEY;
    const productModuleKey = process.env.ROOT_PRODUCT_MODULE_KEY;
    if (!apiKey || !productModuleKey) {
        throw new Error('Root Platform is not configured (ROOT_API_KEY or ROOT_PRODUCT_MODULE_KEY missing)');
    }
    return {
        apiKey,
        apiUrl: process.env.ROOT_API_URL || 'https://api.rootplatform.com/v1/insurance',
        productModuleKey,
    };
}
async function rootApiFetch(path, method, body) {
    const config = getRootConfig();
    const response = await fetch(`${config.apiUrl}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Root API ${method} ${path} failed (${response.status}): ${text}`);
    }
    return response.json();
}
async function acceptInsuranceQuoteInternal(userId, quoteId, stripeSubscriptionId) {
    // Get stored quote coverageType
    const quoteDoc = await db.collection('quotes').doc(quoteId).get();
    const storedCoverage = quoteDoc.exists
        ? quoteDoc.data()?.coverageType || 'standard'
        : 'standard';
    // Get user
    const userDoc = await db.collection(types_1.COLLECTION_NAMES.USERS).doc(userId).get();
    if (!userDoc.exists)
        throw new Error(`User ${userId} not found`);
    const user = userDoc.data();
    // Ensure Root policyholder
    // Written back onto the user document by the insurance callable; see there.
    let policyholderPackageId = user
        .rootPolicyholderId;
    if (!policyholderPackageId) {
        // The identity on an insurance record is the driver's or we do not create
        // it. The old fallback was first_name "Driver", last_name "Unknown" at
        // `${userId}@driiva.internal`, and since provisioning writes displayName
        // null for email signups, that was the ordinary path rather than the edge
        // case. Throwing here marks the pendingPayment failed, which now tells the
        // driver their cover is not in place instead of leaving them to assume it
        // is.
        const nameParts = (user.displayName || '').trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ');
        const email = (user.email || '').trim();
        if (!firstName || !lastName || !email) {
            throw new Error(`Cannot create a policyholder for ${userId} without a real name and email ` +
                `(have firstName=${Boolean(firstName)}, lastName=${Boolean(lastName)}, email=${Boolean(email)})`);
        }
        const ph = await rootApiFetch('/policyholders', 'POST', {
            first_name: firstName,
            last_name: lastName,
            email,
            id: userId,
        });
        policyholderPackageId = ph.policyholder_id;
        await db.collection(types_1.COLLECTION_NAMES.USERS).doc(userId).update({
            rootPolicyholderId: policyholderPackageId,
        }).catch(() => { });
    }
    // Create application
    const application = await rootApiFetch('/applications', 'POST', { quote_package_id: quoteId, policyholder_id: policyholderPackageId });
    if (!application.policy_id) {
        throw new Error(`Root application status: ${application.status} - no policy_id returned`);
    }
    // Get full policy
    const rootPolicy = await rootApiFetch(`/policies/${application.policy_id}`, 'GET');
    // What Root actually told us, which is the only thing we are entitled to
    // record. The policy number used to fall back to a timestamp-derived
    // string: an invented reference, unique per millisecond, that would never
    // match anything in the insurer's system and was pushed to the driver's
    // phone as their policy number.
    const policyNumber = rootPolicy.policy_number || null;
    const status = mapRootPolicyStatus(rootPolicy.status);
    // Store in Firestore
    await db.collection(types_1.COLLECTION_NAMES.POLICIES).doc(rootPolicy.policy_id).set({
        policyId: rootPolicy.policy_id,
        userId,
        policyNumber,
        status,
        coverageType: storedCoverage,
        basePremiumCents: rootPolicy.monthly_premium,
        currentPremiumCents: rootPolicy.monthly_premium,
        discountPercentage: 0,
        effectiveDate: firestore_1.Timestamp.fromDate(new Date(rootPolicy.start_date)),
        expirationDate: firestore_1.Timestamp.fromDate(new Date(rootPolicy.end_date)),
        renewalDate: null,
        vehicle: null,
        billingCycle: 'monthly',
        stripeSubscriptionId: stripeSubscriptionId || null,
        rootPolicyId: rootPolicy.policy_id,
        rootApplicationId: application.application_id,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        createdBy: userId,
        updatedBy: 'cloud-function',
    });
    // Update user activePolicy. The denormalised copy carries the same status
    // the policy document does, so a reader cannot pick up "active" from here
    // while the policy itself is pending.
    await db.collection(types_1.COLLECTION_NAMES.USERS).doc(userId).update({
        activePolicy: {
            policyId: rootPolicy.policy_id,
            policyNumber,
            status,
            startDate: rootPolicy.start_date,
        },
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        updatedBy: 'cloud-function',
    });
    return { policyId: rootPolicy.policy_id, policyNumber, status };
}
//# sourceMappingURL=insuranceInternal.js.map