/**
 * Collection names and the enums the document interfaces draw on.
 * Extracted verbatim from functions/src/types.ts, which re-exports this module
 * so every existing import keeps working.
 */
export declare const COLLECTION_NAMES: {
    readonly USERS: "users";
    readonly TRIPS: "trips";
    readonly TRIP_POINTS: "tripPoints";
    readonly TRIP_SEGMENTS: "tripSegments";
    readonly TRIP_AI_INSIGHTS: "tripAiInsights";
    readonly AI_USAGE_TRACKING: "aiUsageTracking";
    readonly POLICIES: "policies";
    readonly COMMUNITY_POOL: "communityPool";
    readonly POOL_SHARES: "poolShares";
    readonly LEADERBOARD: "leaderboard";
    readonly COUNTERS: "counters";
};
export type RiskTier = 'low' | 'medium' | 'high';
export type PolicyStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended';
export type CoverageType = 'basic' | 'standard' | 'premium';
export type TripStatus = 'recording' | 'processing' | 'completed' | 'failed' | 'disputed';
export type PoolShareStatus = 'active' | 'finalized' | 'paid_out';
export type LeaderboardPeriodType = 'weekly' | 'monthly' | 'all_time';
//# sourceMappingURL=enums.d.ts.map