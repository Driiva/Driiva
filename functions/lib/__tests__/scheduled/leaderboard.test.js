"use strict";
/**
 * TESTS: updateLeaderboards (scheduled)
 * ======================================
 * Tests leaderboard ranking and sorting logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
function buildLeaderboardRankings(drivers, minTripsRequired = 3) {
    const eligible = drivers.filter(d => d.totalTrips >= minTripsRequired);
    const sorted = [...eligible].sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;
        // Tiebreak: more miles driven wins
        return b.totalMiles - a.totalMiles;
    });
    return sorted.map((driver, i) => ({
        rank: i + 1,
        userId: driver.userId,
        displayName: driver.displayName,
        photoURL: driver.photoURL,
        score: driver.score,
        totalMiles: driver.totalMiles,
        totalTrips: driver.totalTrips,
        change: driver.previousRank !== undefined ? driver.previousRank - (i + 1) : 0,
    }));
}
function calculatePeriodStats(rankings) {
    if (rankings.length === 0) {
        return { totalParticipants: 0, averageScore: 0, medianScore: 0 };
    }
    const scores = rankings.map(r => r.score).sort((a, b) => a - b);
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const mid = Math.floor(scores.length / 2);
    const medianScore = scores.length % 2 !== 0
        ? scores[mid]
        : (scores[mid - 1] + scores[mid]) / 2;
    return {
        totalParticipants: rankings.length,
        averageScore: Math.round(averageScore * 10) / 10,
        medianScore: Math.round(medianScore * 10) / 10,
    };
}
// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeDriver = (overrides = {}) => ({
    userId: `user-${Math.random().toString(36).slice(2, 7)}`,
    displayName: 'Test Driver',
    photoURL: null,
    score: 80,
    totalMiles: 100,
    totalTrips: 10,
    ...overrides,
});
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('buildLeaderboardRankings', () => {
    (0, vitest_1.it)('ranks drivers by score descending', () => {
        const drivers = [
            makeDriver({ userId: 'A', score: 70, displayName: 'Driver A', totalTrips: 5 }),
            makeDriver({ userId: 'B', score: 90, displayName: 'Driver B', totalTrips: 5 }),
            makeDriver({ userId: 'C', score: 80, displayName: 'Driver C', totalTrips: 5 }),
        ];
        const rankings = buildLeaderboardRankings(drivers);
        (0, vitest_1.expect)(rankings[0].userId).toBe('B');
        (0, vitest_1.expect)(rankings[1].userId).toBe('C');
        (0, vitest_1.expect)(rankings[2].userId).toBe('A');
    });
    (0, vitest_1.it)('assigns correct rank numbers starting at 1', () => {
        const drivers = Array.from({ length: 5 }, (_, i) => makeDriver({ score: 90 - i * 10, totalTrips: 5 }));
        const rankings = buildLeaderboardRankings(drivers);
        rankings.forEach((r, i) => (0, vitest_1.expect)(r.rank).toBe(i + 1));
    });
    (0, vitest_1.it)('breaks ties by totalMiles', () => {
        const drivers = [
            makeDriver({ userId: 'A', score: 85, totalMiles: 200, totalTrips: 5 }),
            makeDriver({ userId: 'B', score: 85, totalMiles: 350, totalTrips: 5 }),
        ];
        const rankings = buildLeaderboardRankings(drivers);
        (0, vitest_1.expect)(rankings[0].userId).toBe('B');
        (0, vitest_1.expect)(rankings[1].userId).toBe('A');
    });
    (0, vitest_1.it)('excludes drivers with fewer trips than minimum', () => {
        const drivers = [
            makeDriver({ userId: 'qualified', totalTrips: 5, score: 90 }),
            makeDriver({ userId: 'unqualified', totalTrips: 2, score: 95 }),
        ];
        const rankings = buildLeaderboardRankings(drivers, 3);
        (0, vitest_1.expect)(rankings).toHaveLength(1);
        (0, vitest_1.expect)(rankings[0].userId).toBe('qualified');
    });
    (0, vitest_1.it)('calculates positive rank change when driver moves up', () => {
        const drivers = [
            makeDriver({ userId: 'A', score: 90, previousRank: 3, totalTrips: 5 }),
        ];
        const rankings = buildLeaderboardRankings(drivers);
        // Was rank 3, now rank 1 → change = +2
        (0, vitest_1.expect)(rankings[0].change).toBe(2);
    });
    (0, vitest_1.it)('calculates negative rank change when driver moves down', () => {
        const drivers = [
            makeDriver({ userId: 'A', score: 70, previousRank: 1, totalTrips: 5 }),
            makeDriver({ userId: 'B', score: 90, previousRank: 2, totalTrips: 5 }),
        ];
        const rankings = buildLeaderboardRankings(drivers);
        const aRanking = rankings.find(r => r.userId === 'A');
        // Was rank 1, now rank 2 → change = -1
        (0, vitest_1.expect)(aRanking.change).toBe(-1);
    });
    (0, vitest_1.it)('returns empty array for empty input', () => {
        (0, vitest_1.expect)(buildLeaderboardRankings([])).toHaveLength(0);
    });
    (0, vitest_1.it)('handles single driver', () => {
        const drivers = [makeDriver({ userId: 'solo', score: 88, totalTrips: 5 })];
        const rankings = buildLeaderboardRankings(drivers);
        (0, vitest_1.expect)(rankings).toHaveLength(1);
        (0, vitest_1.expect)(rankings[0].rank).toBe(1);
        (0, vitest_1.expect)(rankings[0].change).toBe(0);
    });
});
(0, vitest_1.describe)('calculatePeriodStats', () => {
    (0, vitest_1.it)('calculates correct average score', () => {
        const rankings = [
            { ...makeDriver(), rank: 1, change: 0, score: 90 },
            { ...makeDriver(), rank: 2, change: 0, score: 80 },
            { ...makeDriver(), rank: 3, change: 0, score: 70 },
        ];
        const stats = calculatePeriodStats(rankings);
        (0, vitest_1.expect)(stats.averageScore).toBe(80);
    });
    (0, vitest_1.it)('calculates correct median for odd number of participants', () => {
        const scores = [70, 80, 90, 75, 85];
        const rankings = scores.map((score, i) => ({
            ...makeDriver(),
            rank: i + 1,
            change: 0,
            score,
        }));
        const stats = calculatePeriodStats(rankings);
        // Sorted: [70, 75, 80, 85, 90] → median = 80
        (0, vitest_1.expect)(stats.medianScore).toBe(80);
    });
    (0, vitest_1.it)('calculates correct median for even number of participants', () => {
        const scores = [70, 80, 90, 100];
        const rankings = scores.map((score, i) => ({
            ...makeDriver(),
            rank: i + 1,
            change: 0,
            score,
        }));
        const stats = calculatePeriodStats(rankings);
        // Sorted: [70, 80, 90, 100] → median = (80+90)/2 = 85
        (0, vitest_1.expect)(stats.medianScore).toBe(85);
    });
    (0, vitest_1.it)('returns zeros for empty rankings', () => {
        const stats = calculatePeriodStats([]);
        (0, vitest_1.expect)(stats.totalParticipants).toBe(0);
        (0, vitest_1.expect)(stats.averageScore).toBe(0);
        (0, vitest_1.expect)(stats.medianScore).toBe(0);
    });
    (0, vitest_1.it)('returns correct totalParticipants', () => {
        const rankings = Array.from({ length: 42 }, (_, i) => ({
            ...makeDriver(),
            rank: i + 1,
            change: 0,
        }));
        const stats = calculatePeriodStats(rankings);
        (0, vitest_1.expect)(stats.totalParticipants).toBe(42);
    });
});
//# sourceMappingURL=leaderboard.test.js.map