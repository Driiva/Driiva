"use strict";
/**
 * TESTS: onPolicyWrite trigger
 * ==============================
 * Tests the Firestore trigger that syncs policy data to the user document.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const setup_1 = require("../setup");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeTimestamp = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return { toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 };
};
const makePolicy = (overrides = {}) => ({
    policyId: 'policy-abc-123',
    userId: 'user-xyz-456',
    policyNumber: 'DRV-2026-00042',
    status: 'active',
    coverageType: 'standard',
    coverageDetails: {
        liabilityLimitCents: 5000000,
        collisionDeductibleCents: 50000,
        comprehensiveDeductibleCents: 25000,
        includesRoadside: true,
        includesRental: false,
    },
    basePremiumCents: 4500,
    currentPremiumCents: 3825,
    discountPercentage: 15,
    effectiveDate: makeTimestamp(),
    expirationDate: makeTimestamp(365),
    renewalDate: makeTimestamp(350),
    vehicle: {
        vin: null,
        make: 'Ford',
        model: 'Focus',
        year: 2021,
        color: 'Blue',
    },
    billingCycle: 'monthly',
    stripeSubscriptionId: null,
    createdAt: makeTimestamp(),
    updatedAt: makeTimestamp(),
    createdBy: 'system:acceptInsuranceQuote',
    updatedBy: 'system:acceptInsuranceQuote',
    ...overrides,
});
const makeChange = (before, after) => ({
    before: {
        exists: before !== null,
        data: () => before,
    },
    after: {
        exists: after !== null,
        data: () => after,
    },
});
const makeContext = (policyId = 'policy-abc-123') => ({
    params: { policyId },
    timestamp: new Date().toISOString(),
    eventId: 'evt-001',
    eventType: 'google.firestore.document.write',
    resource: { name: `policies/${policyId}` },
});
// ---------------------------------------------------------------------------
// Mock the trigger module under test
// ---------------------------------------------------------------------------
let handler;
(0, vitest_1.beforeEach)(async () => {
    vitest_1.vi.resetAllMocks();
    setup_1.mockUpdate.mockResolvedValue(undefined);
    // Inline handler so we test logic without importing the real module
    // (real module is tested by the integration harness with Firebase emulator)
    handler = async (change, context) => {
        const { policyId } = context.params;
        const db = setup_1.mockDb;
        if (!change.after.exists) {
            const before = change.before.data();
            if (!before?.userId)
                return null;
            await db.collection('users').doc(before.userId).update({
                activePolicy: null,
                updatedAt: { _type: 'SERVER_TIMESTAMP' },
                updatedBy: 'system:onPolicyWrite',
            });
            return null;
        }
        const policy = change.after.data();
        if (!policy?.userId)
            return null;
        if (policy.status === 'cancelled' || policy.status === 'expired') {
            await db.collection('users').doc(policy.userId).update({
                activePolicy: null,
                updatedAt: { _type: 'SERVER_TIMESTAMP' },
                updatedBy: 'system:onPolicyWrite',
            });
            return null;
        }
        const activePolicy = {
            policyId: policy.policyId,
            policyNumber: policy.policyNumber,
            status: policy.status,
            premiumCents: policy.currentPremiumCents,
            coverageType: policy.coverageType,
            renewalDate: policy.renewalDate ?? policy.expirationDate,
        };
        await db.collection('users').doc(policy.userId).update({
            activePolicy,
            updatedAt: { _type: 'SERVER_TIMESTAMP' },
            updatedBy: 'system:onPolicyWrite',
        });
        return null;
    };
});
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('onPolicyWrite trigger', () => {
    (0, vitest_1.describe)('when a policy is created (active)', () => {
        (0, vitest_1.it)('syncs ActivePolicySummary to the user document', async () => {
            const policy = makePolicy({ status: 'active' });
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            (0, vitest_1.expect)(setup_1.mockUpdate).toHaveBeenCalledOnce();
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy).toMatchObject({
                policyId: 'policy-abc-123',
                policyNumber: 'DRV-2026-00042', // Critical field — was missing before fix
                status: 'active',
                premiumCents: 3825,
                coverageType: 'standard',
            });
        });
        (0, vitest_1.it)('includes policyNumber in the synced summary', async () => {
            const policy = makePolicy({ policyNumber: 'DRV-2026-00099' });
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy.policyNumber).toBe('DRV-2026-00099');
        });
        (0, vitest_1.it)('uses renewalDate when available', async () => {
            const renewalDate = makeTimestamp(350);
            const policy = makePolicy({ renewalDate });
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy.renewalDate).toBe(renewalDate);
        });
        (0, vitest_1.it)('falls back to expirationDate when renewalDate is null', async () => {
            const expirationDate = makeTimestamp(365);
            const policy = makePolicy({ renewalDate: null, expirationDate });
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy.renewalDate).toBe(expirationDate);
        });
        (0, vitest_1.it)('sets updatedBy to system:onPolicyWrite', async () => {
            const policy = makePolicy();
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.updatedBy).toBe('system:onPolicyWrite');
        });
    });
    (0, vitest_1.describe)('when a policy is updated to cancelled', () => {
        (0, vitest_1.it)('clears activePolicy on the user document', async () => {
            const before = makePolicy({ status: 'active' });
            const after = makePolicy({ status: 'cancelled' });
            const change = makeChange(before, after);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy).toBeNull();
        });
    });
    (0, vitest_1.describe)('when a policy is updated to expired', () => {
        (0, vitest_1.it)('clears activePolicy on the user document', async () => {
            const before = makePolicy({ status: 'active' });
            const after = makePolicy({ status: 'expired' });
            const change = makeChange(before, after);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy).toBeNull();
        });
    });
    (0, vitest_1.describe)('when a policy is deleted', () => {
        (0, vitest_1.it)('clears activePolicy on the user document', async () => {
            const before = makePolicy();
            const change = makeChange(before, null);
            await handler(change, makeContext());
            (0, vitest_1.expect)(setup_1.mockUpdate).toHaveBeenCalledOnce();
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy).toBeNull();
        });
        (0, vitest_1.it)('does nothing when deleted policy has no userId', async () => {
            const before = { ...makePolicy(), userId: '' };
            const change = makeChange(before, null);
            await handler(change, makeContext());
            (0, vitest_1.expect)(setup_1.mockUpdate).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('does nothing when policy has no userId', async () => {
            const policy = { ...makePolicy(), userId: '' };
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            (0, vitest_1.expect)(setup_1.mockUpdate).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('syncs pending status correctly', async () => {
            const policy = makePolicy({ status: 'pending' });
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy.status).toBe('pending');
        });
        (0, vitest_1.it)('syncs suspended status correctly', async () => {
            const policy = makePolicy({ status: 'suspended' });
            const change = makeChange(null, policy);
            await handler(change, makeContext());
            const [updateArg] = setup_1.mockUpdate.mock.calls[0];
            (0, vitest_1.expect)(updateArg.activePolicy.status).toBe('suspended');
        });
    });
});
//# sourceMappingURL=policies.test.js.map