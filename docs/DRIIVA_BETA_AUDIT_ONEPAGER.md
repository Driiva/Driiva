# Driiva Beta Readiness — One-Pager

**Date:** February 2025  
**Purpose:** Share with the Driiva team before beta go-live.

---

## Summary

The app is **production-ready at the core**: real data, locked-down security, working trip recording and scoring, GDPR in place, and a solid UI. The main blocker is **deployment** — backend and rules are not yet live. A short list of fixes and a clear deploy sequence will get beta out the door.

---

## What’s Ready

- **Real data:** Dashboard, trips, pool, leaderboard all read from Firestore in real time (no fake data).
- **Trip recording:** GPS at 1 Hz, streaming to Firestore, start/pause/stop, permission handling, live stats.
- **Scoring:** Deterministic 0–100 algorithm (speed, braking, acceleration, cornering, phone placeholder). Same inputs → same score.
- **Security:** Firestore rules restrict users to their own data; scores/events writable only by Cloud Functions.
- **GDPR:** Full data export and account deletion implemented and ownership-checked.
- **Monitoring:** Sentry on client and Cloud Functions; CI runs lint, build, and 100+ tests on every push.
- **Auth:** Email verification, password reset, protected routes, demo mode separated from real auth.

---

## Must-Fix Before Beta

| Item | Action |
|------|--------|
| **Nothing deployed** | Deploy Cloud Functions, Firestore rules, and indexes (see checklist below). |
| **No rate limiting** | Acceptable for small beta; plan rate limits for GDPR/classifier/admin before scaling. |
| **Profile page** | Replace hardcoded insurance copy (“Comprehensive Plus”, £1,840, excesses) with real data or “Coming soon”. |
| **AuthContext** | It calls `/api/profile/me` (Express). If you’re Firebase Hosting + Functions only, this 404s; ensure fallback to Firestore is the path used in prod. |
| **TripRecorder mock** | `TripRecorder.tsx` has a mock `flushToFirestore`; ensure the live flow uses the real `TripPointStreamer` only. |

---

## Deploy Checklist (in order)

1. `firebase login` and authenticate.  
2. Set secrets: `firebase functions:secrets:set ANTHROPIC_API_KEY`.  
3. Set production `VITE_FIREBASE_*` env vars for the client build.  
4. `firebase deploy --only firestore:rules`  
5. `firebase deploy --only firestore:indexes`  
6. `firebase deploy --only functions`  
7. Build client: `npm run build` and deploy hosting.  
8. **Smoke test:** Sign up → onboarding → record one trip → see score and dashboard.

---

## Not Wired Yet (OK for beta)

Stripe, Root Platform, push notifications, trip route on map, achievements backend, and leaderboard rank recalculation are not fully wired. Fine for a data-collection beta; plan for post-beta.

---

## Bottom Line

Core product, security, and data flows are in good shape. **Deploy backend and rules, fix the profile copy and auth fallback, then run the deploy checklist.** After that, you’re ready for a controlled beta with a known group of testers.
