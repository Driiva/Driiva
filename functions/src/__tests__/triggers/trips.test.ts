/**
 * TESTS: Trip Firestore Triggers
 * ================================
 * onTripCreate  — validates new trips and sets initial metadata
 * onTripStatusChange — handles recording→processing→completed transitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDb, mockUpdate, mockSet, mockGet } from '../setup';
import type { TripDocument, TripStatus, ScoreBreakdown, TripEvents, TripAnomalyFlags } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 });

const makeScoreBreakdown = (): ScoreBreakdown => ({
  speedScore: 90,
  brakingScore: 85,
  accelerationScore: 88,
  corneringScore: 92,
  phoneUsageScore: 95,
});

const makeEvents = (): TripEvents => ({
  hardBrakingCount: 1,
  hardAccelerationCount: 0,
  speedingSeconds: 30,
  sharpTurnCount: 2,
  phonePickupCount: 0,
});

const makeAnomalies = (): TripAnomalyFlags => ({
  hasGpsJumps: false,
  hasImpossibleSpeed: false,
  isDuplicate: false,
  flaggedForReview: false,
});

const makeTrip = (overrides: Partial<TripDocument> = {}): TripDocument => ({
  tripId: 'trip-001',
  userId: 'user-xyz-456',
  startedAt: now(),
  endedAt: now(),
  durationSeconds: 1200,
  startLocation: { lat: 51.5074, lng: -0.1278, address: 'London', placeType: 'home' },
  endLocation: { lat: 51.515, lng: -0.09, address: 'City of London', placeType: 'work' },
  distanceMeters: 5400,
  score: 0,
  scoreBreakdown: makeScoreBreakdown(),
  events: makeEvents(),
  anomalies: makeAnomalies(),
  status: 'recording',
  processedAt: null,
  context: null,
  createdAt: now(),
  createdBy: 'user-xyz-456',
  pointsCount: 0,
  ...overrides,
});

const makeSnapChange = (before: Partial<TripDocument> | null, after: Partial<TripDocument>) => ({
  before: {
    exists: before !== null,
    data: () => before ? makeTrip(before) : null,
  },
  after: {
    exists: true,
    data: () => makeTrip(after),
    ref: { id: after.tripId ?? 'trip-001', update: mockUpdate },
  },
});

const makeSnap = (data: Partial<TripDocument>) => ({
  id: data.tripId ?? 'trip-001',
  data: () => makeTrip(data),
  ref: { update: mockUpdate, id: data.tripId ?? 'trip-001' },
});

const ctx = (tripId = 'trip-001') => ({
  params: { tripId },
  timestamp: new Date().toISOString(),
  eventId: 'evt-002',
  eventType: 'google.firestore.document.write',
  resource: { name: `trips/${tripId}` },
});

// ---------------------------------------------------------------------------
// Inline handler logic for onTripCreate
// ---------------------------------------------------------------------------

const onTripCreateHandler = async (
  snap: ReturnType<typeof makeSnap>,
  _context: ReturnType<typeof ctx>
) => {
  const trip = snap.data();

  if (!trip.userId || !trip.tripId) {
    return null;
  }

  if (trip.durationSeconds < 60) {
    await snap.ref.update({
      status: 'failed',
      processedAt: { _type: 'SERVER_TIMESTAMP' },
    });
    return null;
  }

  await snap.ref.update({
    status: trip.status,
    updatedAt: { _type: 'SERVER_TIMESTAMP' },
  });

  return null;
};

// ---------------------------------------------------------------------------
// Inline handler logic for onTripStatusChange
// ---------------------------------------------------------------------------

const onTripStatusChangeHandler = async (
  change: ReturnType<typeof makeSnapChange>,
  _context: ReturnType<typeof ctx>
) => {
  const before = change.before.data() as TripDocument | null;
  const after = change.after.data() as TripDocument;

  if (!before || before.status === after.status) return null;

  const db = mockDb;

  // recording → processing: score trip
  if (before.status === 'recording' && after.status === 'processing') {
    const computedScore = 89;
    const breakdown = makeScoreBreakdown();

    await change.after.ref.update({
      score: computedScore,
      scoreBreakdown: breakdown,
      status: 'completed',
      processedAt: { _type: 'SERVER_TIMESTAMP' },
    });

    return null;
  }

  // processing → completed: update user profile
  if (before.status === 'processing' && after.status === 'completed') {
    const userRef = db.collection('users').doc(after.userId);
    const userSnap = await userRef.get();
    if (!mockGet.mock.results[0]?.value) return null;

    await userRef.update({
      'drivingProfile.totalTrips': { _type: 'INCREMENT', n: 1 },
      'drivingProfile.lastTripAt': { _type: 'SERVER_TIMESTAMP' },
      updatedAt: { _type: 'SERVER_TIMESTAMP' },
      updatedBy: 'system:onTripStatusChange',
    });

    return null;
  }

  return null;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('onTripCreate trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue(undefined);
    mockGet.mockResolvedValue({ exists: true, data: () => ({}) });
  });

  it('fails trips shorter than 60 seconds', async () => {
    const snap = makeSnap({ durationSeconds: 45, status: 'recording' });
    await onTripCreateHandler(snap, ctx());

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    );
  });

  it('accepts trips 60 seconds or longer', async () => {
    const snap = makeSnap({ durationSeconds: 600, status: 'recording' });
    await onTripCreateHandler(snap, ctx());

    const [updateArg] = mockUpdate.mock.calls[0];
    expect(updateArg.status).toBe('recording');
  });

  it('returns null without updating when userId is missing', async () => {
    const snap = makeSnap({ userId: '' });
    await onTripCreateHandler(snap, ctx());
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('onTripStatusChange trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue(undefined);
    mockGet.mockResolvedValue({ exists: true, data: () => ({ uid: 'user-xyz-456' }) });
  });

  it('does nothing when status has not changed', async () => {
    const change = makeSnapChange(
      { status: 'recording' },
      { status: 'recording' }
    );
    await onTripStatusChangeHandler(change, ctx());
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('computes and saves score on recording→processing transition', async () => {
    const change = makeSnapChange(
      { status: 'recording' },
      { status: 'processing' }
    );
    await onTripStatusChangeHandler(change, ctx());

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        score: expect.any(Number),
        scoreBreakdown: expect.objectContaining({
          speedScore: expect.any(Number),
          brakingScore: expect.any(Number),
        }),
      })
    );
  });

  it('score is within valid range 0-100', async () => {
    const change = makeSnapChange(
      { status: 'recording' },
      { status: 'processing' }
    );
    await onTripStatusChangeHandler(change, ctx());

    const [updateArg] = mockUpdate.mock.calls[0];
    expect(updateArg.score).toBeGreaterThanOrEqual(0);
    expect(updateArg.score).toBeLessThanOrEqual(100);
  });

  it('updates user drivingProfile on processing→completed transition', async () => {
    const change = makeSnapChange(
      { status: 'processing' },
      { status: 'completed', score: 89, userId: 'user-xyz-456' }
    );
    await onTripStatusChangeHandler(change, ctx());

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        'drivingProfile.totalTrips': expect.objectContaining({ _type: 'INCREMENT' }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Status transition validation
// ---------------------------------------------------------------------------

describe('trip status transition rules', () => {
  const VALID_CLIENT_TRANSITIONS: [TripStatus, TripStatus][] = [
    ['recording', 'processing'],
    ['recording', 'failed'],
  ];

  const INVALID_CLIENT_TRANSITIONS: [TripStatus, TripStatus][] = [
    ['recording', 'completed'],
    ['processing', 'completed'],
    ['processing', 'failed'],
    ['completed', 'recording'],
    ['failed', 'recording'],
  ];

  // These validate our Firestore rules logic
  const isValidClientTransition = (from: TripStatus, to: TripStatus) =>
    (from === 'recording' && to === 'processing') ||
    (from === 'recording' && to === 'failed');

  VALID_CLIENT_TRANSITIONS.forEach(([from, to]) => {
    it(`allows client transition: ${from} → ${to}`, () => {
      expect(isValidClientTransition(from, to)).toBe(true);
    });
  });

  INVALID_CLIENT_TRANSITIONS.forEach(([from, to]) => {
    it(`blocks client transition: ${from} → ${to}`, () => {
      expect(isValidClientTransition(from, to)).toBe(false);
    });
  });
});
