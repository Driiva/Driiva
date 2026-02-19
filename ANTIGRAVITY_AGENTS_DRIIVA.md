# Driiva — Antigravity Agent Playbook
### Built from DRIIVA_COMPLETE_CODE.md + TECH_ROADMAP.md · Feb 2026

> Paste each workspace name, pinned rule, and agent prompt directly into Antigravity.
> Agents are ordered by dependency — run 1 before 2, 2 before 3, etc.

---

## Global Rules (add to every workspace)

```
- Stack: React 18 + TypeScript + Vite + Tailwind + Wouter + TanStack Query + Firebase Auth + Firestore + Cloud Functions (Node.js) + Anthropic Claude Sonnet 4.
- Routing: Wouter only. Never introduce React Router or any other router.
- Auth: Firebase Authentication is the source of truth. Never use localStorage as the primary auth store — it is a cache only.
- Canonical trip metrics: shared/tripProcessor.ts for distance (metres) and duration (seconds). Never duplicate this logic.
- Financials: integer cents everywhere. No floats crossing service boundaries. £1.84 = 184.
- Scoring is deterministic: same GPS inputs → same score. Do not mutate historical trip data after creation.
- No hardcoded API keys. Secrets live in Firebase secrets (functions config) or .env files.
- Keep diffs minimal. Never add a framework, library, or file that doesn't already exist in the project without a comment explaining why.
- Before closing any ticket that touches auth, onboarding, scoring, or trip recording: re-run the relevant MANUAL_TEST_CHECKLIST.md steps and include a pass/fail table in your final message.
```

---

## Workspace 1 — Auth Layer Repair

**Workspace name:** `Driiva – Auth Layer`

**Pinned rule:**
```
Firebase Auth is the only auth source of truth. AuthContext.tsx must subscribe to onAuthStateChanged, not read from localStorage. The User type must match Firebase's auth.currentUser shape, not the legacy {id: number, username: string} shape.
```

### Agent 1 · Fix the Auth Stack Root-to-Tip

**Why this is Agent 1:** Every other agent depends on a working, Firebase-backed auth context. The current code has three bugs that will cascade:

1. `client/src/contexts/AuthContext.tsx` — the `User` interface is a custom type `{ id: number, username: string, firstName, lastName, email, premiumAmount }`. It has no Firebase UID. Auth state is written to and read from `localStorage` directly, meaning a page refresh before `onAuthStateChanged` fires will flicker or misroute.
2. `client/src/hooks/useAuth.ts` — imports `{ AuthContext }` as a named export from `../contexts/AuthContext`, but `AuthContext` is **not exported** from that file (only `AuthProvider` and `useAuth` are). This will throw a module error at runtime.
3. `client/src/App.tsx` — the `<Switch>` has no protected route wrapper. `/dashboard`, `/trips`, `/profile`, `/trip-recording`, `/leaderboard`, `/policy` are all reachable without being signed in. MANUAL_TEST_CHECKLIST step 4.1 will fail.

**Prompt:**
```
You are working on the Driiva MVP.

Read first: CLAUDE.md, client/src/contexts/AuthContext.tsx, client/src/hooks/useAuth.ts, client/src/App.tsx.

KNOWN BUGS TO FIX (in this order):

Bug 1 — useAuth.ts broken import
client/src/hooks/useAuth.ts imports { AuthContext } from '../contexts/AuthContext' but that named export doesn't exist. AuthContext.tsx only exports AuthProvider and useAuth. Fix: either export AuthContext from AuthContext.tsx, or delete hooks/useAuth.ts entirely and have all callers import useAuth from contexts/AuthContext.tsx. Use whichever approach is already more common in the codebase.

Bug 2 — AuthContext uses localStorage as primary auth, not Firebase
The current AuthProvider reads from localStorage on mount and ignores Firebase's onAuthStateChanged. This means:
  - Users who have a valid Firebase session won't be recognised until they log in again
  - The User type { id: number, username, firstName, lastName, premiumAmount } doesn't include a Firebase UID
Fix: Rewrite AuthProvider to:
  a. Subscribe to firebase.auth().onAuthStateChanged in useEffect
  b. On sign-in, fetch the user's Firestore document at users/{uid} to get profile fields
  c. Expose { firebaseUser, firestoreProfile, isAuthenticated, isLoading } — do not store the full profile in localStorage; let onAuthStateChanged re-hydrate on refresh
  d. Keep the login() / logout() surface so callers don't all need to change

Bug 3 — No protected route guard in App.tsx
Add a ProtectedRoute component (or inline guard — match whatever pattern is already in the file) that:
  - Shows a loading spinner while isLoading = true
  - Redirects to /signin if isAuthenticated = false
  - Wraps: /dashboard, /trips, /profile, /trip-recording, /leaderboard, /policy, /rewards
  - Leaves /signin and / unguarded

After implementing:
1. Run MANUAL_TEST_CHECKLIST.md steps 2.1–2.4 (auth) and 4.1–4.4 (protected routes)
2. Provide pass/fail table
3. Show the final diff — keep it tight, no refactors beyond what's listed above
```

---

## Workspace 2 — Scoring Consistency Audit

**Workspace name:** `Driiva – Scoring`

**Pinned rule:**
```
There is one canonical scoring path for production: functions/src/utils/helpers.ts → computeTripMetrics() → computeDrivingScore(). The client-side lib/scoring.ts is for UI simulation only (RefundSimulator). Never use lib/scoring.ts as a source of truth for stored scores. Weights must be consistent: Speed 25%, Braking 25%, Acceleration 20%, Cornering 20%, Phone 10%.
```

### Agent 2 · Reconcile the Three Scoring Implementations

**Why this matters:** There are currently three different scoring implementations with different weights. They will produce different numbers for the same trip.

| File | Weights (as found in code) |
|------|---------------------------|
| `client/src/lib/scoring.ts` | hardBraking 30%, acceleration 25%, speed 35%, night 10% |
| `server/lib/telematics.ts` | braking, accel, speed, cornering, night (unknown weights — needs audit) |
| `functions/src/utils/helpers.ts` | Speed 25%, Braking 25%, Acceleration 20%, Cornering 20%, Phone 10% ← **canonical per CLAUDE.md** |

Also: `client/src/lib/scoring.ts calculateRefund()` returns `refundAmount` as a float (e.g. `100.80`). Financials must be integer cents.

**Prompt:**
```
You are working on the Driiva MVP.

Read first: CLAUDE.md, client/src/lib/scoring.ts, server/lib/telematics.ts, functions/src/utils/helpers.ts.

TASK: Audit and reconcile all scoring implementations so there is one canonical truth.

Step 1 — Audit
Open all three files and extract:
  a. The exact weight percentages for each scoring component
  b. The refund eligibility threshold
  c. The refund rate formula (what does score 70 produce? score 100?)
  d. Whether financial outputs are in integer cents or floats

Document your findings as a table: File | Component | Weight | Refund threshold | Output format.

Step 2 — Identify discrepancies
Per CLAUDE.md, canonical weights are:
  Speed 25%, Braking 25%, Acceleration 20%, Cornering 20%, Phone 10%
  Eligibility: score ≥ 70
  Refund rate: 5% at 70 → 15% at 100
  All financials: integer cents

Flag every file that differs from this.

Step 3 — Propose fixes (get my sign-off before implementing)
For each discrepancy, propose the minimal change. Rules:
  - functions/src/utils/helpers.ts is the canonical backend — align server/lib/telematics.ts to match it, do NOT change helpers.ts
  - client/src/lib/scoring.ts is UI-only (used by RefundSimulator for display). It can keep its own simplified model BUT must produce results within ±5% of the canonical backend for the same inputs. Add a comment at the top of scoring.ts: "UI simulation only — not used for stored scores."
  - Fix calculateRefund() in scoring.ts to return refundAmount in integer cents (multiply by 100, Math.round), and update RefundSimulator.tsx to divide by 100 for display

Step 4 — Implement after approval
After my sign-off: implement, then write one deterministic test for calculateRefund() with known inputs:
  Input: score=85, premium=£1840 (184000 cents), safetyFactor=0.85
  Expected: qualifiesForRefund=true, refundAmount in integer cents (calculate the expected value first and document it)
```

---

## Workspace 3 — Dashboard & Data Wiring

**Workspace name:** `Driiva – Dashboard`

**Pinned rule:**
```
The dashboard must read from Firestore (users/{uid} and trips/{tripId}) via TanStack Query hooks, not hardcoded mock objects. The communityPool singleton lives in Firestore at the 'communityPool' document. Demo mode is the only acceptable use of mock data.
```

### Agent 3 · Replace Mock Data with Real Firestore Reads

**Why this matters:** `client/src/pages/dashboard.tsx` defines all data as hardcoded `const` objects (userData, userProfile, communityPool, achievementsData, leaderboardData). The fix applied was to make the variable names consistent — but the data is still fake. Real users will see "Test Driver" with score 72 and £105k pool regardless of who they are.

**Specific mock objects to replace:**

| Variable | Current value | Should come from |
|----------|---------------|------------------|
| `userData` | `{ id: 8, username: "driiva1", email: "test@driiva.com" }` | Firebase `auth.currentUser` + `users/{uid}` Firestore doc |
| `userProfile` | `{ currentScore: 72, projectedRefund: 100.80, totalMiles: 1107.70 }` | `users/{uid}.drivingProfile` in Firestore |
| `communityPool` | `{ poolAmount: 105000, safetyFactor: 0.85 }` | `communityPool` singleton doc in Firestore |
| `achievementsData` | 2 hardcoded achievements | `users/{uid}.achievements` or achievements subcollection |
| `leaderboardData` | 1 hardcoded rank-1 entry | `leaderboard/weekly` Firestore doc |

**Prompt:**
```
You are working on the Driiva MVP.

Read first: CLAUDE.md, client/src/pages/dashboard.tsx, client/src/contexts/AuthContext.tsx (after Agent 1 has run).

TASK: Replace all hardcoded mock objects in dashboard.tsx with real Firestore reads via TanStack Query.

Firestore schema (from CLAUDE.md):
  - users/{uid} → drivingProfile (score, totalTrips, totalMiles, totalDrivingMinutes, scoreBreakdown)
  - communityPool → singleton doc (poolAmount, safetyFactor, participantCount, safeDriverCount, averageScore)
  - leaderboard/{period} → precomputed rankings (weekly / monthly / all_time)
  - users/{uid}.recentTrips[] → array of recent trip summaries

Steps:
1. Check if Firestore query hooks already exist in the codebase (search for useQuery, useCollection, or any firebase query wrappers in client/src/hooks/ or client/src/lib/). List what you find.
2. If hooks exist, use them. If not, create minimal hooks using the existing firebase client setup:
   - useUserProfile(uid) → reads users/{uid}
   - useCommunityPool() → reads communityPool singleton
   - useLeaderboard(period: 'weekly'|'monthly'|'all_time') → reads leaderboard/{period}
3. In dashboard.tsx, replace each hardcoded const with the corresponding hook. While isLoading=true, show skeleton/loading state. On error, show an error message — do not silently fall back to mock data (that hides bugs).
4. Add a DEV_MOCK flag (reads from VITE_USE_MOCK_DATA env var) so we can restore mock data locally if Firestore is unavailable. Default: false.
5. Keep demo mode (if it exists) using its own mock data path — don't break it.

After implementing:
- Navigate to /dashboard as a real signed-in user and confirm real data appears
- Run MANUAL_TEST_CHECKLIST.md section 6.2 (community pool /policy) and confirm pool data is real
- Include a pass/fail table
```

---

## Workspace 4 — Trip Recording & Processing

**Workspace name:** `Driiva – Trip Recording`

**Pinned rule:**
```
Distance and duration come from shared/tripProcessor.ts only. Demo mode must never write to Firestore. The 25-second timeout error must fire if recording hangs. Phone usage detection score component currently hardcodes 100 — do not change this yet, just document it clearly with a TODO comment.
```

### Agent 4 · Trip Recording End-to-End

**Known issues to investigate:**

1. `trips/{tripId}` status field has enum: `recording | processing | completed | failed | disputed`. The "Starting Trip..." → "Recording" transition in the UI needs to match the Firestore `status` field being set to `recording`.
2. GPS `tripPoints/{tripId}` stores `spd` as m/s × 100 (integer). Verify the recording page isn't passing raw m/s floats.
3. After Stop Trip: the Cloud Function trigger at `functions/src/triggers/trips.ts → updateDriverProfileAndPoolShare()` must fire. If Cloud Functions aren't deployed yet, the score won't update.
4. Demo mode: must record locally, never call Firestore. Check `client/src/pages/trip-recording.tsx` for the demo guard.

**Prompt:**
```
You are working on the Driiva MVP.

Read first: CLAUDE.md, client/src/pages/trip-recording.tsx, shared/tripProcessor.ts, functions/src/triggers/trips.ts.

TASK: Make MANUAL_TEST_CHECKLIST.md steps 5.1–5.6 pass.

Step 1 — Trace the recording flow
Follow the code path from "Start Trip" button click to Firestore write:
  a. What sets trips/{tripId}.status = 'recording'?
  b. What writes to tripPoints/{tripId}? Is spd stored as Math.round(speed_ms * 100)?
  c. On "Stop Trip": what sets status = 'completed'? What triggers scoring?
  d. Is there a 25-second timeout? Where is it implemented?
  e. Demo mode: search for 'demo' or 'isDemoMode' — is there a Firestore write guard?

Document each answer with the exact file and line number.

Step 2 — Log checklist results
Run steps 5.1–5.6. For each failure, record: Step | Expected | Actual | File + line where the bug is.

Step 3 — Propose fixes
For each bug found, propose the minimal fix. Flag anything that can't be fixed without Cloud Functions being deployed (mark those as BLOCKED: needs deploy).

Step 4 — Implement non-blocked fixes
Implement only fixes that don't require Firebase deployment. For blocked items, add a visible error message to the UI: "Trip scoring requires backend deployment — contact your admin." so it doesn't silently fail.

Step 5 — Phone usage detection
Find the phone usage score component. Confirm it returns a hardcoded 100. Add a TODO comment:
// TODO: Implement real phone pickup detection (accelerometer pattern recognition)
// Currently hardcoded to 100 (no penalty) — weight is 10% per CLAUDE.md scoring spec
Do NOT implement the detection logic — that's a future sprint item.

Final output: pass/fail table for steps 5.1–5.6 + list of BLOCKED items.
```

---

## Workspace 5 — Sprint 1 Ops Tickets

**Workspace name:** `Driiva – Sprint Runner`

**Pinned rule:**
```
Work on the next unchecked item in ROADMAP.md only. Never skip ahead or batch tickets. Update the checkbox immediately when done. Surface blockers (e.g. missing credentials) as explicit BLOCKED flags rather than working around them silently.
```

### Agent 5 · Close Sprint 1 Ops Tickets

**Current Sprint 1 unchecked tickets (from TECH_ROADMAP.md):**
1. Create Anthropic account and set API key as Firebase secret
2. `firebase login` and authenticate
3. Deploy Cloud Functions (`firebase deploy --only functions`)
4. Deploy Firestore rules and indexes
5. Contact Root Platform for sandbox credentials
6. Fix CORS (restrict to driiva.com) — note: CLAUDE.md says this is done via `CORS_ORIGINS` env var
7. Add password reset flow
8. Test full flow: signup → onboarding → record trip → see score → see AI insights

**Prompt:**
```
You are working on the Driiva MVP. Read CLAUDE.md and ROADMAP.md first.

TASK: Work through Sprint 1 ("Make It Real") tickets one at a time.

TICKET 1 — Anthropic API key setup
This is an ops step. Do not write code. Instead, output:
  a. The exact URL to create the key: console.anthropic.com
  b. The Firebase CLI command to set it as a secret:
     firebase functions:secrets:set ANTHROPIC_API_KEY
  c. The function config path where Cloud Functions read it (check functions/src/ for existing usage)
  d. Confirm the feature flag env var name: FEATURE_AI_INSIGHTS (server) / VITE_FEATURE_AI_INSIGHTS (client)

TICKET 2 — firebase login
Output the exact sequence:
  npm install -g firebase-tools (if not installed)
  firebase login
  firebase use --add  (to select the project)
  firebase projects:list  (to confirm the right project is selected)

TICKET 3 — Deploy Cloud Functions
Output the exact commands and the expected output. Note any known build errors that were fixed in the latest sprint (per TECH_ROADMAP.md: "Two code errors were preventing the entire backend from being deployed — both are now fixed").
  firebase deploy --only functions
If the deploy fails, capture the full error and diagnose which function is broken.

TICKET 4 — Deploy Firestore rules and indexes
  firebase deploy --only firestore:rules
  firebase deploy --only firestore:indexes
Verify the rules file is at firestore.rules and the indexes file is at firestore.indexes.json in the repo root.

TICKET 5 — CORS check
CLAUDE.md says CORS is fixed: server uses CORS_ORIGINS env var, no wildcard, set to driiva.com in prod.
Verify this is actually true: open server/index.ts or server/routes.ts and confirm the CORS middleware reads from process.env.CORS_ORIGINS and does NOT have a '*' fallback. If the '*' fallback exists, remove it and set CORS_ORIGINS=https://driiva.com,http://localhost:5000.

TICKET 6 — Password reset flow
Implement Firebase password reset in client/src/pages/signin.tsx (or a new /forgot-password page if that pattern already exists):
  a. Add a "Forgot password?" link on the sign-in form
  b. Route to /forgot-password
  c. Form: email input + submit button
  d. On submit: call firebase.auth().sendPasswordResetEmail(email)
  e. On success: show "Check your inbox" message
  f. On error (user not found, invalid email): show specific error, not generic
  Keep UI consistent with existing glass-morphism / Tailwind styles.

After each ticket: mark it [x] in ROADMAP.md and confirm completion before moving to the next.
```

---

## Workspace 6 — Make It Safe (Sprint 2)

**Workspace name:** `Driiva – Security & CI`

**Pinned rule:**
```
No security shortcuts. Rate limits already exist (Auth: 5/15min, API: 100/15min, Webhooks: 10/min) — do not reduce them. Sentry DSN must be set as an env var, never hardcoded. Content Security Policy must not use 'unsafe-inline' except where strictly required by Leaflet or Firebase SDK.
```

### Agent 6 · Sentry + CSP + GitHub Actions

**Known starting state from TECH_ROADMAP.md:**
- Sentry: not set up (frontend or Cloud Functions)
- CSP headers: none
- GitHub Actions: none
- Email verification: missing — users can sign up with unverified emails
- Firebase Analytics: dependency exists, not initialised

**Prompt:**
```
You are working on the Driiva MVP. Read CLAUDE.md and TECH_ROADMAP.md (Sprint 2) first.

TASK: Implement Sprint 2 safety and monitoring tickets. Work in this order:

TICKET 1 — Sentry (frontend)
  a. Check if @sentry/react is already in package.json. If not: npm install @sentry/react @sentry/tracing
  b. Initialise in client/src/main.tsx BEFORE the React render call:
     Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, environment: import.meta.env.MODE, tracesSampleRate: 0.1 })
  c. Wrap the ErrorBoundary in main.tsx with Sentry.ErrorBoundary (keep the existing custom ErrorBoundary as inner fallback)
  d. Add VITE_SENTRY_DSN to .env.example with a placeholder value

TICKET 2 — Sentry (Cloud Functions)
  a. In functions/, check if @sentry/node is in functions/package.json
  b. Add Sentry.init() at the top of functions/src/index.ts using SENTRY_DSN from Firebase secrets
  c. Wrap each Cloud Function handler's main try/catch to call Sentry.captureException(error)
  d. Do NOT add Sentry to every function individually — find the shared error handler and instrument there

TICKET 3 — Content Security Policy
  Add CSP headers in server/index.ts (or the Vite config for dev):
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' https://*.firebaseapp.com https://*.firebase.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.anthropic.com wss://*.firebaseio.com;
    img-src 'self' data: https://*.openstreetmap.org;
    style-src 'self' 'unsafe-inline';
  Note: 'unsafe-inline' for styles is required by Leaflet/Tailwind. Document this with a comment.
  Test: open browser DevTools → Network → check response headers on any page load.

TICKET 4 — Email verification
  After Firebase Auth createUserWithEmailAndPassword() in the signup flow:
    await user.sendEmailVerification()
  Gate dashboard access: in the ProtectedRoute component (from Agent 1), add:
    if (firebaseUser && !firebaseUser.emailVerified) redirect to /verify-email
  Build a simple /verify-email page: "Check your inbox. [Resend email] button"
  Skip email verification gate for Google Sign-In (Google accounts are pre-verified).

TICKET 5 — GitHub Actions CI
  Create .github/workflows/ci.yml:
    Trigger: push to main, PR to main
    Jobs:
      1. lint-and-typecheck: npm run lint && npx tsc --noEmit
      2. build: npm run build
      3. functions-build: cd functions && npm run build
    Use ubuntu-latest, node 20
    Cache node_modules with actions/cache
  Do NOT add a deploy job yet — deployment is manual until staging is set up.

TICKET 6 — Firebase Analytics init
  In client/src/main.tsx or a new client/src/lib/analytics.ts:
    import { getAnalytics } from 'firebase/analytics'
    export const analytics = getAnalytics(firebaseApp)
  Wrap in try/catch — Analytics throws in some environments (SSR, ad blockers).
  Add VITE_FIREBASE_MEASUREMENT_ID to .env.example.

After all tickets: provide a summary table (Ticket | Done | Notes | Any manual steps needed).
```

---

## Quick Reference — Agent Dependency Order

| # | Workspace | Depends on | Goal |
|---|-----------|------------|------|
| 1 | Auth Layer | nothing | Firebase onAuthStateChanged, fix useAuth import, add route guards |
| 2 | Scoring | nothing | One canonical scoring formula, financials in integer cents |
| 3 | Dashboard | Agent 1 (auth hooks) | Replace all hardcoded mock data with Firestore reads |
| 4 | Trip Recording | Agent 1 + deploy | E2E trip flow: record → process → score → list |
| 5 | Sprint 1 Ops | Agent 1 | Deploy functions, CORS, password reset, API key setup |
| 6 | Security & CI | Agent 5 (deploy) | Sentry, CSP, GitHub Actions, email verification, Analytics |

---

## Key File Map (for quick navigation)

```
client/src/
  App.tsx                          — Router, QueryClient, AuthProvider wrapper
  main.tsx                         — Error boundary, React root
  contexts/AuthContext.tsx         — Auth state (needs Firebase onAuthStateChanged)
  hooks/useAuth.ts                 — BROKEN: imports non-exported AuthContext
  pages/dashboard.tsx              — All mock data lives here (needs Firestore)
  pages/trip-recording.tsx         — GPS recording, Start/Stop, demo guard
  pages/signin.tsx                 — Login form (needs password reset link)
  lib/scoring.ts                   — UI-only scoring sim (weights differ from canonical)
  components/RefundSimulator.tsx   — Uses scoring.ts, displays refund projection
  components/CommunityPool.tsx     — Displays communityPool data (currently mock)

functions/src/
  utils/helpers.ts                 — CANONICAL scoring: computeTripMetrics(), computeDrivingScore()
  triggers/trips.ts                — updateDriverProfileAndPoolShare() (fires on trip complete)
  http/classifier.ts               — Calls Python Stop-Go-Classifier via CLASSIFIER_URL

server/
  index.ts                         — Express server, CORS middleware (check for * wildcard)
  lib/telematics.ts                — TelematicsProcessor (weights may differ from canonical)

shared/
  tripProcessor.ts                 — CANONICAL distance/duration calculations

firestore.rules                    — Firestore security rules (needs deploy)
firestore.indexes.json             — Composite indexes (needs deploy)
```

---

*Generated Feb 2026 · Keep alongside CLAUDE.md and ROADMAP.md in repo root.*
*Next review: after Sprint 2 closes.*
