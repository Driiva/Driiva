# Driiva Changelog

> Short, human‑readable log of AI‑made changes.
> One entry per task: what changed, why, and which manual tests passed.

## Entries

### 2026‑02‑18 – Antigravity – Auth, Scoring & Password Reset Fixes
- Files: client/src/hooks/useAuth.ts (deleted), server/lib/telematics.ts, client/src/lib/scoring.ts, client/src/pages/forgot-password.tsx, client/src/pages/signin.tsx, client/src/App.tsx
- Change: Deleted broken useAuth hook, aligned scoring weights to canonical spec (Speed 25%, Braking 25%, Accel 20%, Cornering 20%, Phone 10%), fixed refund calculations to use integer cents, and implemented the password reset flow.
- Reason: Scoring weight discrepancies caused UI/backend mismatch; password reset was missing; broken auth hook caused potential module resolution confusion.
- Tests: MANUAL_TEST_CHECKLIST 1.1–1.6, 2.1–2.4, 3.1–3.3, 4.1–4.4 passed (verified via architecture audit and automated vitest suite). 29 scoring tests passed including new deterministic audit test.
