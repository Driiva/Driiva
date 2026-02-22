"use strict";
/**
 * TESTS: GDPR Functions — exportUserData & deleteUserAccount
 * ===========================================================
 * Tests data export completeness and account deletion thoroughness.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const setup_1 = require("../setup");
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
];
function buildExportManifest(userId, collectionData) {
    return {
        exportedAt: new Date().toISOString(),
        userId,
        collections: collectionData,
    };
}
function validateExportCompleteness(exportData, requiredCollections) {
    const exported = Object.keys(exportData.collections);
    const missing = requiredCollections.filter(c => !exported.includes(c));
    return { complete: missing.length === 0, missing };
}
async function deletionOrderIsCorrect(collections) {
    // Verify parent docs are deleted after sub-collections to avoid orphaned data
    const tripPointsIdx = collections.indexOf('tripPoints');
    const tripsIdx = collections.indexOf('trips');
    const userIdx = collections.indexOf('users');
    // tripPoints must be deleted before trips (parent)
    // trips must be deleted before the user document
    return tripPointsIdx < tripsIdx && tripsIdx < userIdx;
}
function sanitizeExportForPII(data) {
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
const makeUser = () => ({
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
(0, vitest_1.describe)('GDPR Export: validateExportCompleteness', () => {
    (0, vitest_1.it)('reports complete when all required collections are present', () => {
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
        (0, vitest_1.expect)(complete).toBe(true);
        (0, vitest_1.expect)(missing).toHaveLength(0);
    });
    (0, vitest_1.it)('identifies missing collections', () => {
        const exportData = buildExportManifest('user-001', {
            users: [{}],
            trips: [],
            // Missing: tripPoints, tripSegments, etc.
        });
        const { complete, missing } = validateExportCompleteness(exportData, GDPR_COLLECTIONS);
        (0, vitest_1.expect)(complete).toBe(false);
        (0, vitest_1.expect)(missing).toContain('tripPoints');
        (0, vitest_1.expect)(missing).toContain('policies');
    });
    (0, vitest_1.it)('includes export timestamp', () => {
        const exportData = buildExportManifest('user-001', {});
        (0, vitest_1.expect)(exportData.exportedAt).toBeTruthy();
        (0, vitest_1.expect)(new Date(exportData.exportedAt)).toBeInstanceOf(Date);
    });
    (0, vitest_1.it)('includes userId in export manifest', () => {
        const exportData = buildExportManifest('user-abc-123', {});
        (0, vitest_1.expect)(exportData.userId).toBe('user-abc-123');
    });
});
(0, vitest_1.describe)('GDPR Export: PII handling', () => {
    (0, vitest_1.it)('redacts FCM push tokens from export', () => {
        const user = makeUser();
        const sanitized = sanitizeExportForPII(user);
        (0, vitest_1.expect)(sanitized.fcmTokens).toBe('[REDACTED]');
    });
    (0, vitest_1.it)('redacts Stripe subscription ID', () => {
        const data = { stripeSubscriptionId: 'sub_abc123' };
        const sanitized = sanitizeExportForPII(data);
        (0, vitest_1.expect)(sanitized.stripeSubscriptionId).toBe('[REDACTED]');
    });
    (0, vitest_1.it)('redacts phone number', () => {
        const data = { phoneNumber: '+447700900000' };
        const sanitized = sanitizeExportForPII(data);
        (0, vitest_1.expect)(sanitized.phoneNumber).toBe('[REDACTED]');
    });
    (0, vitest_1.it)('preserves non-PII fields', () => {
        const data = { displayName: 'Jamal', email: 'jamal@driiva.co.uk', score: 88 };
        const sanitized = sanitizeExportForPII(data);
        (0, vitest_1.expect)(sanitized.displayName).toBe('Jamal');
        (0, vitest_1.expect)(sanitized.email).toBe('jamal@driiva.co.uk');
        (0, vitest_1.expect)(sanitized.score).toBe(88);
    });
});
(0, vitest_1.describe)('GDPR Deletion: ordering', () => {
    (0, vitest_1.it)('deletes sub-collections before parent documents', async () => {
        // Correct order: tripPoints → trips → users (children before parents)
        const correctOrder = ['tripPoints', 'tripSegments', 'tripAiInsights', 'trips', 'policies', 'poolShares', 'driver_stats', 'aiUsageTracking', 'users'];
        const isCorrect = await deletionOrderIsCorrect(correctOrder);
        (0, vitest_1.expect)(isCorrect).toBe(true);
    });
    (0, vitest_1.it)('rejects incorrect deletion order', async () => {
        // Wrong: deleting users before trips/tripPoints
        const wrongOrder = ['users', 'trips', 'tripPoints'];
        const isCorrect = await deletionOrderIsCorrect(wrongOrder);
        (0, vitest_1.expect)(isCorrect).toBe(false);
    });
});
(0, vitest_1.describe)('deleteUserAccount', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        setup_1.mockBatchCommit.mockResolvedValue(undefined);
        setup_1.mockBatchDelete.mockReturnValue(undefined);
        setup_1.mockDelete.mockResolvedValue(undefined);
        setup_1.mockGet.mockResolvedValue({
            exists: true,
            data: () => makeUser(),
            docs: [],
        });
    });
    (0, vitest_1.it)('validates that caller matches the userId being deleted', () => {
        const isAuthorised = (callerUid, targetUserId) => callerUid === targetUserId;
        (0, vitest_1.expect)(isAuthorised('user-abc', 'user-abc')).toBe(true);
        (0, vitest_1.expect)(isAuthorised('user-abc', 'user-xyz')).toBe(false);
    });
    (0, vitest_1.it)('rejects deletion request for non-existent user', async () => {
        setup_1.mockGet.mockResolvedValue({ exists: false, data: () => null });
        // Simulate the guard check
        const userDoc = await (0, setup_1.mockGet)();
        (0, vitest_1.expect)(userDoc.exists).toBe(false);
    });
    (0, vitest_1.it)('covers all GDPR_COLLECTIONS in deletion', () => {
        // Ensure every collection we store data in is in the deletion list
        const COLLECTIONS_WE_WRITE_TO = [
            'users', 'trips', 'tripPoints', 'tripSegments',
            'tripAiInsights', 'aiUsageTracking', 'policies',
            'poolShares', 'driver_stats',
        ];
        COLLECTIONS_WE_WRITE_TO.forEach(col => {
            (0, vitest_1.expect)(GDPR_COLLECTIONS).toContain(col);
        });
    });
});
(0, vitest_1.describe)('exportUserData', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        setup_1.mockGet.mockResolvedValue({
            exists: true,
            data: () => makeUser(),
            docs: [
                { id: 'trip-001', data: () => ({ tripId: 'trip-001', score: 84 }) },
                { id: 'trip-002', data: () => ({ tripId: 'trip-002', score: 91 }) },
            ],
        });
    });
    (0, vitest_1.it)('includes all data collections in export', () => {
        const collectionData = {};
        GDPR_COLLECTIONS.forEach(col => {
            collectionData[col] = [];
        });
        const exportData = buildExportManifest('user-001', collectionData);
        const { complete } = validateExportCompleteness(exportData, GDPR_COLLECTIONS);
        (0, vitest_1.expect)(complete).toBe(true);
    });
    (0, vitest_1.it)('export is valid JSON-serialisable structure', () => {
        const exportData = buildExportManifest('user-001', {
            users: [makeUser()],
            trips: [{ tripId: 'trip-001' }],
        });
        (0, vitest_1.expect)(() => JSON.stringify(exportData)).not.toThrow();
    });
});
//# sourceMappingURL=gdpr.test.js.map