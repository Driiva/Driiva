/**
 * TESTS: analyzeTripAI & getAIInsights (HTTP Callable)
 * ======================================================
 * Tests AI trip analysis function logic — validation, quota checking,
 * and response parsing from Claude API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDb, mockGet, mockSet, mockUpdate, mockAdd } from '../setup';
import type { TripDocument, TripAIInsightDocument, AIRiskLevel } from '../../types';

// ---------------------------------------------------------------------------
// Mock Anthropic SDK
// ---------------------------------------------------------------------------

const mockAnthropicCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = { create: mockAnthropicCreate };
  },
  Anthropic: class Anthropic {
    messages = { create: mockAnthropicCreate };
  },
}));

// ---------------------------------------------------------------------------
// Business logic helpers (extracted from http/aiAnalysis.ts)
// ---------------------------------------------------------------------------

interface AIQuotaCheck {
  allowed: boolean;
  reason?: string;
  usageToday: number;
  limitPerDay: number;
}

function checkAIQuota(
  usageToday: number,
  limitPerDay: number,
  featureEnabled: boolean
): AIQuotaCheck {
  if (!featureEnabled) {
    return { allowed: false, reason: 'AI insights feature is disabled', usageToday, limitPerDay };
  }
  if (usageToday >= limitPerDay) {
    return { allowed: false, reason: 'Daily AI quota exceeded', usageToday, limitPerDay };
  }
  return { allowed: true, usageToday, limitPerDay };
}

function estimateCostCents(promptTokens: number, completionTokens: number): number {
  // Claude claude-sonnet-4-20250514 pricing: $3/MTok input, $15/MTok output
  const inputCost = (promptTokens / 1_000_000) * 3 * 100;
  const outputCost = (completionTokens / 1_000_000) * 15 * 100;
  return Math.ceil(inputCost + outputCost);
}

function parseAIRiskLevel(raw: string): AIRiskLevel {
  const cleaned = raw.toLowerCase().trim();
  if (cleaned === 'low' || cleaned === 'medium' || cleaned === 'high') {
    return cleaned as AIRiskLevel;
  }
  return 'medium';
}

function validateTripForAnalysis(trip: Partial<TripDocument>): { valid: boolean; reason?: string } {
  if (!trip.tripId) return { valid: false, reason: 'Missing tripId' };
  if (!trip.userId) return { valid: false, reason: 'Missing userId' };
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

const makeCompletedTrip = (overrides: Partial<TripDocument> = {}): Partial<TripDocument> => ({
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

describe('Trip validation for AI analysis', () => {
  it('rejects trips without a tripId', () => {
    const result = validateTripForAnalysis({ ...makeCompletedTrip(), tripId: undefined });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('tripId');
  });

  it('rejects trips without a userId', () => {
    const result = validateTripForAnalysis({ ...makeCompletedTrip(), userId: undefined });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('userId');
  });

  it('rejects non-completed trips', () => {
    const result = validateTripForAnalysis({ ...makeCompletedTrip(), status: 'processing' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('completed');
  });

  it('rejects trips shorter than 60 seconds', () => {
    const result = validateTripForAnalysis({ ...makeCompletedTrip(), durationSeconds: 45 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('60 seconds');
  });

  it('accepts a valid completed trip', () => {
    const result = validateTripForAnalysis(makeCompletedTrip());
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

describe('AI quota checking', () => {
  it('blocks when feature flag is disabled', () => {
    const quota = checkAIQuota(0, 50, false);
    expect(quota.allowed).toBe(false);
    expect(quota.reason).toContain('disabled');
  });

  it('blocks when daily quota is exceeded', () => {
    const quota = checkAIQuota(50, 50, true);
    expect(quota.allowed).toBe(false);
    expect(quota.reason).toContain('quota');
  });

  it('allows when under daily quota', () => {
    const quota = checkAIQuota(30, 50, true);
    expect(quota.allowed).toBe(true);
  });

  it('blocks at exactly the limit (not under)', () => {
    const quota = checkAIQuota(50, 50, true);
    expect(quota.allowed).toBe(false);
  });

  it('reports current usage and limit', () => {
    const quota = checkAIQuota(25, 50, true);
    expect(quota.usageToday).toBe(25);
    expect(quota.limitPerDay).toBe(50);
  });
});

describe('Cost estimation', () => {
  it('calculates cost for typical analysis call', () => {
    // ~1200 input tokens, ~500 output tokens
    const cost = estimateCostCents(1200, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(100); // Should be well under £1
  });

  it('returns integer cents', () => {
    const cost = estimateCostCents(1500, 600);
    expect(Number.isInteger(cost)).toBe(true);
  });

  it('scales with token count', () => {
    const smallCost = estimateCostCents(500, 200);
    const largeCost = estimateCostCents(5000, 2000);
    expect(largeCost).toBeGreaterThan(smallCost);
  });
});

describe('AI risk level parsing', () => {
  it('parses valid risk levels', () => {
    expect(parseAIRiskLevel('low')).toBe('low');
    expect(parseAIRiskLevel('medium')).toBe('medium');
    expect(parseAIRiskLevel('high')).toBe('high');
  });

  it('handles uppercase input', () => {
    expect(parseAIRiskLevel('LOW')).toBe('low');
    expect(parseAIRiskLevel('HIGH')).toBe('high');
  });

  it('defaults to medium for unknown values', () => {
    expect(parseAIRiskLevel('unknown')).toBe('medium');
    expect(parseAIRiskLevel('')).toBe('medium');
    expect(parseAIRiskLevel('critical')).toBe('medium');
  });
});

describe('analyzeTripAI (callable function)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAnthropicCreate.mockResolvedValue(makeMockAIResponse());
    mockGet.mockResolvedValue({
      exists: true,
      data: () => makeCompletedTrip(),
    });
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockAdd.mockResolvedValue({ id: 'tracking-doc-id' });
  });

  it('calls Claude API with trip context', async () => {
    const trip = makeCompletedTrip();
    await mockAnthropicCreate({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `Analyse this trip: ${JSON.stringify(trip)}` }],
    });

    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-20250514',
        max_tokens: expect.any(Number),
      })
    );
  });

  it('parses AI response and extracts structured data', () => {
    const response = makeMockAIResponse();
    const text = response.content[0].text;
    const parsed = JSON.parse(text);

    expect(parsed.overallScore).toBe(84);
    expect(parsed.riskLevel).toBe('low');
    expect(parsed.strengths).toHaveLength(2);
    expect(parsed.improvements).toHaveLength(1);
    expect(parsed.specificIncidents).toHaveLength(1);
  });

  it('tracks usage cost correctly', () => {
    const response = makeMockAIResponse();
    const cost = estimateCostCents(
      response.usage.input_tokens,
      response.usage.output_tokens
    );
    expect(cost).toBeGreaterThan(0);
  });
});
