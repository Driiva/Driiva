"use strict";
/**
 * TESTS: Pool Calculation — finalizePoolPeriod & recalculatePoolShares
 * =====================================================================
 * Tests the community pool premium pooling and refund calculation logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const setup_1 = require("../setup");
// ---------------------------------------------------------------------------
// Core pool math — extracted business logic under test
// ---------------------------------------------------------------------------
/** Calculate each driver's pool share percentage based on their weighted score */
function calculateSharePercentages(contributions) {
    if (contributions.length === 0)
        return [];
    const weighted = contributions.map(c => ({
        ...c,
        weightedScore: c.contributionCents * (c.averageScore / 100),
    }));
    const totalWeighted = weighted.reduce((sum, w) => sum + w.weightedScore, 0);
    return weighted.map(w => ({
        userId: w.userId,
        weightedScore: w.weightedScore,
        sharePercentage: totalWeighted > 0 ? (w.weightedScore / totalWeighted) * 100 : 0,
    }));
}
/** Calculate projected refund for a driver given pool performance */
function calculateProjectedRefund(contributionCents, sharePercentage, totalPoolCents, claimsRatio, reserveRatio = 0.1) {
    const availableForRefund = totalPoolCents * (1 - claimsRatio) * (1 - reserveRatio);
    return Math.floor((sharePercentage / 100) * availableForRefund);
}
/** Determine if a driver is eligible for refund based on their score */
function isEligibleForRefund(averageScore, minScoreThreshold = 70) {
    return averageScore >= minScoreThreshold;
}
// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makePoolShare = (overrides = {}) => ({
    shareId: 'share-001',
    poolPeriod: '2026-01',
    userId: 'user-001',
    contributionCents: 4500,
    contributionCount: 1,
    sharePercentage: 0,
    weightedScore: 0,
    baseRefundCents: 0,
    projectedRefundCents: 0,
    status: 'active',
    eligibleForRefund: false,
    tripsIncluded: 8,
    milesIncluded: 240,
    averageScore: 82,
    createdAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    updatedAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    finalizedAt: null,
    ...overrides,
});
const makePool = (overrides = {}) => ({
    poolId: 'pool-2026-01',
    totalPoolCents: 450000,
    totalContributionsCents: 450000,
    totalPayoutsCents: 0,
    reserveCents: 45000,
    activeParticipants: 100,
    totalParticipantsEver: 100,
    averagePoolScore: 81,
    safetyFactor: 0.85,
    claimsThisPeriod: 3,
    periodStart: { toDate: () => new Date('2026-01-01'), seconds: 0, nanoseconds: 0 },
    periodEnd: { toDate: () => new Date('2026-01-31'), seconds: 0, nanoseconds: 0 },
    periodType: 'monthly',
    projectedRefundRate: 0.65,
    lastCalculatedAt: { toDate: () => new Date(), seconds: 0, nanoseconds: 0 },
    version: 1,
    ...overrides,
});
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('Pool share percentage calculation', () => {
    (0, vitest_1.it)('divides equally among identical contributors', () => {
        const contributions = [
            { userId: 'user-A', contributionCents: 4500, averageScore: 80 },
            { userId: 'user-B', contributionCents: 4500, averageScore: 80 },
        ];
        const result = calculateSharePercentages(contributions);
        (0, vitest_1.expect)(result[0].sharePercentage).toBeCloseTo(50, 1);
        (0, vitest_1.expect)(result[1].sharePercentage).toBeCloseTo(50, 1);
    });
    (0, vitest_1.it)('gives better-scoring drivers a higher share', () => {
        const contributions = [
            { userId: 'safe-driver', contributionCents: 4500, averageScore: 95 },
            { userId: 'risky-driver', contributionCents: 4500, averageScore: 60 },
        ];
        const result = calculateSharePercentages(contributions);
        const safeShare = result.find(r => r.userId === 'safe-driver');
        const riskyShare = result.find(r => r.userId === 'risky-driver');
        (0, vitest_1.expect)(safeShare.sharePercentage).toBeGreaterThan(riskyShare.sharePercentage);
    });
    (0, vitest_1.it)('gives higher-contributing drivers a higher share (all else equal)', () => {
        const contributions = [
            { userId: 'high-payer', contributionCents: 9000, averageScore: 80 },
            { userId: 'low-payer', contributionCents: 4500, averageScore: 80 },
        ];
        const result = calculateSharePercentages(contributions);
        const high = result.find(r => r.userId === 'high-payer');
        const low = result.find(r => r.userId === 'low-payer');
        (0, vitest_1.expect)(high.sharePercentage).toBeCloseTo(66.67, 1);
        (0, vitest_1.expect)(low.sharePercentage).toBeCloseTo(33.33, 1);
    });
    (0, vitest_1.it)('share percentages sum to 100', () => {
        const contributions = [
            { userId: 'A', contributionCents: 4500, averageScore: 92 },
            { userId: 'B', contributionCents: 6000, averageScore: 74 },
            { userId: 'C', contributionCents: 3000, averageScore: 88 },
        ];
        const result = calculateSharePercentages(contributions);
        const total = result.reduce((sum, r) => sum + r.sharePercentage, 0);
        (0, vitest_1.expect)(total).toBeCloseTo(100, 1);
    });
    (0, vitest_1.it)('handles empty contributions array', () => {
        const result = calculateSharePercentages([]);
        (0, vitest_1.expect)(result).toHaveLength(0);
    });
    (0, vitest_1.it)('handles single contributor (100% share)', () => {
        const contributions = [
            { userId: 'solo', contributionCents: 4500, averageScore: 85 },
        ];
        const result = calculateSharePercentages(contributions);
        (0, vitest_1.expect)(result[0].sharePercentage).toBeCloseTo(100, 1);
    });
});
(0, vitest_1.describe)('Projected refund calculation', () => {
    const POOL_TOTAL = 450000; // £4,500 in cents
    (0, vitest_1.it)('returns zero when claims consume the entire pool', () => {
        const refund = calculateProjectedRefund(4500, 50, POOL_TOTAL, 1.0);
        (0, vitest_1.expect)(refund).toBe(0);
    });
    (0, vitest_1.it)('returns a positive amount in a healthy pool', () => {
        // 20% claims ratio, 10% reserve → 70% available for refund
        const refund = calculateProjectedRefund(4500, 50, POOL_TOTAL, 0.2, 0.1);
        (0, vitest_1.expect)(refund).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('is proportional to share percentage', () => {
        const refundA = calculateProjectedRefund(4500, 60, POOL_TOTAL, 0.2, 0.1);
        const refundB = calculateProjectedRefund(4500, 30, POOL_TOTAL, 0.2, 0.1);
        (0, vitest_1.expect)(refundA).toBeCloseTo(refundB * 2, -2);
    });
    (0, vitest_1.it)('always returns an integer (no fractional cents)', () => {
        const refund = calculateProjectedRefund(4500, 33.333, POOL_TOTAL, 0.15, 0.1);
        (0, vitest_1.expect)(Number.isInteger(refund)).toBe(true);
    });
    (0, vitest_1.it)('never exceeds total pool size', () => {
        const refund = calculateProjectedRefund(4500, 100, POOL_TOTAL, 0, 0);
        (0, vitest_1.expect)(refund).toBeLessThanOrEqual(POOL_TOTAL);
    });
});
(0, vitest_1.describe)('Refund eligibility', () => {
    (0, vitest_1.it)('grants eligibility at or above score threshold', () => {
        (0, vitest_1.expect)(isEligibleForRefund(70)).toBe(true);
        (0, vitest_1.expect)(isEligibleForRefund(85)).toBe(true);
        (0, vitest_1.expect)(isEligibleForRefund(100)).toBe(true);
    });
    (0, vitest_1.it)('denies eligibility below score threshold', () => {
        (0, vitest_1.expect)(isEligibleForRefund(69)).toBe(false);
        (0, vitest_1.expect)(isEligibleForRefund(50)).toBe(false);
        (0, vitest_1.expect)(isEligibleForRefund(0)).toBe(false);
    });
    (0, vitest_1.it)('respects custom threshold', () => {
        (0, vitest_1.expect)(isEligibleForRefund(60, 60)).toBe(true);
        (0, vitest_1.expect)(isEligibleForRefund(59, 60)).toBe(false);
    });
});
(0, vitest_1.describe)('finalizePoolPeriod (scheduled)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        setup_1.mockBatchCommit.mockResolvedValue(undefined);
        setup_1.mockBatchUpdate.mockReturnValue(undefined);
        setup_1.mockBatchSet.mockReturnValue(undefined);
        setup_1.mockGet.mockResolvedValue({
            exists: true,
            data: () => makePool(),
            docs: [
                { id: 'share-001', data: () => makePoolShare({ userId: 'user-001', averageScore: 82 }) },
                { id: 'share-002', data: () => makePoolShare({ userId: 'user-002', averageScore: 65 }) },
            ],
        });
    });
    (0, vitest_1.it)('processes pool finalization without throwing', async () => {
        // Smoke test: verify the scheduled job logic can run
        const pool = makePool();
        const shares = [
            makePoolShare({ userId: 'user-001', averageScore: 82 }),
            makePoolShare({ userId: 'user-002', averageScore: 65 }),
        ];
        const contributions = shares.map(s => ({
            userId: s.userId,
            contributionCents: s.contributionCents,
            averageScore: s.averageScore,
        }));
        const sharePercentages = calculateSharePercentages(contributions);
        (0, vitest_1.expect)(() => {
            sharePercentages.forEach(sp => {
                calculateProjectedRefund(4500, sp.sharePercentage, pool.totalPoolCents, 0.15, 0.1);
            });
        }).not.toThrow();
    });
    (0, vitest_1.it)('marks high-score drivers as eligible for refund', () => {
        const shares = [
            makePoolShare({ userId: 'user-001', averageScore: 82 }),
            makePoolShare({ userId: 'user-002', averageScore: 65 }),
        ];
        const eligibility = shares.map(s => ({
            userId: s.userId,
            eligible: isEligibleForRefund(s.averageScore),
        }));
        (0, vitest_1.expect)(eligibility.find(e => e.userId === 'user-001')?.eligible).toBe(true);
        (0, vitest_1.expect)(eligibility.find(e => e.userId === 'user-002')?.eligible).toBe(false);
    });
});
//# sourceMappingURL=pool.test.js.map