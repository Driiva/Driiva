"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInsightDocument = buildInsightDocument;
/**
 * Step 4 of the trip analyser: turn Claude's response into the Firestore
 * insight document, with the validators that keep every enum inside its
 * declared union. Extracted verbatim from functions/src/ai/tripAnalysis.ts.
 */
const firestore_1 = require("firebase-admin/firestore");
const config_1 = require("./config");
const numeric_1 = require("./numeric");
// ---------------------------------------------------------------------------
// STEP 4: BUILD FIRESTORE DOCUMENT
// ---------------------------------------------------------------------------
function buildInsightDocument(tripId, trip, summary, analysis, promptTokens, completionTokens, latencyMs) {
    const now = firestore_1.Timestamp.now();
    // Validate and clamp core fields
    const overallScore = (0, numeric_1.clamp)(analysis.overallScore ?? trip.score, 0, 100);
    const riskLevel = validateRiskLevel(analysis.riskLevel);
    const adjustedScore = (0, numeric_1.clamp)(analysis.scoreAdjustment?.adjustedScore ?? overallScore, 0, 100);
    // Strengths & improvements - simple string arrays
    const strengths = (analysis.strengths || [])
        .slice(0, 5)
        .map(s => String(s).trim())
        .filter(s => s.length > 0);
    const improvements = (analysis.improvements || [])
        .slice(0, 4)
        .map(s => String(s).trim())
        .filter(s => s.length > 0);
    // Specific incidents
    const specificIncidents = (analysis.specificIncidents || [])
        .slice(0, 10)
        .map(inc => ({
        // WAVE H: this carried a `timestamp` the model produced, e.g. "3 min
        // into trip". The prompt only ever supplied aggregate counts and
        // percentiles, never a per-event timeline, so the model could not know
        // when anything happened and was generating a plausible moment. The
        // incidents themselves are supported by the metrics; their timing was
        // not, so it is gone rather than shown as "Unknown".
        type: validateIncidentType(inc.type),
        severity: validateRiskLevel(inc.severity),
        description: String(inc.description || 'Incident detected'),
    }));
    // Patterns (detailed breakdown)
    const patterns = (analysis.patterns || []).slice(0, 5).map(p => ({
        category: validatePatternCategory(p.category),
        title: String(p.title || 'Pattern detected'),
        description: String(p.description || ''),
        severity: validateRiskLevel(p.severity),
        scoreImpact: (0, numeric_1.clamp)(p.scoreImpact ?? 0, -20, 20),
    }));
    // Safety tips - simple string array
    const safetyTips = (analysis.safetyTips || [])
        .slice(0, 5)
        .map(s => String(s).trim())
        .filter(s => s.length > 0);
    // Comparison to average
    const comparisonToAverage = String(analysis.comparisonToAverage || 'Similar to your average performance.');
    // Score adjustment
    const scoreAdjustment = {
        originalScore: trip.score,
        adjustedScore,
        delta: adjustedScore - trip.score,
        reasoning: String(analysis.scoreAdjustment?.reasoning || 'Score within expected range.'),
        confidence: (0, numeric_1.clamp)(analysis.scoreAdjustment?.confidence ?? 0.7, 0, 1),
    };
    return {
        tripId,
        userId: trip.userId,
        overallScore,
        riskLevel,
        summary: comparisonToAverage, // Use comparisonToAverage as the summary
        strengths,
        improvements,
        specificIncidents,
        patterns,
        safetyTips,
        comparisonToAverage,
        scoreAdjustment,
        contextFactors: {
            timeOfDay: summary.context.timeOfDay,
            dayOfWeek: summary.context.dayOfWeek,
            isNightDriving: summary.context.isNightDriving,
            isRushHour: summary.context.isRushHour,
            estimatedRoadType: String(analysis.contextFactors?.estimatedRoadType || 'mixed'),
            weatherConsideration: analysis.contextFactors?.weatherConsideration || null,
        },
        historicalComparison: {
            vsAverageScore: analysis.historicalComparison?.vsAverageScore ?? 0,
            trendDirection: validateTrend(analysis.historicalComparison?.trendDirection),
            consistencyNote: String(analysis.historicalComparison?.consistencyNote || 'Insufficient data for comparison.'),
        },
        model: config_1.CLAUDE_MODEL,
        modelVersion: config_1.CLAUDE_MODEL,
        promptTokens,
        completionTokens,
        latencyMs,
        analyzedAt: now,
        createdAt: now,
        createdBy: 'ai-analysis',
    };
}
// ---------------------------------------------------------------------------
// VALIDATORS
// ---------------------------------------------------------------------------
const RISK_LEVELS = ['low', 'medium', 'high'];
function validateRiskLevel(value) {
    const lower = (value || '').toLowerCase();
    return RISK_LEVELS.includes(lower) ? lower : 'medium';
}
const INCIDENT_TYPES = [
    'harsh_braking', 'speeding', 'rapid_acceleration', 'sharp_turn',
    'phone_usage', 'tailgating', 'erratic_driving',
];
function validateIncidentType(value) {
    const lower = (value || '').toLowerCase();
    return INCIDENT_TYPES.includes(lower) ? lower : 'erratic_driving';
}
const PATTERN_CATEGORIES = [
    'speed_management', 'braking_behavior', 'acceleration_pattern',
    'cornering_technique', 'following_distance', 'lane_discipline',
    'contextual_awareness', 'fatigue_risk', 'general',
];
function validatePatternCategory(value) {
    const lower = (value || '').toLowerCase();
    return PATTERN_CATEGORIES.includes(lower) ? lower : 'general';
}
function validateTrend(value) {
    const lower = (value || '').toLowerCase();
    if (lower === 'improving' || lower === 'stable' || lower === 'declining')
        return lower;
    return 'stable';
}
//# sourceMappingURL=insightDocument.js.map