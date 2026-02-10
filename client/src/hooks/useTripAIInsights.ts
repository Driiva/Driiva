/**
 * USE TRIP AI INSIGHTS HOOK
 * =========================
 * React hook for fetching and managing AI trip analysis data.
 *
 * Uses TanStack Query for caching, deduplication, and background refetching.
 * The AI insights are generated asynchronously after trip completion, so the
 * hook will poll briefly when insights aren't available yet (for recent trips).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTripAIInsights,
  requestTripAIAnalysis,
  TripAIInsight,
} from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useFeatureFlags } from './useFeatureFlags';

/** Cache key factory */
const aiInsightsKey = (tripId: string) => ['ai-insights', tripId] as const;

interface UseTripAIInsightsOptions {
  /** The trip ID to fetch insights for */
  tripId: string | null;
  /** Whether to enable the query (e.g. only when trip is completed) */
  enabled?: boolean;
}

interface UseTripAIInsightsResult {
  /** The AI insight data, or null if not yet available */
  insights: TripAIInsight | null;
  /** Whether the initial fetch is in progress */
  isLoading: boolean;
  /** Whether a background refetch is in progress */
  isFetching: boolean;
  /** Error from the fetch */
  error: Error | null;
  /** Request on-demand re-analysis */
  requestAnalysis: () => void;
  /** Whether the re-analysis mutation is in progress */
  isAnalyzing: boolean;
}

/**
 * Hook to fetch AI-generated insights for a specific trip.
 *
 * Usage:
 * ```tsx
 * const { insights, isLoading, requestAnalysis, isAnalyzing } = useTripAIInsights({
 *   tripId: trip.tripId,
 *   enabled: trip.status === 'completed',
 * });
 * ```
 */
export function useTripAIInsights({
  tripId,
  enabled = true,
}: UseTripAIInsightsOptions): UseTripAIInsightsResult {
  const queryClient = useQueryClient();
  const { aiInsights: aiEnabled } = useFeatureFlags();

  const {
    data: insights = null,
    isLoading,
    isFetching,
    error,
  } = useQuery<TripAIInsight | null, Error>({
    queryKey: aiInsightsKey(tripId ?? ''),
    queryFn: async () => {
      if (!tripId) return null;
      return fetchTripAIInsights(tripId);
    },
    enabled: enabled && !!tripId && isFirebaseConfigured && aiEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — insights don't change often
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1,
    // If insights aren't available yet (null), refetch once after 10 seconds
    // This handles the case where the user navigates to trip details immediately
    // after trip completion, before the AI analysis Cloud Function finishes.
    refetchInterval: (query) => {
      if (query.state.data === null && query.state.dataUpdateCount < 4) {
        return 10_000; // Poll every 10s, up to ~3 retries
      }
      return false;
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async () => {
      if (!tripId) throw new Error('No trip ID');
      return requestTripAIAnalysis(tripId);
    },
    onSuccess: () => {
      // Invalidate to refetch the fresh insights
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: aiInsightsKey(tripId) });
      }
    },
  });

  return {
    insights,
    isLoading,
    isFetching,
    error: error ?? null,
    requestAnalysis: () => analysisMutation.mutate(),
    isAnalyzing: analysisMutation.isPending,
  };
}
