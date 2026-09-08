"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COST_OUTPUT_PER_M = exports.COST_INPUT_PER_M = exports.INITIAL_BACKOFF_MS = exports.MAX_RETRIES = exports.MAX_TOKENS = exports.CLAUDE_MODEL = void 0;
exports.getClient = getClient;
/**
 * Model, retry and cost configuration for the Claude trip analyser, plus the
 * lazily-initialised client. Extracted verbatim from
 * functions/src/ai/tripAnalysis.ts.
 */
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
exports.CLAUDE_MODEL = 'claude-sonnet-4-20250514';
exports.MAX_TOKENS = 1500;
/** Retry config */
exports.MAX_RETRIES = 3;
exports.INITIAL_BACKOFF_MS = 1000; // 1 s → 2 s → 4 s
/**
 * Estimated cost per token (USD) for claude-sonnet-4-20250514.
 * Input: $3/M tokens, Output: $15/M tokens.
 * Stored as USD cents per token × 100000 for integer math.
 */
exports.COST_INPUT_PER_M = 300; // $3.00 per million input tokens
exports.COST_OUTPUT_PER_M = 1500; // $15.00 per million output tokens
/** Lazy-initialised Anthropic client (avoids crash when env var is missing). */
let _client = null;
function getClient() {
    if (!_client) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is not set. ' +
                'Run: firebase functions:secrets:set ANTHROPIC_API_KEY');
        }
        _client = new sdk_1.default({ apiKey });
    }
    return _client;
}
//# sourceMappingURL=config.js.map