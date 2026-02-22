/**
 * TESTS: updateLeaderboards (scheduled)
 * ======================================
 * Tests leaderboard ranking and sorting logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDb, mockUpdate, mockSet, mockGet, mockBatchCommit, mockBatchSet } from '../setup';
import type { LeaderboardRanking } from '../../types';

// ---------------------------------------------------------------------------
// Business logic under test (extracted from scheduled/leaderboard.ts)
// ---------------------------------------------------------------------------

interface DriverEntry {
  userId: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  totalMiles: number;
  totalTrips: number;
  previousRank?: number;
}

function buildLeaderboardRankings(
  drivers: DriverEntry[],
  minTripsRequired = 3
): LeaderboardRanking[] {
  const eligible = drivers.filter(d => d.totalTrips >= minTripsRequired);

  const sorted = [...eligible].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
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

function calculatePeriodStats(rankings: LeaderboardRanking[]): {
  totalParticipants: number;
  averageScore: number;
  medianScore: number;
} {
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

const makeDriver = (overrides: Partial<DriverEntry> = {}): DriverEntry => ({
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

describe('buildLeaderboardRankings', () => {
  it('ranks drivers by score descending', () => {
    const drivers = [
      makeDriver({ userId: 'A', score: 70, displayName: 'Driver A', totalTrips: 5 }),
      makeDriver({ userId: 'B', score: 90, displayName: 'Driver B', totalTrips: 5 }),
      makeDriver({ userId: 'C', score: 80, displayName: 'Driver C', totalTrips: 5 }),
    ];

    const rankings = buildLeaderboardRankings(drivers);
    expect(rankings[0].userId).toBe('B');
    expect(rankings[1].userId).toBe('C');
    expect(rankings[2].userId).toBe('A');
  });

  it('assigns correct rank numbers starting at 1', () => {
    const drivers = Array.from({ length: 5 }, (_, i) =>
      makeDriver({ score: 90 - i * 10, totalTrips: 5 })
    );
    const rankings = buildLeaderboardRankings(drivers);
    rankings.forEach((r, i) => expect(r.rank).toBe(i + 1));
  });

  it('breaks ties by totalMiles', () => {
    const drivers = [
      makeDriver({ userId: 'A', score: 85, totalMiles: 200, totalTrips: 5 }),
      makeDriver({ userId: 'B', score: 85, totalMiles: 350, totalTrips: 5 }),
    ];

    const rankings = buildLeaderboardRankings(drivers);
    expect(rankings[0].userId).toBe('B');
    expect(rankings[1].userId).toBe('A');
  });

  it('excludes drivers with fewer trips than minimum', () => {
    const drivers = [
      makeDriver({ userId: 'qualified', totalTrips: 5, score: 90 }),
      makeDriver({ userId: 'unqualified', totalTrips: 2, score: 95 }),
    ];

    const rankings = buildLeaderboardRankings(drivers, 3);
    expect(rankings).toHaveLength(1);
    expect(rankings[0].userId).toBe('qualified');
  });

  it('calculates positive rank change when driver moves up', () => {
    const drivers = [
      makeDriver({ userId: 'A', score: 90, previousRank: 3, totalTrips: 5 }),
    ];

    const rankings = buildLeaderboardRankings(drivers);
    // Was rank 3, now rank 1 → change = +2
    expect(rankings[0].change).toBe(2);
  });

  it('calculates negative rank change when driver moves down', () => {
    const drivers = [
      makeDriver({ userId: 'A', score: 70, previousRank: 1, totalTrips: 5 }),
      makeDriver({ userId: 'B', score: 90, previousRank: 2, totalTrips: 5 }),
    ];

    const rankings = buildLeaderboardRankings(drivers);
    const aRanking = rankings.find(r => r.userId === 'A')!;
    // Was rank 1, now rank 2 → change = -1
    expect(aRanking.change).toBe(-1);
  });

  it('returns empty array for empty input', () => {
    expect(buildLeaderboardRankings([])).toHaveLength(0);
  });

  it('handles single driver', () => {
    const drivers = [makeDriver({ userId: 'solo', score: 88, totalTrips: 5 })];
    const rankings = buildLeaderboardRankings(drivers);
    expect(rankings).toHaveLength(1);
    expect(rankings[0].rank).toBe(1);
    expect(rankings[0].change).toBe(0);
  });
});

describe('calculatePeriodStats', () => {
  it('calculates correct average score', () => {
    const rankings = [
      { ...makeDriver(), rank: 1, change: 0, score: 90 },
      { ...makeDriver(), rank: 2, change: 0, score: 80 },
      { ...makeDriver(), rank: 3, change: 0, score: 70 },
    ] as LeaderboardRanking[];

    const stats = calculatePeriodStats(rankings);
    expect(stats.averageScore).toBe(80);
  });

  it('calculates correct median for odd number of participants', () => {
    const scores = [70, 80, 90, 75, 85];
    const rankings = scores.map((score, i) => ({
      ...makeDriver(),
      rank: i + 1,
      change: 0,
      score,
    })) as LeaderboardRanking[];

    const stats = calculatePeriodStats(rankings);
    // Sorted: [70, 75, 80, 85, 90] → median = 80
    expect(stats.medianScore).toBe(80);
  });

  it('calculates correct median for even number of participants', () => {
    const scores = [70, 80, 90, 100];
    const rankings = scores.map((score, i) => ({
      ...makeDriver(),
      rank: i + 1,
      change: 0,
      score,
    })) as LeaderboardRanking[];

    const stats = calculatePeriodStats(rankings);
    // Sorted: [70, 80, 90, 100] → median = (80+90)/2 = 85
    expect(stats.medianScore).toBe(85);
  });

  it('returns zeros for empty rankings', () => {
    const stats = calculatePeriodStats([]);
    expect(stats.totalParticipants).toBe(0);
    expect(stats.averageScore).toBe(0);
    expect(stats.medianScore).toBe(0);
  });

  it('returns correct totalParticipants', () => {
    const rankings = Array.from({ length: 42 }, (_, i) => ({
      ...makeDriver(),
      rank: i + 1,
      change: 0,
    })) as LeaderboardRanking[];

    const stats = calculatePeriodStats(rankings);
    expect(stats.totalParticipants).toBe(42);
  });
});
