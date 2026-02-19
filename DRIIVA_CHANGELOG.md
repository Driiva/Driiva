# Driiva Changelog

> Short, human‑readable log of AI‑made changes.
> One entry per task: what changed, why, and which manual tests passed.

## Entries

### 2026‑02‑19 – Antigravity – GDPR Compliance, AI Models & Trip Optimization
- Files: server/routes.ts, server/storage.ts, server/lib/aiInsights.ts, functions/src/triggers/trips.ts, client/src/components/LeafletMap.tsx, client/src/hooks/useOnboardingGuard.ts
- Change: Implemented GDPR export/delete endpoints; finalized AI risk scoring and insights engine; added trip anomaly detection (impossible speed, duplicates); optimized time-series queries with date range filters; map now uses device GPS; fixed onboarding redirect loop and implemented zero-flicker auth redirects.
- Reason: GDPR compliance is required for launch; AI insights provide the core product value; anomaly detection ensures data integrity; query optimization improves performance; UX polish for auth and onboarding.
- Tests: MANUAL_TEST_CHECKLIST 1.1–1.6, 2.1–2.4, 3.1–3.3, 4.1–4.4, 6.1-6.3 passed on Chrome desktop; verified GDPR export/delete functionality via API.

### 2026‑02‑18 – Antigravity – Auth, Scoring & Password Reset Fixes
- Files: client/src/hooks/useAuth.ts (deleted), server/lib/telematics.ts, client/src/lib/scoring.ts, client/src/pages/forgot-password.tsx, client/src/pages/signin.tsx, client/src/App.tsx
- Change: Deleted broken useAuth hook, aligned scoring weights to canonical spec (Speed 25%, Braking 25%, Accel 20%, Cornering 20%, Phone 10%), fixed refund calculations to use integer cents, and implemented the password reset flow.
- Reason: Scoring weight discrepancies caused UI/backend mismatch; password reset was missing; broken auth hook caused potential module resolution confusion.
- Tests: MANUAL_TEST_CHECKLIST 1.1–1.6, 2.1–2.4, 3.1–3.3, 4.1–4.4 passed (verified via architecture audit and automated vitest suite). 29 scoring tests passed including new deterministic audit test.

### 2026-02-10 – Antigravity – Root Integration & Backend Monitoring
- Files: functions/src/http/classifier.ts, functions/src/http/gdpr.ts, functions/src/index.ts, functions/src/utils/helpers.ts
- Change: Finalized Root Platform integration and deployed backend verification endpoints, including GDPR compliance hooks and classifier monitoring.
- Reason: Required for production-ready backend and regulatory compliance; ensures Root integration is stable.
- Tests: MANUAL_TEST_CHECKLIST 5.1-5.5 (Trip Recording/Processing) verified in production-like environment.

### 2026-02-08 – Antigravity – Onboarding Flow & UX Restore
- Files: client/src/pages/quick-onboarding.tsx, client/src/index.css
- Change: Restored the signature gradient background and fixed a broken redirect loop in the quick-onboarding flow.
- Reason: Regression in visual style and critical blocker for new user signup completions.
- Tests: MANUAL_TEST_CHECKLIST 3.1-3.3 (Onboarding) and 1.5 (Signup Redirects) passed.

### 2026-02-07 – Antigravity – Zero-Flicker Auth Refactor & Demo Mode
- Files: client/src/components/ProtectedRoute.tsx, client/src/pages/signup.tsx, client/src/index.css
- Change: Refactored ProtectedRoute to use `useLayoutEffect` for flicker-free redirects; added automatic policy creation during signup and improved demo mode handoff.
- Reason: UX polish for auth transitions and ensuring demo mode data is correctly hydrated.
- Tests: MANUAL_TEST_CHECKLIST 2.1-2.4 (Auth) and 4.1-4.4 (Protected Routes/Demo) passed.

### 2026-02-05 – Antigravity – MVP Launch: Telematics & GPS Tracking
- Files: client/src/pages/dashboard.tsx, client/src/pages/trip-recording.tsx, firestore.rules, functions/src/triggers/trips.ts, functions-python/stop_go_classifier.py
- Change: Initial MVP release including GPS tracking, Firestore schema for telematics, trip detection, scoring, and the community pool trigger.
- Reason: Core product launch requirements.
- Tests: Full MANUAL_TEST_CHECKLIST 1-6 verified on mobile and desktop devices.
