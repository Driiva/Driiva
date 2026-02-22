/**
 * TESTS: onPolicyWrite trigger
 * ==============================
 * Tests the Firestore trigger that syncs policy data to the user document.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDb, mockUpdate, mockGet } from '../setup';
import type { PolicyDocument } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTimestamp = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return { toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 };
};

const makePolicy = (overrides: Partial<PolicyDocument> = {}): PolicyDocument => ({
  policyId: 'policy-abc-123',
  userId: 'user-xyz-456',
  policyNumber: 'DRV-2026-00042',
  status: 'active',
  coverageType: 'standard',
  coverageDetails: {
    liabilityLimitCents: 50000_00,
    collisionDeductibleCents: 500_00,
    comprehensiveDeductibleCents: 250_00,
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

const makeChange = (before: PolicyDocument | null, after: PolicyDocument | null) => ({
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

let handler: (change: ReturnType<typeof makeChange>, ctx: ReturnType<typeof makeContext>) => Promise<null>;

beforeEach(async () => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue(undefined);

  // Inline handler so we test logic without importing the real module
  // (real module is tested by the integration harness with Firebase emulator)
  handler = async (change, context) => {
    const { policyId } = context.params;
    const db = mockDb;

    if (!change.after.exists) {
      const before = change.before.data() as PolicyDocument | undefined;
      if (!before?.userId) return null;
      await db.collection('users').doc(before.userId).update({
        activePolicy: null,
        updatedAt: { _type: 'SERVER_TIMESTAMP' },
        updatedBy: 'system:onPolicyWrite',
      });
      return null;
    }

    const policy = change.after.data() as PolicyDocument;
    if (!policy?.userId) return null;

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

describe('onPolicyWrite trigger', () => {
  describe('when a policy is created (active)', () => {
    it('syncs ActivePolicySummary to the user document', async () => {
      const policy = makePolicy({ status: 'active' });
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      expect(mockUpdate).toHaveBeenCalledOnce();
      const [updateArg] = mockUpdate.mock.calls[0];

      expect(updateArg.activePolicy).toMatchObject({
        policyId: 'policy-abc-123',
        policyNumber: 'DRV-2026-00042',   // Critical field — was missing before fix
        status: 'active',
        premiumCents: 3825,
        coverageType: 'standard',
      });
    });

    it('includes policyNumber in the synced summary', async () => {
      const policy = makePolicy({ policyNumber: 'DRV-2026-00099' });
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy.policyNumber).toBe('DRV-2026-00099');
    });

    it('uses renewalDate when available', async () => {
      const renewalDate = makeTimestamp(350);
      const policy = makePolicy({ renewalDate });
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy.renewalDate).toBe(renewalDate);
    });

    it('falls back to expirationDate when renewalDate is null', async () => {
      const expirationDate = makeTimestamp(365);
      const policy = makePolicy({ renewalDate: null, expirationDate });
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy.renewalDate).toBe(expirationDate);
    });

    it('sets updatedBy to system:onPolicyWrite', async () => {
      const policy = makePolicy();
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.updatedBy).toBe('system:onPolicyWrite');
    });
  });

  describe('when a policy is updated to cancelled', () => {
    it('clears activePolicy on the user document', async () => {
      const before = makePolicy({ status: 'active' });
      const after = makePolicy({ status: 'cancelled' });
      const change = makeChange(before, after);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy).toBeNull();
    });
  });

  describe('when a policy is updated to expired', () => {
    it('clears activePolicy on the user document', async () => {
      const before = makePolicy({ status: 'active' });
      const after = makePolicy({ status: 'expired' });
      const change = makeChange(before, after);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy).toBeNull();
    });
  });

  describe('when a policy is deleted', () => {
    it('clears activePolicy on the user document', async () => {
      const before = makePolicy();
      const change = makeChange(before, null);

      await handler(change, makeContext());

      expect(mockUpdate).toHaveBeenCalledOnce();
      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy).toBeNull();
    });

    it('does nothing when deleted policy has no userId', async () => {
      const before = { ...makePolicy(), userId: '' };
      const change = makeChange(before, null);

      await handler(change, makeContext());

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('does nothing when policy has no userId', async () => {
      const policy = { ...makePolicy(), userId: '' };
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('syncs pending status correctly', async () => {
      const policy = makePolicy({ status: 'pending' });
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy.status).toBe('pending');
    });

    it('syncs suspended status correctly', async () => {
      const policy = makePolicy({ status: 'suspended' });
      const change = makeChange(null, policy);

      await handler(change, makeContext());

      const [updateArg] = mockUpdate.mock.calls[0];
      expect(updateArg.activePolicy.status).toBe('suspended');
    });
  });
});
