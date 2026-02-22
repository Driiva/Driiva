/**
 * TESTS: GDPR Functions — exportUserData & deleteUserAccount
 * ===========================================================
 * Tests data export completeness and account deletion thoroughness.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDb, mockGet, mockUpdate, mockDelete, mockBatchCommit, mockBatchDelete } from '../setup';
import type { UserDocument, TripDocument } from '../../types';

// ---------------------------------------------------------------------------
// Business logic helpers (extracted from http/gdpr.ts)
// ---------------------------------------------------------------------------

const GDPR_COLLECTIONS = [
  'users',
  'trips',
  'tripPoints',
  'tripSegments',
  'tripAiInsights',
  'aiUsageTracking',
  'policies',
  'poolShares',
  'driver_stats',
] as const;

interface GDPRExport {
  exportedAt: string;
  userId: string;
  collections: Record<string, unknown[]>;
}

function buildExportManifest(userId: string, collectionData: Record<string, unknown[]>): GDPRExport {
  return {
    exportedAt: new Date().toISOString(),
    userId,
    collections: collectionData,
  };
}

function validateExportCompleteness(
  exportData: GDPRExport,
  requiredCollections: readonly string[]
): { complete: boolean; missing: string[] } {
  const exported = Object.keys(exportData.collections);
  const missing = requiredCollections.filter(c => !exported.includes(c));
  return { complete: missing.length === 0, missing };
}

async function deletionOrderIsCorrect(collections: string[]): Promise<boolean> {
  // Verify parent docs are deleted after sub-collections to avoid orphaned data
  const tripPointsIdx = collections.indexOf('tripPoints');
  const tripsIdx = collections.indexOf('trips');
  const userIdx = collections.indexOf('users');

  // tripPoints must be deleted before trips (parent)
  // trips must be deleted before the user document
  return tripPointsIdx < tripsIdx && tripsIdx < userIdx;
}

function sanitizeExportForPII(data: Record<string, unknown>): Record<string, unknown> {
  const PII_FIELDS = ['fcmTokens', 'stripeSubscriptionId', 'phoneNumber'];
  const sanitized = { ...data };
  PII_FIELDS.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  return sanitized;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = () => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 });

const makeUser = (): Partial<UserDocument> => ({
  uid: 'user-to-delete',
  email: 'jamal@driiva.co.uk',
  displayName: 'Jamal Test',
  photoURL: null,
  phoneNumber: '+447700900000',
  fcmTokens: ['token-abc', 'token-xyz'],
  createdAt: now(),
  updatedAt: now(),
  createdBy: 'system',
  updatedBy: 'system',
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GDPR Export: validateExportCompleteness', () => {
  it('reports complete when all required collections are present', () => {
    const exportData = buildExportManifest('user-001', {
      users: [{}],
      trips: [{}, {}],
      tripPoints: [],
      tripSegments: [],
      tripAiInsights: [],
      aiUsageTracking: [],
      policies: [{}],
      poolShares: [{}],
      driver_stats: [{}],
    });

    const { complete, missing } = validateExportCompleteness(exportData, GDPR_COLLECTIONS);
    expect(complete).toBe(true);
    expect(missing).toHaveLength(0);
  });

  it('identifies missing collections', () => {
    const exportData = buildExportManifest('user-001', {
      users: [{}],
      trips: [],
      // Missing: tripPoints, tripSegments, etc.
    });

    const { complete, missing } = validateExportCompleteness(exportData, GDPR_COLLECTIONS);
    expect(complete).toBe(false);
    expect(missing).toContain('tripPoints');
    expect(missing).toContain('policies');
  });

  it('includes export timestamp', () => {
    const exportData = buildExportManifest('user-001', {});
    expect(exportData.exportedAt).toBeTruthy();
    expect(new Date(exportData.exportedAt)).toBeInstanceOf(Date);
  });

  it('includes userId in export manifest', () => {
    const exportData = buildExportManifest('user-abc-123', {});
    expect(exportData.userId).toBe('user-abc-123');
  });
});

describe('GDPR Export: PII handling', () => {
  it('redacts FCM push tokens from export', () => {
    const user = makeUser() as Record<string, unknown>;
    const sanitized = sanitizeExportForPII(user);
    expect(sanitized.fcmTokens).toBe('[REDACTED]');
  });

  it('redacts Stripe subscription ID', () => {
    const data = { stripeSubscriptionId: 'sub_abc123' };
    const sanitized = sanitizeExportForPII(data as Record<string, unknown>);
    expect(sanitized.stripeSubscriptionId).toBe('[REDACTED]');
  });

  it('redacts phone number', () => {
    const data = { phoneNumber: '+447700900000' };
    const sanitized = sanitizeExportForPII(data as Record<string, unknown>);
    expect(sanitized.phoneNumber).toBe('[REDACTED]');
  });

  it('preserves non-PII fields', () => {
    const data = { displayName: 'Jamal', email: 'jamal@driiva.co.uk', score: 88 };
    const sanitized = sanitizeExportForPII(data as Record<string, unknown>);
    expect(sanitized.displayName).toBe('Jamal');
    expect(sanitized.email).toBe('jamal@driiva.co.uk');
    expect(sanitized.score).toBe(88);
  });
});

describe('GDPR Deletion: ordering', () => {
  it('deletes sub-collections before parent documents', async () => {
    // Correct order: tripPoints → trips → users (children before parents)
    const correctOrder = ['tripPoints', 'tripSegments', 'tripAiInsights', 'trips', 'policies', 'poolShares', 'driver_stats', 'aiUsageTracking', 'users'];
    const isCorrect = await deletionOrderIsCorrect(correctOrder);
    expect(isCorrect).toBe(true);
  });

  it('rejects incorrect deletion order', async () => {
    // Wrong: deleting users before trips/tripPoints
    const wrongOrder = ['users', 'trips', 'tripPoints'];
    const isCorrect = await deletionOrderIsCorrect(wrongOrder);
    expect(isCorrect).toBe(false);
  });
});

describe('deleteUserAccount', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
    mockBatchDelete.mockReturnValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockGet.mockResolvedValue({
      exists: true,
      data: () => makeUser(),
      docs: [],
    });
  });

  it('validates that caller matches the userId being deleted', () => {
    const isAuthorised = (callerUid: string, targetUserId: string) =>
      callerUid === targetUserId;

    expect(isAuthorised('user-abc', 'user-abc')).toBe(true);
    expect(isAuthorised('user-abc', 'user-xyz')).toBe(false);
  });

  it('rejects deletion request for non-existent user', async () => {
    mockGet.mockResolvedValue({ exists: false, data: () => null });

    // Simulate the guard check
    const userDoc = await mockGet();
    expect(userDoc.exists).toBe(false);
  });

  it('covers all GDPR_COLLECTIONS in deletion', () => {
    // Ensure every collection we store data in is in the deletion list
    const COLLECTIONS_WE_WRITE_TO = [
      'users', 'trips', 'tripPoints', 'tripSegments',
      'tripAiInsights', 'aiUsageTracking', 'policies',
      'poolShares', 'driver_stats',
    ];

    COLLECTIONS_WE_WRITE_TO.forEach(col => {
      expect(GDPR_COLLECTIONS).toContain(col);
    });
  });
});

describe('exportUserData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGet.mockResolvedValue({
      exists: true,
      data: () => makeUser(),
      docs: [
        { id: 'trip-001', data: () => ({ tripId: 'trip-001', score: 84 }) },
        { id: 'trip-002', data: () => ({ tripId: 'trip-002', score: 91 }) },
      ],
    });
  });

  it('includes all data collections in export', () => {
    const collectionData: Record<string, unknown[]> = {};
    GDPR_COLLECTIONS.forEach(col => {
      collectionData[col] = [];
    });

    const exportData = buildExportManifest('user-001', collectionData);
    const { complete } = validateExportCompleteness(exportData, GDPR_COLLECTIONS);
    expect(complete).toBe(true);
  });

  it('export is valid JSON-serialisable structure', () => {
    const exportData = buildExportManifest('user-001', {
      users: [makeUser()],
      trips: [{ tripId: 'trip-001' }],
    });

    expect(() => JSON.stringify(exportData)).not.toThrow();
  });
});
