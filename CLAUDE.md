# Driiva — AI session context

**For every Sonnet session in the repo, start with:**  
*"Read CLAUDE.md and ROADMAP.md. Work on the next unchecked ticket only, and update the ticket list when done."*

---

## Stack


| Layer                    | Technology                                                                      |
| ------------------------ | ------------------------------------------------------------------------------- |
| Frontend                 | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Wouter, TanStack Query |
| Maps                     | Leaflet (OpenStreetMap)                                                         |
| Auth                     | Firebase Authentication (email/password + Google)                               |
| Database                 | Cloud Firestore (NoSQL, real-time)                                              |
| Backend                  | Firebase Cloud Functions (Node.js 20)                                           |
| AI                       | Anthropic Claude Sonnet 4 (trip analysis); feature-flagged                      |
| Insurance API            | Root Platform (scaffolded; needs credentials)                                   |
| Payments                 | Stripe (deps installed, not wired)                                              |
| Trip metrics (canonical) | `shared/tripProcessor.ts` — distance (m), duration (s)                          |
| Trip classifier          | Python Stop-Go-Classifier (functions-python); HTTP from TypeScript functions    |


---

## Firebase schema (Firestore)

- **users/{userId}** — Driver profile, `drivingProfile` (score, totalTrips, totalMiles, totalDrivingMinutes, scoreBreakdown), `activePolicy`, `poolShare`, `recentTrips[]`, `fcmTokens`, `settings`, `createdBy`/`updatedBy`.
- **trips/{tripId}** — `userId`, `startedAt`/`endedAt`, `durationSeconds`, `startLocation`/`endLocation` (lat, lng, address, placeType), `distanceMeters`, `score`, `scoreBreakdown`, `events` (hardBraking, hardAcceleration, speedingSeconds, sharpTurnCount, phonePickupCount), `anomalies`, `status` (recording|processing|completed|failed|disputed), `context`, `pointsCount`, optional `segmentation` (classifier).
- **tripPoints/{tripId}** — Raw GPS: `points[]` with `t` (offset ms), `lat`, `lng`, `spd` (m/s×100), `hdg`, `acc`; optional `ax/ay/az`, `gx/gy/gz`. Batches for long trips under `tripPoints/{tripId}/batches/{batchIndex}`.
- **policies/{policyId}** — Policy metadata, Root sync.
- **communityPool** — Singleton pool state.
- **poolShares/{period_userId}** — Per-driver pool share per period; status active/finalized/paid_out.
- **leaderboard/{period}** — Precomputed rankings (weekly/monthly/all_time).
- **tripSegments/{tripId}** — Classifier output: stops, trip segments, samples (driving vs dwelling).

---

## Trip classifier (real driving vs walking/dwelling)

- **Role:** Distinguish *stops* (dwelling, e.g. walking/parked) from *trips* (real driving segments) in a raw GPS trace.
- **Implementation:** Python Stop-Go-Classifier in `functions-python/stop_go_classifier.py` (Spang et al.; FOSS4G). TypeScript calls it via HTTP in `functions/src/http/classifier.ts` (config: `CLASSIFIER_URL` / `classifier.url`).
- **Input:** Planar (x, y) coordinates and timestamps (lat/lng converted to local meters). Min ~23 points.
- **Methods used:** Motion score, rectangle-distance ratio (RDR), bearing analysis, start–end distance (SEDA), intersecting segments (ISA). Thresholds: min stop interval 63s, relevant stop duration 178s, distance/time between stops, etc.
- **Output:** `stops[]`, `trips[]` (start/end time, duration), `samples[]` (per-point label, `is_stop`). Stored in Firestore in `tripSegments/{tripId}` and optionally on `trips/{tripId}.segmentation`.

---

## Scoring

- **Driving score:** 0–100 composite. Weights: Speed 25%, Braking 25%, Acceleration 20%, Cornering 20%, Phone 10% (placeholder).
- **Computation (Firebase path):** `functions/src/utils/helpers.ts` — `computeTripMetrics()` from `tripPoints` → `computeDrivingScore()` using events (hard braking/accel, speeding seconds, sharp turns). Events from `detectDrivingEvents()` (thresholds: e.g. -3.5 m/s² braking, 3.0 m/s² accel, 31.3 m/s speed limit).
- **Server path:** `server/lib/telematics.ts` — `TelematicsProcessor.processTrip()`: distance/duration from GPS (aligned with `shared/tripProcessor.ts`), braking/accel/speed/cornering/night from sensors, anomaly penalty applied to score.
- **Deterministic:** Same inputs → same score; no modification of historical trip data after creation.

---

## Refund pool logic

- **Eligibility:** Personal score ≥ 70.
- **Formula (server):** `server/lib/telematics.ts` `calculateRefund()` — 80% personal / 20% community (75) weighted score; refund rate 5% at 70 → 15% at 100; × pool safety factor; refund ≤ premium × max rate.
- **Functions:** `functions/src/utils/helpers.ts` — `calculateProjectedRefund(score, contributionCents, safetyFactor, refundRate)`; pool period helpers `getCurrentPoolPeriod()`, `getShareId()`. `functions/src/triggers/trips.ts` — `updateDriverProfileAndPoolShare()`: updates user `drivingProfile`, pool share doc; all financial amounts in integer cents.

---

## Current roadmap

- See **ROADMAP.md** for the current sprint and ticket list (external memory; update when closing tickets).

---

## Conventions

- TypeScript strict; async/await; no hardcoded API keys; env vars only.
- Numeric: distance in meters (canonical), duration in seconds; financials in integer cents.
- Timestamps: ISO 8601 where applicable.
- Audit: `created_by` / `updated_by` (and Firestore `createdBy`/`updatedBy`) on sensitive or financial data.

