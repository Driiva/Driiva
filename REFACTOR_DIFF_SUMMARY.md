# Trip duration & distance refactor — diff summary

**Goal:** Standardize how trip duration and distance are calculated across all trip-related code. Single source of truth: **`shared/tripProcessor.ts`**.

---

## New file

- **`shared/tripProcessor.ts`**
  - `haversineMeters(lat1, lng1, lat2, lng2)` — Haversine between two points, meters.
  - `tripDistanceMeters(points[])` — Sum of Haversine over consecutive points, meters.
  - `tripDurationSeconds(points[])` — Last timestamp − first timestamp, seconds (min 1 when ≥2 points).
  - `tripDistanceAndDuration(points[])` — Returns `{ distanceMeters, durationSeconds }`.

All use WGS84; distance in meters; duration in seconds.

---

## Server (`server/lib/telematics.ts`)

- **Imports:** `haversineMeters`, `tripDistanceMeters`, `tripDurationSeconds` from `../../shared/tripProcessor.js`.
- **`calculateDistanceKm`:** Now uses `tripDistanceMeters(points)` then divides by 1000 for km. No longer uses private `haversineDistanceKm`.
- **`calculateDuration`:** Now uses `tripDurationSeconds(points)` then divides by 60 for minutes. Same first–last timestamp rule.
- **`calculateAverageSpeedKmh`:** Duration now from `tripDurationSeconds` (shared).
- **`calculateMaxSpeedKmh`:** Segment distances now from `haversineMeters(...)/1000` (shared).
- **`detectAnomalies`:** Impossible-speed and GPS-jump segment distances now from `haversineMeters(...)/1000`.
- **`extractSpeedFromGPS`:** Segment distances now from `haversineMeters(...)/1000`.
- **Removed:** Private `haversineDistanceKm`, `haversineDistance`, `toRadians`.

Behavior: Distance and duration formulas are unchanged (Haversine R=6371e3 m, first–last duration); only the implementation is centralized in `shared/tripProcessor.ts`.

---

## Functions (`functions/src/utils/helpers.ts`)

- **No code change.** `calculateDistance` and `computeTripMetrics` (duration = last−first, distance = sum of Haversine) already match `shared/tripProcessor.ts`.
- **Comment added:** States that the canonical source is `shared/tripProcessor.ts` and that this implementation must stay in sync.

(Functions do not import from `shared/` today to avoid build/config changes; formulas are documented as shared.)

---

## Summary table

| Location | Distance | Duration |
|----------|----------|----------|
| **Source of truth** | `shared/tripProcessor.ts` | `shared/tripProcessor.ts` |
| **Server** | Uses shared (`tripDistanceMeters`, `haversineMeters`) | Uses shared (`tripDurationSeconds`) |
| **Functions** | Same formula in `helpers.ts` (documented sync) | Same formula in `computeTripMetrics` |

All trip-related distance and duration calculations now derive from the same definitions (meters, seconds; Haversine; first–last time window).
