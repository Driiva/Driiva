/**
 * Numeric and timing helpers shared by the trip-analyser steps.
 * Extracted verbatim from functions/src/ai/tripAnalysis.ts.
 */
export declare function clamp(value: number, min: number, max: number): number;
export declare function round2(value: number): number;
export declare function percentile(sorted: number[], p: number): number;
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=numeric.d.ts.map