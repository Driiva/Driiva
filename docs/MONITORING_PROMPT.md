# Driiva Live Monitoring — Implementation Prompt

**Purpose:** Step-by-step Chain-of-Thought prompt for implementing live monitoring across the Driiva telematics stack. Execute tasks 1-5 in order. Each task lists the exact files to edit, code to add, and verification steps.

---

## Architecture Context

```
Frontend:  React 18 + TypeScript + Vite (deployed on Vercel)
Backend:   Firebase Cloud Functions v5 (Node.js 20, europe-west2)
Database:  Cloud Firestore (NoSQL)
AI:        Anthropic Claude Sonnet 4 (trip analysis)
Classifier: Python Stop-Go-Classifier (HTTP, not yet deployed)
Monitoring (current): Sentry (installed but half-wired), Firebase Analytics (conditional)
```

### Current Monitoring State — What Exists vs What Is Wired

| Component | Installed | Actually Wired |
|-----------|-----------|----------------|
| Sentry client (`@sentry/react`) | Yes | Yes — `initSentry()` in `main.tsx`, `SentryErrorBoundary` wraps `<App />` |
| Sentry functions (`@sentry/node`) | Yes | **NO** — `wrapFunction()` / `wrapTrigger()` defined in `functions/src/lib/sentry.ts` but never imported by any function handler |
| `setSentryUser()` (client) | Yes | **NO** — defined in `client/src/lib/sentry.ts` but never called from `AuthContext` |
| `setSentryUser()` (functions) | Yes | **NO** — defined but never called from callable handlers |
| Firebase Analytics | Yes | Conditional — only when `VITE_FIREBASE_MEASUREMENT_ID` is set, no custom events |
| Firebase Performance Monitoring | **NO** | Not installed |
| Vercel Analytics / Speed Insights | **NO** | Not installed |
| Alerting (PagerDuty, Cloud Monitoring) | **NO** | Zero alerting configured |
| Health endpoint | Yes | `GET /health` at `functions/src/http/health.ts` — checks Firestore reachability |

### Key File Paths

```
functions/src/index.ts              — All 27 Cloud Function exports
functions/src/lib/sentry.ts         — Sentry wrappers (wrapFunction, wrapTrigger, captureError)
functions/src/triggers/trips.ts     — Core trip pipeline (onTripCreate, onTripStatusChange, finalizeTripFromPoints)
functions/src/http/classifier.ts    — Python classifier HTTP call
functions/src/http/health.ts        — Health check endpoint
functions/src/ai/tripAnalysis.ts    — Claude AI analysis + usage tracking pattern
functions/src/scheduled/damoovSync.ts — Daily sync with audit logs
functions/package.json              — Cloud Functions dependencies

client/src/main.tsx                 — App entry point (Sentry init + ErrorBoundary)
client/src/lib/sentry.ts           — Client Sentry (initSentry, captureError, setSentryUser)
client/src/lib/firebase.ts         — Firebase init (auth, db, analytics)
client/src/contexts/AuthContext.tsx — Auth state listener (where setSentryUser should be called)
package.json                        — Root project dependencies

ROADMAP.md                          — Sprint tracker
```

---

## Pre-Flight Checks

Before making any changes, verify:

1. Read `functions/src/lib/sentry.ts` — confirm `wrapFunction` and `wrapTrigger` exist and their signatures.
2. Read `functions/src/index.ts` — confirm the list of all exported functions.
3. Read `client/src/contexts/AuthContext.tsx` — confirm the `onAuthStateChanged` callback where `setSentryUser` needs to be called.
4. Read `client/src/lib/firebase.ts` — confirm current imports and exports (where `firebase/performance` will be added).
5. Read `client/src/main.tsx` — confirm entry point structure (where Vercel Analytics will be initialized).

---

## TASK 1: Complete Sentry Wiring

Sentry is installed on both client and Cloud Functions but is only half-wired. This task activates it fully.

### 1A. Wire `setSentryUser` into the client auth flow

**File:** `client/src/contexts/AuthContext.tsx`

**What to do:** Import `setSentryUser` from `../lib/sentry` and call it whenever the user state changes in the `onAuthStateChanged` callback. Clear the user on logout.

Add import at top of file (alongside existing imports):

```typescript
import { setSentryUser } from '../lib/sentry';
```

Inside the `onAuthStateChanged` callback, after each place where `setUser(...)` is called with a valid user object, add:

```typescript
setSentryUser({ id: firebaseUser.uid, email: firebaseUser.email ?? undefined });
```

There are three branches that set a user (lines ~118, ~132, ~148 in AuthContext.tsx). Add the `setSentryUser` call after each `setUser(...)` call in those branches.

In the `else` branch (user is null, ~line 157-161), and in the `logout` function (~line 174), add:

```typescript
setSentryUser(null);
```

### 1B. Wire `wrapFunction` and `wrapTrigger` into Cloud Functions

**File:** `functions/src/lib/sentry.ts`

**Problem:** The current `wrapTrigger` signature is too restrictive. It types the handler as `(...args: T[]) => Promise<void>` which won't match Firestore trigger signatures like `(snap, context)` or `(change, context)`. Fix the type signature to accept any async function:

Replace the `wrapTrigger` function with:

```typescript
export function wrapTrigger<T extends (...args: any[]) => Promise<void>>(
  handler: T,
): T {
  return (async (...args: any[]): Promise<void> => {
    initSentry();

    try {
      await handler(...args);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        triggerName: handler.name || 'anonymous',
      });

      if (SENTRY_DSN && initialized) {
        await Sentry.flush(2000);
      }

      throw error;
    }
  }) as unknown as T;
}
```

**File:** `functions/src/triggers/trips.ts`

Import `wrapTrigger` and `captureError`:

```typescript
import { wrapTrigger, captureError } from '../lib/sentry';
```

Wrap the two main trigger handlers. For `onTripCreate`, change the `.onCreate(async (snap, context) => {` handler to be wrapped:

```typescript
.onCreate(wrapTrigger(async (snap, context) => {
  // ... existing handler body unchanged ...
}))
```

Do the same for `onTripStatusChange` — wrap the `.onUpdate(async (change, context) => {` handler:

```typescript
.onUpdate(wrapTrigger(async (change, context) => {
  // ... existing handler body unchanged ...
}))
```

**File:** `functions/src/http/classifier.ts`

For `classifyTrip` (an `onCall` function), import `wrapFunction`:

```typescript
import { wrapFunction } from '../lib/sentry';
```

Wrap the handler passed to `.https.onCall(...)`:

```typescript
export const classifyTrip = functions
  .region(EUROPE_LONDON)
  .https.onCall(wrapFunction(async (data, context) => {
    // ... existing handler body ...
  }));
```

Do the same for `batchClassifyTrips`.

**Repeat for all callable functions in:**

- `functions/src/http/admin.ts` — `initializePool`, `addPoolContribution`, `cancelTrip`
- `functions/src/http/aiAnalysis.ts` — `analyzeTripAI`, `getAIInsights`
- `functions/src/http/gdpr.ts` — `exportUserData`, `deleteUserAccount`
- `functions/src/http/insurance.ts` — `getInsuranceQuote`, `acceptInsuranceQuote`, `syncInsurancePolicy`
- `functions/src/http/betaEstimate.ts` — `calculateBetaEstimateForUser`
- `functions/src/http/achievements.ts` — `seedAchievements`

**Repeat for all trigger functions in:**

- `functions/src/triggers/policies.ts` — `onPolicyWrite`
- `functions/src/triggers/pool.ts` — `onPoolShareWrite`
- `functions/src/triggers/users.ts` — `onUserCreate`
- `functions/src/triggers/syncUserOnSignup.ts` — `syncUserOnSignup`
- `functions/src/triggers/syncTripOnComplete.ts` — `syncTripOnComplete`

**For scheduled functions** (`functions/src/scheduled/*`), use `wrapTrigger` since they are also background-triggered:

- `functions/src/scheduled/leaderboard.ts` — `updateLeaderboards`
- `functions/src/scheduled/pool.ts` — `finalizePoolPeriod`, `recalculatePoolShares`
- `functions/src/scheduled/notifications.ts` — `sendWeeklySummary`
- `functions/src/scheduled/damoovSync.ts` — `syncDamoovTrips`

**For the `onUserUpdateRecalcBetaEstimate` trigger** in `functions/src/http/betaEstimate.ts`, also wrap with `wrapTrigger`.

### 1C. Add Sentry performance spans to the trip pipeline

**File:** `functions/src/triggers/trips.ts`

In `finalizeTripFromPoints`, add timing instrumentation using `Sentry.startSpan` around the key operations. Import Sentry at the top:

```typescript
import * as Sentry from '@sentry/node';
import { wrapTrigger, captureError, initSentry } from '../lib/sentry';
```

Inside `finalizeTripFromPoints`, after the try block opens, wrap the core compute step:

```typescript
const metrics = await Sentry.startSpan(
  { name: 'computeTripMetrics', op: 'function' },
  async () => computeTripMetrics(points, startTimestampMs),
);
```

Wrap the weather fetch:

```typescript
const weatherCondition = await Sentry.startSpan(
  { name: 'getWeatherForTrip', op: 'http.client' },
  async () => getWeatherForTrip(
    tripData.startLocation.lat,
    tripData.startLocation.lng,
    tripData.startedAt.toDate(),
  ),
);
```

Wrap the profile update:

```typescript
await Sentry.startSpan(
  { name: 'updateDriverProfileAndPoolShare', op: 'db.transaction' },
  async () => updateDriverProfileAndPoolShare(updatedTrip, tripId),
);
```

### Verification — Task 1

1. `cd functions && npm run build` — must compile without errors.
2. `cd .. && npx tsc --noEmit` — client must type-check.
3. Search for `wrapFunction` and `wrapTrigger` imports — every callable and trigger should have one.
4. Search for `setSentryUser` — should appear in `AuthContext.tsx` at least 4 times (3 set + 1 clear).

---

## TASK 2: Add Firebase Performance Monitoring

### 2A. Add Firebase Performance SDK to the client

**File:** `client/src/lib/firebase.ts`

Add import:

```typescript
import { getPerformance, FirebasePerformance } from 'firebase/performance';
```

Add the variable alongside the other `let` declarations (~line 131-134):

```typescript
let perf: FirebasePerformance | null = null;
```

Inside the `if (isFirebaseConfigured)` block, after analytics initialization (~line 154), add:

```typescript
try {
  perf = getPerformance(app);
} catch (perfErr) {
  console.warn('Firebase Performance Monitoring could not be initialized:', perfErr);
}
```

Add `perf` to the named exports:

```typescript
export { auth, db, googleProvider, analytics, perf };
```

### 2B. Add custom performance traces for critical user flows

**File:** Create a utility `client/src/lib/performanceTraces.ts`:

```typescript
import { perf } from './firebase';
import { trace as firebaseTrace, type PerformanceTrace } from 'firebase/performance';

const activeTraces = new Map<string, PerformanceTrace>();

export function startTrace(name: string, attributes?: Record<string, string>): void {
  if (!perf) return;
  try {
    const t = firebaseTrace(perf, name);
    if (attributes) {
      Object.entries(attributes).forEach(([k, v]) => t.putAttribute(k, v));
    }
    t.start();
    activeTraces.set(name, t);
  } catch {
    // Non-critical
  }
}

export function stopTrace(name: string, metrics?: Record<string, number>): void {
  const t = activeTraces.get(name);
  if (!t) return;
  try {
    if (metrics) {
      Object.entries(metrics).forEach(([k, v]) => t.putMetric(k, v));
    }
    t.stop();
  } catch {
    // Non-critical
  } finally {
    activeTraces.delete(name);
  }
}
```

This gives us `startTrace('trip_recording')` / `stopTrace('trip_recording', { pointCount: 150 })` — to be called from the trip recording hooks and the score-loading components. Those integration points are documented but the hooks/components vary; add them when touching trip recording and dashboard score display code.

### 2C. Vite manual chunk for firebase/performance

**File:** `vite.config.ts`

In the `manualChunks` config, add `firebase/performance` to the firebase chunk:

```typescript
manualChunks: {
  firebase: ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/functions", "firebase/performance"],
  vendor: ["react", "react-dom"],
},
```

### Verification — Task 2

1. `cd client && npx tsc --noEmit` — must compile.
2. In browser dev tools, check Network tab for calls to `firebaselogging-pa.googleapis.com` — that confirms Performance SDK is active.
3. In Firebase Console > Performance, confirm data starts appearing within a few minutes of page loads.

---

## TASK 3: Add Structured Metrics Logging to Cloud Functions

Firebase Cloud Functions logs are automatically ingested by Google Cloud Logging and Cloud Monitoring. By using `functions.logger` with structured JSON payloads and consistent keys, we get queryable metrics without any extra infrastructure.

### 3A. Add metric logging to the classifier HTTP call

**File:** `functions/src/http/classifier.ts`

In `callPythonClassifier`, add timing and structured metric logging. Wrap the fetch call:

```typescript
async function callPythonClassifier(
  tripId: string,
  userId: string,
  points: Array<{ lat: number; lng: number; ts: number; speed: number }>,
  settings?: Record<string, number>
): Promise<ClassifierResponse> {
  if (!CLASSIFIER_URL) {
    functions.logger.warn('Classifier URL not configured, skipping classification');
    return { success: false, trip_id: tripId, error: 'Classifier URL not configured' };
  }

  const startMs = Date.now();
  try {
    const response = await fetch(`${CLASSIFIER_URL}/classify_trip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip_id: tripId,
        user_id: userId,
        points,
        settings,
        save_results: false,
      }),
    });

    const latencyMs = Date.now() - startMs;

    if (!response.ok) {
      const errorText = await response.text();
      functions.logger.error('[metric] classifier_call', {
        metric: 'classifier_call',
        tripId, success: false, latencyMs,
        statusCode: response.status, error: errorText,
        pointCount: points.length,
      });
      throw new Error(`Classifier returned ${response.status}: ${errorText}`);
    }

    const result = await response.json() as ClassifierResponse;

    functions.logger.info('[metric] classifier_call', {
      metric: 'classifier_call',
      tripId, success: result.success, latencyMs,
      pointCount: points.length,
      stopCount: result.classification?.summary.total_stops ?? 0,
      segmentCount: result.classification?.summary.total_trips ?? 0,
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startMs;
    functions.logger.error('[metric] classifier_call', {
      metric: 'classifier_call',
      tripId, success: false, latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
      pointCount: points.length,
    });
    return {
      success: false,
      trip_id: tripId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 3B. Add metric logging to the trip processing pipeline

**File:** `functions/src/triggers/trips.ts`

In `finalizeTripFromPoints`, add overall pipeline timing. At the start of the function (inside the try block):

```typescript
const pipelineStartMs = Date.now();
```

After the trip document is updated (after the `tripRef.update(...)` call around line 420):

```typescript
functions.logger.info('[metric] trip_pipeline', {
  metric: 'trip_pipeline',
  tripId,
  userId: tripData.userId,
  pipelineMs: Date.now() - pipelineStartMs,
  pointCount: points.length,
  distanceMeters: metrics.distanceMeters,
  durationSeconds: metrics.durationSeconds,
  score: metrics.score,
  finalStatus,
  flaggedForReview: anomalies.flaggedForReview,
});
```

In the catch block, also log the failure metric:

```typescript
functions.logger.error('[metric] trip_pipeline', {
  metric: 'trip_pipeline',
  tripId,
  userId: tripData.userId,
  pipelineMs: Date.now() - pipelineStartMs,
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
});
```

### 3C. Add metric logging to AI analysis

**File:** `functions/src/ai/tripAnalysis.ts`

The `trackAPIUsage` function already writes to Firestore. Add a parallel `functions.logger.info` call inside it for Cloud Monitoring:

After the `await db.collection(...)` call in `trackAPIUsage`, add:

```typescript
functions.logger.info('[metric] ai_analysis', {
  metric: 'ai_analysis',
  tripId, userId,
  model: CLAUDE_MODEL,
  promptTokens, completionTokens,
  totalTokens,
  estimatedCostCents,
  latencyMs,
  success,
  error,
});
```

### 3D. Cloud Monitoring log-based metrics (gcloud CLI)

After deployment, run these commands to create log-based metrics in Google Cloud Monitoring. These queries match the `[metric]` tagged log entries above:

```bash
# Trip pipeline latency metric
gcloud logging metrics create trip_pipeline_latency \
  --project=driiva \
  --description="Trip processing pipeline latency" \
  --log-filter='resource.type="cloud_function" jsonPayload.metric="trip_pipeline"' \
  --bucket-options="explicit-buckets=[100,500,1000,3000,5000,10000,30000]"

# Classifier call latency metric
gcloud logging metrics create classifier_call_latency \
  --project=driiva \
  --description="Stop-Go classifier HTTP call latency" \
  --log-filter='resource.type="cloud_function" jsonPayload.metric="classifier_call"' \
  --bucket-options="explicit-buckets=[100,500,1000,3000,5000,10000]"

# AI analysis cost tracking metric
gcloud logging metrics create ai_analysis_cost \
  --project=driiva \
  --description="Claude AI analysis cost and latency" \
  --log-filter='resource.type="cloud_function" jsonPayload.metric="ai_analysis"'
```

### Verification — Task 3

1. `cd functions && npm run build` — must compile.
2. Deploy and process a test trip. Check Cloud Logging in GCP Console:
   - Filter: `jsonPayload.metric="trip_pipeline"` — should show one log per trip with `pipelineMs`.
   - Filter: `jsonPayload.metric="classifier_call"` — shows classifier latency (if URL configured).
   - Filter: `jsonPayload.metric="ai_analysis"` — shows AI call metrics (if feature flag on).

---

## TASK 4: Add Vercel Analytics and Speed Insights

Driiva's frontend is deployed on Vercel, not Cloudflare. Vercel provides built-in CDN, DDoS mitigation, and performance analytics. Adding `@vercel/analytics` and `@vercel/speed-insights` gives us Web Vitals (LCP, INP, CLS), page-level latency, and geographic distribution — equivalent to the Cloudflare dashboards originally requested.

### 4A. Install packages

```bash
npm install @vercel/analytics @vercel/speed-insights
```

### 4B. Initialize in the app entry point

**File:** `client/src/main.tsx`

Add imports at the top:

```typescript
import { inject as injectVercelAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
```

After the `initSentry()` call and before `createRoot`, add:

```typescript
injectVercelAnalytics();
injectSpeedInsights();
```

These are framework-agnostic injectors that work with any React setup. They auto-detect Vercel deployments and start reporting immediately.

### Verification — Task 4

1. `npx tsc --noEmit` — must compile.
2. Deploy to Vercel. In the Vercel dashboard, go to Analytics and Speed Insights tabs — data should appear within minutes.
3. Check browser Network tab for requests to `va.vercel-scripts.com` — confirms analytics is active.

---

## TASK 5: Configure Alerting Thresholds

### 5A. Google Cloud Monitoring alert policies

Create these alert policies via gcloud CLI after functions are deployed. They use the built-in Cloud Functions metrics (no custom setup needed).

**Alert 1: Cloud Function error rate > 5% over 5 minutes**

```bash
gcloud alpha monitoring policies create \
  --project=driiva \
  --display-name="Cloud Functions Error Rate > 5%" \
  --condition-display-name="Function error rate spike" \
  --condition-filter='resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/execution_count" AND metric.labels.status!="ok"' \
  --condition-threshold-value=0.05 \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-duration=300s \
  --notification-channels=CHANNEL_ID \
  --documentation="Cloud Functions error rate exceeded 5% over 5 minutes. Check Cloud Logging for details."
```

**Alert 2: Cloud Function execution time p95 > 3 seconds**

```bash
gcloud alpha monitoring policies create \
  --project=driiva \
  --display-name="Cloud Functions Cold Start > 3s" \
  --condition-display-name="Execution time p95 spike" \
  --condition-filter='resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/execution_times"' \
  --condition-threshold-value=3000 \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-duration=300s \
  --notification-channels=CHANNEL_ID \
  --documentation="Cloud Function execution time p95 exceeded 3 seconds. Potential cold start issue."
```

**Alert 3: Firestore write errors**

```bash
gcloud alpha monitoring policies create \
  --project=driiva \
  --display-name="Firestore Write Failures" \
  --condition-display-name="Firestore write errors detected" \
  --condition-filter='resource.type="firestore_database" AND metric.type="firestore.googleapis.com/document/write_count" AND metric.labels.status!="OK"' \
  --condition-threshold-value=1 \
  --condition-threshold-comparison=COMPARISON_GE \
  --condition-threshold-duration=300s \
  --notification-channels=CHANNEL_ID \
  --documentation="Firestore write failures detected. Check Cloud Functions logs for failed trip processing."
```

**Note:** Replace `CHANNEL_ID` with the notification channel ID after creating one:

```bash
# Create email notification channel
gcloud alpha monitoring channels create \
  --project=driiva \
  --display-name="Driiva Alerts Email" \
  --type=email \
  --channel-labels=email_address=YOUR_EMAIL@example.com

# List channels to get the ID
gcloud alpha monitoring channels list --project=driiva
```

### 5B. Sentry alert rules

Configure these in the Sentry dashboard (sentry.io) for each project:

**For `driiva-functions` project:**
- Alert: "New issue" — trigger immediately on first occurrence of any new error
- Alert: "Error volume spike" — trigger when > 10 events in 10 minutes (metric alert)
- Notification: Email to team

**For `driiva-client` project:**
- Alert: "Error spike" — trigger when > 10 events in 10 minutes
- Alert: "Performance regression" — p95 transaction duration > 5s for 15 minutes
- Notification: Email to team

These are configured via Sentry UI at: `Settings > Alerts > Create Alert Rule`.

### 5C. Custom watchdog: GPS batch upload drop-off detector

**File:** Create `functions/src/scheduled/watchdog.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLECTION_NAMES } from '../types';
import { EUROPE_LONDON } from '../lib/region';
import { wrapTrigger, captureError } from '../lib/sentry';

const db = admin.firestore();

const FAILED_TRIP_THRESHOLD = 5;
const STALE_HOURS = 24;

export const monitorTripHealth = functions
  .region(EUROPE_LONDON)
  .pubsub
  .schedule('every 60 minutes')
  .timeZone('Europe/London')
  .onRun(wrapTrigger(async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const staleThreshold = new Date(now.getTime() - STALE_HOURS * 60 * 60 * 1000);

    // 1. Count failed trips in the last hour
    const failedTripsSnap = await db
      .collection(COLLECTION_NAMES.TRIPS)
      .where('status', '==', 'failed')
      .where('processedAt', '>=', admin.firestore.Timestamp.fromDate(oneHourAgo))
      .get();

    const failedCount = failedTripsSnap.size;

    if (failedCount >= FAILED_TRIP_THRESHOLD) {
      const msg = `ALERT: ${failedCount} failed trips in the last hour (threshold: ${FAILED_TRIP_THRESHOLD})`;
      functions.logger.error('[watchdog] failed_trips_spike', {
        metric: 'watchdog',
        alert: 'failed_trips_spike',
        failedCount,
        threshold: FAILED_TRIP_THRESHOLD,
      });
      captureError(msg, { failedCount, threshold: FAILED_TRIP_THRESHOLD });
    }

    // 2. Check for GPS upload drop-off (no new trips across all users for STALE_HOURS)
    const recentTripsSnap = await db
      .collection(COLLECTION_NAMES.TRIPS)
      .where('startedAt', '>=', admin.firestore.Timestamp.fromDate(staleThreshold))
      .limit(1)
      .get();

    if (recentTripsSnap.empty) {
      const msg = `WARNING: No new trips in the last ${STALE_HOURS} hours — possible GPS upload drop-off`;
      functions.logger.warn('[watchdog] no_recent_trips', {
        metric: 'watchdog',
        alert: 'no_recent_trips',
        staleHours: STALE_HOURS,
      });
      captureError(msg, { staleHours: STALE_HOURS });
    }

    // 3. Check for stuck trips (in 'processing' status for > 1 hour)
    const stuckTripsSnap = await db
      .collection(COLLECTION_NAMES.TRIPS)
      .where('status', '==', 'processing')
      .where('startedAt', '<=', admin.firestore.Timestamp.fromDate(oneHourAgo))
      .limit(10)
      .get();

    if (!stuckTripsSnap.empty) {
      const stuckIds = stuckTripsSnap.docs.map(d => d.id);
      functions.logger.warn('[watchdog] stuck_trips', {
        metric: 'watchdog',
        alert: 'stuck_trips',
        count: stuckIds.length,
        tripIds: stuckIds,
      });
      captureError(`${stuckIds.length} trips stuck in processing for > 1 hour`, {
        tripIds: stuckIds,
      });
    }

    functions.logger.info('[watchdog] health check complete', {
      metric: 'watchdog',
      failedLastHour: failedCount,
      hasRecentTrips: !recentTripsSnap.empty,
      stuckTrips: stuckTripsSnap.size,
    });
  }));
```

**File:** `functions/src/index.ts`

Add the export:

```typescript
// Monitoring watchdog
export { monitorTripHealth } from './scheduled/watchdog';
```

### 5D. Enhance the health endpoint with richer checks

**File:** `functions/src/http/health.ts`

Expand the health check to report more useful data for monitoring dashboards:

After the Firestore reachability check succeeds, before the `res.status(200).json(...)` call, add version and uptime info:

```typescript
res.status(200).json({
  status: 'healthy',
  service: 'driiva-functions',
  version: process.env.npm_package_version || '1.0.0',
  region: 'europe-west2',
  timestamp,
  checks: {
    firestore: 'ok',
  },
});
```

### Verification — Task 5

1. `cd functions && npm run build` — must compile with the new `watchdog.ts`.
2. Confirm `monitorTripHealth` is exported from `index.ts`.
3. After deploying, check GCP Console > Cloud Scheduler — the watchdog should appear as a scheduled job running every 60 minutes.
4. In Cloud Monitoring > Alerting, confirm the three alert policies exist (after running the gcloud commands).
5. In Sentry > Alerts, confirm the alert rules are created.

---

## Post-Implementation Checklist

After all 5 tasks are complete:

- [ ] `cd functions && npm run build` passes
- [ ] `npx tsc --noEmit` passes (root project)
- [ ] `npm run test` passes (existing tests still pass)
- [ ] Every `onCall` function uses `wrapFunction`
- [ ] Every Firestore trigger uses `wrapTrigger`
- [ ] Every scheduled function uses `wrapTrigger`
- [ ] `setSentryUser` is called in AuthContext on login and cleared on logout
- [ ] Firebase Performance SDK initializes in `client/src/lib/firebase.ts`
- [ ] `performanceTraces.ts` utility exists with `startTrace`/`stopTrace`
- [ ] Vercel Analytics + Speed Insights are injected in `main.tsx`
- [ ] Trip pipeline logs `[metric] trip_pipeline` with `pipelineMs`
- [ ] Classifier logs `[metric] classifier_call` with `latencyMs`
- [ ] AI analysis logs `[metric] ai_analysis` with cost data
- [ ] Watchdog function `monitorTripHealth` exists and is exported
- [ ] Health endpoint returns `version` and `checks` object

---

## ROADMAP.md Updates

After implementation, add a new section to `ROADMAP.md`:

```markdown
## Sprint: "Observation Mode" (Live Monitoring)

- [x] Complete Sentry wiring — wrapFunction/wrapTrigger on all 27 Cloud Functions; setSentryUser in AuthContext
- [x] Add Firebase Performance Monitoring — client SDK + custom trace utility
- [x] Add structured metrics logging — trip pipeline, classifier, AI analysis with [metric] tags
- [x] Add Vercel Analytics + Speed Insights — Web Vitals, page latency, geographic distribution
- [x] Configure alerting — Cloud Monitoring policies (error rate, cold start, Firestore writes), Sentry alert rules, watchdog function (failed trips, GPS drop-off, stuck trips)
```
