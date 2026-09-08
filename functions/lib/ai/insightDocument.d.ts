import { TripDocument, TripAIInsightDocument } from '../types';
import type { TripSummaryForAI, ClaudeAnalysisResponse } from './analysisTypes';
export declare function buildInsightDocument(tripId: string, trip: TripDocument, summary: TripSummaryForAI, analysis: ClaudeAnalysisResponse, promptTokens: number, completionTokens: number, latencyMs: number): TripAIInsightDocument;
//# sourceMappingURL=insightDocument.d.ts.map