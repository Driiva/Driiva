"use strict";
/**
 * TESTS: analyzeTripAI & getAIInsights (HTTP Callable)
 * ======================================================
 * Tests AI trip analysis function logic — validation, quota checking,
 * and response parsing from Claude API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const setup_1 = require("../setup");
// ---------------------------------------------------------------------------
// Mock Anthropic SDK
// ---------------------------------------------------------------------------
const mockAnthropicCreate = vitest_1.vi.fn();
vitest_1.vi.mock('@anthropic-ai/sdk', () => ({
    default: class Anthropic {
        constructor() {
            this.messages = { create: mockAnthropicCreate };
        }
    },
    Anthropic: class Anthropic {
        constructor() {
            this.messages = { create: mockAnthropicCreate };
        }
    },
}));
function checkAIQuota(usageToday, limitPerDay, featureEnabled) {
    if (!featureEnabled) {
        return { allowed: false, reason: 'AI insights feature is disabled', usageToday, limitPerDay };
    }
    if (usageToday >= limitPerDay) {
        return { allowed: false, reason: 'Daily AI quota exceeded', usageToday, limitPerDay };
    }
    return { allowed: true, usageToday, limitPerDay };
}
function estimateCostCents(promptTokens, completionTokens) {
    // Claude claude-sonnet-4-20250514 pricing: $3/MTok input, $15/MTok output
    const inputCost = (promptTokens / 1000000) * 3 * 100;
    const outputCost = (completionTokens / 1000000) * 15 * 100;
    return Math.ceil(inputCost + outputCost);
}
function parseAIRiskLevel(raw) {
    const cleaned = raw.toLowerCase().trim();
    if (cleaned === 'low' || cleaned === 'medium' || cleaned === 'high') {
        return cleaned;
    }
    return 'medium';
}
function validateTripForAnalysis(trip) {
    if (!trip.tripId)
        return { valid: false, reason: 'Missing tripId' };
    if (!trip.userId)
        return { valid: false, reason: 'Missing userId' };
    if (trip.status !== 'completed') {
        return { valid: false, reason: `Trip status must be 'completed', got '${trip.status}'` };
    }
    if ((trip.durationSeconds ?? 0) < 60) {
        return { valid: false, reason: 'Trip too short for analysis (< 60 seconds)' };
    }
    return { valid: true };
}
// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const now = () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 });
const makeCompletedTrip = (overrides = {}) => ({
    tripId: 'trip-completed-001',
    userId: 'user-001',
    status: 'completed',
    durationSeconds: 1200,
    distanceMeters: 8000,
    score: 84,
    scoreBreakdown: {
        speedScore: 88,
        brakingScore: 80,
        accelerationScore: 85,
        corneringScore: 90,
        phoneUsageScore: 95,
    },
    events: {
        hardBrakingCount: 2,
        hardAccelerationCount: 1,
        speedingSeconds: 45,
        sharpTurnCount: 3,
        phonePickupCount: 0,
    },
    context: {
        weatherCondition: 'clear',
        isNightDriving: false,
        isRushHour: true,
    },
    startedAt: now(),
    endedAt: now(),
    ...overrides,
});
const makeMockAIResponse = (overrides = {}) => ({
    content: [{
            type: 'text',
            text: JSON.stringify({
                overallScore: 84,
                riskLevel: 'low',
                summary: 'A solid drive with good speed management during rush hour.',
                strengths: ['Excellent phone discipline', 'Smooth cornering'],
                improvements: ['Reduce hard braking events'],
                specificIncidents: [
                    {
                        timestamp: '00:08:30',
                        type: 'harsh_braking',
                        severity: 'medium',
                        description: 'Hard brake applied near junction',
                    },
                ],
                patterns: [],
                safetyTips: ['Increase following distance during rush hour'],
                comparisonToAverage: 'Above your 7-day average by 3 points',
                scoreAdjustment: {
                    originalScore: 84,
                    adjustedScore: 84,
                    delta: 0,
                    reasoning: 'Score is accurate given conditions',
                    confidence: 0.9,
                },
                contextFactors: {
                    timeOfDay: 'morning',
                    dayOfWeek: 'Monday',
                    isNightDriving: false,
                    isRushHour: true,
                    estimatedRoadType: 'urban',
                    weatherConsideration: null,
                },
                historicalComparison: {
                    vsAverageScore: 3,
                    trendDirection: 'improving',
                    consistencyNote: 'Consistent improvement over the last 5 trips',
                },
                ...overrides,
            }),
        }],
    usage: {
        input_tokens: 1200,
        output_tokens: 480,
    },
});
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('Trip validation for AI analysis', () => {
    (0, vitest_1.it)('rejects trips without a tripId', () => {
        const result = validateTripForAnalysis({ ...makeCompletedTrip(), tripId: undefined });
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.reason).toContain('tripId');
    });
    (0, vitest_1.it)('rejects trips without a userId', () => {
        const result = validateTripForAnalysis({ ...makeCompletedTrip(), userId: undefined });
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.reason).toContain('userId');
    });
    (0, vitest_1.it)('rejects non-completed trips', () => {
        const result = validateTripForAnalysis({ ...makeCompletedTrip(), status: 'processing' });
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.reason).toContain('completed');
    });
    (0, vitest_1.it)('rejects trips shorter than 60 seconds', () => {
        const result = validateTripForAnalysis({ ...makeCompletedTrip(), durationSeconds: 45 });
        (0, vitest_1.expect)(result.valid).toBe(false);
        (0, vitest_1.expect)(result.reason).toContain('60 seconds');
    });
    (0, vitest_1.it)('accepts a valid completed trip', () => {
        const result = validateTripForAnalysis(makeCompletedTrip());
        (0, vitest_1.expect)(result.valid).toBe(true);
        (0, vitest_1.expect)(result.reason).toBeUndefined();
    });
});
(0, vitest_1.describe)('AI quota checking', () => {
    (0, vitest_1.it)('blocks when feature flag is disabled', () => {
        const quota = checkAIQuota(0, 50, false);
        (0, vitest_1.expect)(quota.allowed).toBe(false);
        (0, vitest_1.expect)(quota.reason).toContain('disabled');
    });
    (0, vitest_1.it)('blocks when daily quota is exceeded', () => {
        const quota = checkAIQuota(50, 50, true);
        (0, vitest_1.expect)(quota.allowed).toBe(false);
        (0, vitest_1.expect)(quota.reason).toContain('quota');
    });
    (0, vitest_1.it)('allows when under daily quota', () => {
        const quota = checkAIQuota(30, 50, true);
        (0, vitest_1.expect)(quota.allowed).toBe(true);
    });
    (0, vitest_1.it)('blocks at exactly the limit (not under)', () => {
        const quota = checkAIQuota(50, 50, true);
        (0, vitest_1.expect)(quota.allowed).toBe(false);
    });
    (0, vitest_1.it)('reports current usage and limit', () => {
        const quota = checkAIQuota(25, 50, true);
        (0, vitest_1.expect)(quota.usageToday).toBe(25);
        (0, vitest_1.expect)(quota.limitPerDay).toBe(50);
    });
});
(0, vitest_1.describe)('Cost estimation', () => {
    (0, vitest_1.it)('calculates cost for typical analysis call', () => {
        // ~1200 input tokens, ~500 output tokens
        const cost = estimateCostCents(1200, 500);
        (0, vitest_1.expect)(cost).toBeGreaterThan(0);
        (0, vitest_1.expect)(cost).toBeLessThan(100); // Should be well under £1
    });
    (0, vitest_1.it)('returns integer cents', () => {
        const cost = estimateCostCents(1500, 600);
        (0, vitest_1.expect)(Number.isInteger(cost)).toBe(true);
    });
    (0, vitest_1.it)('scales with token count', () => {
        const smallCost = estimateCostCents(500, 200);
        const largeCost = estimateCostCents(5000, 2000);
        (0, vitest_1.expect)(largeCost).toBeGreaterThan(smallCost);
    });
});
(0, vitest_1.describe)('AI risk level parsing', () => {
    (0, vitest_1.it)('parses valid risk levels', () => {
        (0, vitest_1.expect)(parseAIRiskLevel('low')).toBe('low');
        (0, vitest_1.expect)(parseAIRiskLevel('medium')).toBe('medium');
        (0, vitest_1.expect)(parseAIRiskLevel('high')).toBe('high');
    });
    (0, vitest_1.it)('handles uppercase input', () => {
        (0, vitest_1.expect)(parseAIRiskLevel('LOW')).toBe('low');
        (0, vitest_1.expect)(parseAIRiskLevel('HIGH')).toBe('high');
    });
    (0, vitest_1.it)('defaults to medium for unknown values', () => {
        (0, vitest_1.expect)(parseAIRiskLevel('unknown')).toBe('medium');
        (0, vitest_1.expect)(parseAIRiskLevel('')).toBe('medium');
        (0, vitest_1.expect)(parseAIRiskLevel('critical')).toBe('medium');
    });
});
(0, vitest_1.describe)('analyzeTripAI (callable function)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        mockAnthropicCreate.mockResolvedValue(makeMockAIResponse());
        setup_1.mockGet.mockResolvedValue({
            exists: true,
            data: () => makeCompletedTrip(),
        });
        setup_1.mockSet.mockResolvedValue(undefined);
        setup_1.mockUpdate.mockResolvedValue(undefined);
        setup_1.mockAdd.mockResolvedValue({ id: 'tracking-doc-id' });
    });
    (0, vitest_1.it)('calls Claude API with trip context', async () => {
        const trip = makeCompletedTrip();
        await mockAnthropicCreate({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{ role: 'user', content: `Analyse this trip: ${JSON.stringify(trip)}` }],
        });
        (0, vitest_1.expect)(mockAnthropicCreate).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            model: 'claude-sonnet-4-20250514',
            max_tokens: vitest_1.expect.any(Number),
        }));
    });
    (0, vitest_1.it)('parses AI response and extracts structured data', () => {
        const response = makeMockAIResponse();
        const text = response.content[0].text;
        const parsed = JSON.parse(text);
        (0, vitest_1.expect)(parsed.overallScore).toBe(84);
        (0, vitest_1.expect)(parsed.riskLevel).toBe('low');
        (0, vitest_1.expect)(parsed.strengths).toHaveLength(2);
        (0, vitest_1.expect)(parsed.improvements).toHaveLength(1);
        (0, vitest_1.expect)(parsed.specificIncidents).toHaveLength(1);
    });
    (0, vitest_1.it)('tracks usage cost correctly', () => {
        const response = makeMockAIResponse();
        const cost = estimateCostCents(response.usage.input_tokens, response.usage.output_tokens);
        (0, vitest_1.expect)(cost).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=aiAnalysis.test.js.map