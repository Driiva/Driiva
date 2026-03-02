/**
 * AI DRIVING COACH FEEDBACK WIDGET
 * =================================
 * Glassmorphic card with pulsing AI orb, round-robin engagement
 * comments, and optional Perplexity API deep feedback.
 *
 * Behaviour:
 *   - On mount, shows a round-robin comment (rotated via index % length)
 *   - "Get Deeper Feedback" fires Perplexity API with 8s timeout + 1 retry
 *   - On API failure, silently falls back to next round-robin comment
 *   - Caches last API response per tripId to prevent duplicate calls
 *   - Logs every AI feedback request to Firestore ai_feedback_events
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { timing, microInteractions } from '@/lib/animations';

// ============================================================================
// TYPES
// ============================================================================

interface TripStats {
  safetyScore: number;
  speedVariance: number;
  hardBrakes: number;
  duration: number;
  timeOfDay: string;
  rollingScore: number;
}

interface AIFeedbackWidgetProps {
  tripId: string;
  userId: string;
  tripStats: TripStats;
  className?: string;
}

// ============================================================================
// ENGAGEMENT COMMENTS (round-robin)
// ============================================================================

const ENGAGEMENT_COMMENTS: string[] = [
  "Smooth operator 🟢 Your braking pattern is in the top 20% of Driiva drivers this week.",
  "Night driving detected 🌙 Your Night Owl score held strong — that's community gold.",
  "That commute? Clean. Speed variance minimal. Pool contribution: solid.",
  "One hard brake flagged. Happens. Your rolling score is still climbing 📈",
  "Top 15% this trip. The pool notices. Your refund is building.",
  "EcoScore looking sharp ⚡ Consistent throttle = lower emissions + higher score.",
  "That's a #TeamDriiva trip. Every smooth mile moves the community score.",
];

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildFeedbackPrompt(stats: TripStats): string {
  return `You are Driiva's AI driving coach. Give personalised, encouraging, specific feedback in 2-3 sentences max.
Driver stats this trip:
Safety Score: ${stats.safetyScore}/100
Speed Variance: ${stats.speedVariance} (lower = smoother)
Hard Brakes: ${stats.hardBrakes} events
Trip Duration: ${stats.duration} minutes
Time of Day: ${stats.timeOfDay}
Overall Driiva Score (rolling): ${stats.rollingScore}/100
Rules: Be warm, specific, actionable. Never shame. Reference a concrete metric. End with one forward-looking tip. Max 60 words.`;
}

// ============================================================================
// API CALL (Perplexity-compatible, via Cloud Function proxy)
// ============================================================================

const API_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 1;

async function fetchDeepFeedback(
  prompt: string,
  _signal?: AbortSignal,
): Promise<{ text: string; model: string; responseMs: number }> {
  const start = performance.now();

  const apiUrl = import.meta.env.VITE_AI_FEEDBACK_URL as string | undefined;
  if (!apiUrl) {
    throw new Error('AI feedback endpoint not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();
      const responseMs = Math.round(performance.now() - start);

      return {
        text: data.text || data.choices?.[0]?.message?.content || '',
        model: data.model || 'perplexity',
        responseMs,
      };
    } catch (err) {
      clearTimeout(timeout);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) continue;
    }
  }

  throw lastError ?? new Error('AI feedback failed');
}

// ============================================================================
// FIREBASE LOGGING
// ============================================================================

async function logFeedbackEvent(params: {
  tripId: string;
  userId: string;
  source: 'round_robin' | 'api';
  modelUsed: string | null;
  responseMs: number;
  commentIndex?: number;
}): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    await addDoc(collection(db, 'ai_feedback_events'), {
      ...params,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.warn('[AIFeedbackWidget] Failed to log event:', err);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

let globalRotationIndex = 0;

export default function AIFeedbackWidget({
  tripId,
  userId,
  tripStats,
  className = '',
}: AIFeedbackWidgetProps) {
  const commentIndex = useMemo(() => {
    const idx = globalRotationIndex % ENGAGEMENT_COMMENTS.length;
    globalRotationIndex++;
    return idx;
  }, []);

  const [displayText, setDisplayText] = useState(ENGAGEMENT_COMMENTS[commentIndex]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDeepFeedback, setHasDeepFeedback] = useState(false);

  const apiCacheRef = useRef<Map<string, string>>(new Map());

  const handleDeepFeedback = useCallback(async () => {
    const cached = apiCacheRef.current.get(tripId);
    if (cached) {
      setDisplayText(cached);
      setHasDeepFeedback(true);
      return;
    }

    setIsLoading(true);

    try {
      const prompt = buildFeedbackPrompt(tripStats);
      const result = await fetchDeepFeedback(prompt);

      apiCacheRef.current.set(tripId, result.text);
      setDisplayText(result.text);
      setHasDeepFeedback(true);

      void logFeedbackEvent({
        tripId,
        userId,
        source: 'api',
        modelUsed: result.model,
        responseMs: result.responseMs,
      });
    } catch {
      const fallbackIdx = (commentIndex + 1) % ENGAGEMENT_COMMENTS.length;
      setDisplayText(ENGAGEMENT_COMMENTS[fallbackIdx]);

      void logFeedbackEvent({
        tripId,
        userId,
        source: 'round_robin',
        modelUsed: null,
        responseMs: 0,
        commentIndex: fallbackIdx,
      });
    } finally {
      setIsLoading(false);
    }
  }, [tripId, userId, tripStats, commentIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: timing.cardEntrance, delay: 0.1 }}
      className={`dashboard-glass-card ${className}`}
    >
      {/* Header with AI orb */}
      <div className="flex items-center gap-3 mb-3">
        <div className="ai-orb" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-white">AI Coach</h3>
          <p className="text-[10px] text-white/40">
            {hasDeepFeedback ? 'Deep analysis' : 'Quick insight'}
          </p>
        </div>
      </div>

      {/* Feedback text */}
      {isLoading ? (
        <div className="ai-feedback-skeleton" aria-label="Loading AI feedback">
          <div className="h-3 w-full bg-white/10 rounded mb-2 animate-shimmer" />
          <div className="h-3 w-4/5 bg-white/10 rounded mb-2 animate-shimmer" />
          <div className="h-3 w-3/5 bg-white/10 rounded animate-shimmer" />
        </div>
      ) : (
        <motion.p
          key={displayText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-white/90 leading-relaxed line-clamp-3"
        >
          {displayText}
        </motion.p>
      )}

      {/* CTA */}
      {!hasDeepFeedback && (
        <motion.button
          onClick={handleDeepFeedback}
          disabled={isLoading}
          whileTap={microInteractions.tap}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium
            bg-indigo-500/15 border border-indigo-500/25 text-indigo-300
            hover:bg-indigo-500/25 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2 min-h-[44px]"
          aria-label="Get deeper AI feedback for this trip"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Get Deeper Feedback
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
