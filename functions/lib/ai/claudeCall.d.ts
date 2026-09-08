import type { TripSummaryForAI, ClaudeAnalysisResponse } from './analysisTypes';
export declare function callClaudeWithRetry(summary: TripSummaryForAI): Promise<{
    analysis: ClaudeAnalysisResponse;
    promptTokens: number;
    completionTokens: number;
}>;
export declare function callClaude(summary: TripSummaryForAI): Promise<{
    analysis: ClaudeAnalysisResponse;
    promptTokens: number;
    completionTokens: number;
}>;
//# sourceMappingURL=claudeCall.d.ts.map