/**
 * Step 2 of the trip analyser: compress a trip plus its GPS points into the
 * summary Claude sees. Extracted verbatim from functions/src/ai/tripAnalysis.ts.
 */
import { TripDocument, TripPoint, DrivingProfileData, TripSegmentsDocument } from '../types';
import type { TripSummaryForAI } from './analysisTypes';
export declare function buildTripSummary(tripId: string, trip: TripDocument, points: TripPoint[], profile: DrivingProfileData, segmentation: TripSegmentsDocument | null): TripSummaryForAI;
//# sourceMappingURL=tripSummary.d.ts.map