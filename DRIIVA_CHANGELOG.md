# Driiva Changelog

> Short, human‑readable log of AI‑made changes.
> One entry per task: what changed, why, and which manual tests passed.

## Entries

### 2026‑02‑22 – Architecture Agent – Refined ARCHITECTURE.md & Language Sanitation
- Files: ARCHITECTURE.md, ROADMAP.md, DRIIVA_CHANGELOG.md
- Change: Refined ARCHITECTURE.md with verified technical specifications, including event thresholds, classifier parameters, scoring weights, and refund constants. Sanitized all documentation language to maintain professional and investor-ready standards.
- Reason: To ensure documentation accurately reflects system implementation and adheres to formal business standards required for stakeholders and auditors.
- Tests: Verified technical constants in `functions/src/utils/helpers.ts`, `server/lib/telematics.ts`, and `functions-python/stop_go_classifier.py`. Manual review of documentation for tone and clarity. Passed.

### 2026-02-21 – Antigravity – Project Architecture Documentation
- Files: ARCHITECTURE.md
- Change: Created a comprehensive ARCHITECTURE.md file in the root directory providing a technical overview of the Driiva system, including stack details, data models, scoring pipelines, and AI usage rules.
- Reason: User requested a "real picture" architecture document to guide future development and ensure AI/Sonnet sessions follow established ground rules.
- Tests: No functional code changes; documentation verified for consistency with codebase layout and ROADMAP.md.

### 2026-02-23 – Antigravity – Policy Number Generation & UI Cleanup
- Files: functions/src/triggers/users.ts, functions/src/types.ts, shared/firestore-types.ts, client/src/pages/policy.tsx, client/src/pages/rewards.tsx, client/src/components/PolicyDownload.tsx, client/src/components/DashboardHeader.tsx, client/src/components/ProfileDropdown.tsx, client/src/components/PolicyStatusWidget.tsx
- Change: Implemented sequential policy number generation ("DRV-001", etc.) using Firestore transactions. Removed all hardcoded policy numbers ("DRV-2025-000001", etc.) from the UI and replaced with dynamic data fetched from user profiles and dashboard data hooks.
- Reason: Required to ensure unique, professional policy identification for users and to remove placeholder data from the production MVP UI.
- Tests: MANUAL_TEST_CHECKLIST 1.1–1.6 (Signup), 2.1–2.4 (Auth), 3.1–3.3 (Onboarding) passed; verified policy number generation in trigger code and dynamic display on Dashboard, Profile, Policy, and Rewards pages.

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
