/**
 * Model, retry and cost configuration for the Claude trip analyser, plus the
 * lazily-initialised client. Extracted verbatim from
 * functions/src/ai/tripAnalysis.ts.
 */
import Anthropic from '@anthropic-ai/sdk';
export declare const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export declare const MAX_TOKENS = 1500;
/** Retry config */
export declare const MAX_RETRIES = 3;
export declare const INITIAL_BACKOFF_MS = 1000;
/**
 * Estimated cost per token (USD) for claude-sonnet-4-20250514.
 * Input: $3/M tokens, Output: $15/M tokens.
 * Stored as USD cents per token × 100000 for integer math.
 */
export declare const COST_INPUT_PER_M = 300;
export declare const COST_OUTPUT_PER_M = 1500;
export declare function getClient(): Anthropic;
//# sourceMappingURL=config.d.ts.map