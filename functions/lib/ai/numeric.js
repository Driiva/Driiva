"use strict";
/**
 * Numeric and timing helpers shared by the trip-analyser steps.
 * Extracted verbatim from functions/src/ai/tripAnalysis.ts.
 */
// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.round2 = round2;
exports.percentile = percentile;
exports.sleep = sleep;
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function round2(value) {
    return Math.round(value * 100) / 100;
}
function percentile(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper)
        return round2(sorted[lower]);
    return round2(sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=numeric.js.map