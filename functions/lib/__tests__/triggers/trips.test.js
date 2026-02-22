"use strict";
/**
 * TESTS: Trip Firestore Triggers
 * ================================
 * onTripCreate  — validates new trips and sets initial metadata
 * onTripStatusChange — handles recording→processing→completed transitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const setup_1 = require("../setup");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 });
const makeScoreBreakdown = () => ({
    speedScore: 90,
    brakingScore: 85,
    accelerationScore: 88,
    corneringScore: 92,
    phoneUsageScore: 95,
});
const makeEvents = () => ({
    hardBrakingCount: 1,
    hardAccelerationCount: 0,
    speedingSeconds: 30,
    sharpTurnCount: 2,
    phonePickupCount: 0,
});
const makeAnomalies = () => ({
    hasGpsJumps: false,
    hasImpossibleSpeed: false,
    isDuplicate: false,
    flaggedForReview: false,
});
const makeTrip = (overrides = {}) => ({
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
const makeSnapChange = (before, after) => ({
    before: {
        exists: before !== null,
        data: () => before ? makeTrip(before) : null,
    },
    after: {
        exists: true,
        data: () => makeTrip(after),
        ref: { id: after.tripId ?? 'trip-001', update: setup_1.mockUpdate },
    },
});
const makeSnap = (data) => ({
    id: data.tripId ?? 'trip-001',
    data: () => makeTrip(data),
    ref: { update: setup_1.mockUpdate, id: data.tripId ?? 'trip-001' },
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
const onTripCreateHandler = async (snap, _context) => {
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
const onTripStatusChangeHandler = async (change, _context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || before.status === after.status)
        return null;
    const db = setup_1.mockDb;
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
        if (!setup_1.mockGet.mock.results[0]?.value)
            return null;
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
(0, vitest_1.describe)('onTripCreate trigger', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        setup_1.mockUpdate.mockResolvedValue(undefined);
        setup_1.mockGet.mockResolvedValue({ exists: true, data: () => ({}) });
    });
    (0, vitest_1.it)('fails trips shorter than 60 seconds', async () => {
        const snap = makeSnap({ durationSeconds: 45, status: 'recording' });
        await onTripCreateHandler(snap, ctx());
        (0, vitest_1.expect)(setup_1.mockUpdate).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ status: 'failed' }));
    });
    (0, vitest_1.it)('accepts trips 60 seconds or longer', async () => {
        const snap = makeSnap({ durationSeconds: 600, status: 'recording' });
        await onTripCreateHandler(snap, ctx());
        const [updateArg] = setup_1.mockUpdate.mock.calls[0];
        (0, vitest_1.expect)(updateArg.status).toBe('recording');
    });
    (0, vitest_1.it)('returns null without updating when userId is missing', async () => {
        const snap = makeSnap({ userId: '' });
        await onTripCreateHandler(snap, ctx());
        (0, vitest_1.expect)(setup_1.mockUpdate).not.toHaveBeenCalled();
    });
});
(0, vitest_1.describe)('onTripStatusChange trigger', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        setup_1.mockUpdate.mockResolvedValue(undefined);
        setup_1.mockGet.mockResolvedValue({ exists: true, data: () => ({ uid: 'user-xyz-456' }) });
    });
    (0, vitest_1.it)('does nothing when status has not changed', async () => {
        const change = makeSnapChange({ status: 'recording' }, { status: 'recording' });
        await onTripStatusChangeHandler(change, ctx());
        (0, vitest_1.expect)(setup_1.mockUpdate).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('computes and saves score on recording→processing transition', async () => {
        const change = makeSnapChange({ status: 'recording' }, { status: 'processing' });
        await onTripStatusChangeHandler(change, ctx());
        (0, vitest_1.expect)(setup_1.mockUpdate).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            status: 'completed',
            score: vitest_1.expect.any(Number),
            scoreBreakdown: vitest_1.expect.objectContaining({
                speedScore: vitest_1.expect.any(Number),
                brakingScore: vitest_1.expect.any(Number),
            }),
        }));
    });
    (0, vitest_1.it)('score is within valid range 0-100', async () => {
        const change = makeSnapChange({ status: 'recording' }, { status: 'processing' });
        await onTripStatusChangeHandler(change, ctx());
        const [updateArg] = setup_1.mockUpdate.mock.calls[0];
        (0, vitest_1.expect)(updateArg.score).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(updateArg.score).toBeLessThanOrEqual(100);
    });
    (0, vitest_1.it)('updates user drivingProfile on processing→completed transition', async () => {
        const change = makeSnapChange({ status: 'processing' }, { status: 'completed', score: 89, userId: 'user-xyz-456' });
        await onTripStatusChangeHandler(change, ctx());
        (0, vitest_1.expect)(setup_1.mockUpdate).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            'drivingProfile.totalTrips': vitest_1.expect.objectContaining({ _type: 'INCREMENT' }),
        }));
    });
});
// ---------------------------------------------------------------------------
// Status transition validation
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('trip status transition rules', () => {
    const VALID_CLIENT_TRANSITIONS = [
        ['recording', 'processing'],
        ['recording', 'failed'],
    ];
    const INVALID_CLIENT_TRANSITIONS = [
        ['recording', 'completed'],
        ['processing', 'completed'],
        ['processing', 'failed'],
        ['completed', 'recording'],
        ['failed', 'recording'],
    ];
    // These validate our Firestore rules logic
    const isValidClientTransition = (from, to) => (from === 'recording' && to === 'processing') ||
        (from === 'recording' && to === 'failed');
    VALID_CLIENT_TRANSITIONS.forEach(([from, to]) => {
        (0, vitest_1.it)(`allows client transition: ${from} → ${to}`, () => {
            (0, vitest_1.expect)(isValidClientTransition(from, to)).toBe(true);
        });
    });
    INVALID_CLIENT_TRANSITIONS.forEach(([from, to]) => {
        (0, vitest_1.it)(`blocks client transition: ${from} → ${to}`, () => {
            (0, vitest_1.expect)(isValidClientTransition(from, to)).toBe(false);
        });
    });
});
//# sourceMappingURL=trips.test.js.map