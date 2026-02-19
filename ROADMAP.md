# Driiva — Current sprint (tickets)

**External memory for AI sessions:** Work on the next unchecked ticket only; update this list when done.

---

## Sprint: "Make It Real" (Week 1–2)

*If you’ve already done keys, Firebase login, deploy, or Root contact, check those off.*

- [ ] Create Anthropic account and set API key as Firebase secret
- [ ] Run `firebase login` and authenticate
- [ ] Deploy Cloud Functions (`firebase deploy --only functions`)
- [ ] Deploy Firestore rules and indexes
- [ ] Contact Root Platform for sandbox credentials
- [x] Fix CORS (restrict to driiva.com) — *done: server uses `CORS_ORIGINS` env, no wildcard; set to driiva.com in prod*
- [x] Add password reset flow — *done: /forgot-password page + "Forgot password?" link in signin + route registered in App.tsx*
- [ ] Test full flow: signup → onboarding → record trip → see score → see AI insights

## Sprint: "Make It Safe" (Week 3–4)

- [x] Set up Sentry for error monitoring (frontend + Cloud Functions) — *done: client/src/lib/sentry.ts + functions/src/lib/sentry.ts; SentryErrorBoundary in main.tsx; wrapFunction/wrapTrigger helpers*
- [x] Add Content Security Policy headers — *done: added to server/middleware/security.ts securityHeaders; 'unsafe-inline' for style-src documented (required by Tailwind/Leaflet)*
- [x] Set up GitHub Actions CI/CD pipeline — *done: .github/workflows/ci.yml; jobs: lint-and-typecheck, build (client+server), functions-build, test; triggers on push/PR to main*
- [x] Write first batch of tests (auth flow, scoring algorithm, trip processing) — *done: 103 tests passing across 5 files; auth-flow.test.tsx covers email/password validation, domain blocklist, ProtectedRoute guards, demo mode, username resolution*
- [ ] Set up staging Firebase project
- [x] Add Firebase Analytics initialisation — *done: getAnalytics() in client/src/lib/firebase.ts; guarded by VITE_FIREBASE_MEASUREMENT_ID; try/catch for ad-blocker safety*
- [x] Implement email verification — *done: sendEmailVerification() in signup.tsx; emailVerified field on User type in AuthContext; ProtectedRoute redirects unverified users to /verify-email; verify-email.tsx page with resend + check flow; /quick-onboarding skips check*

## Sprint: "Make It Payable" (Week 5–6)

- [ ] Build Stripe checkout for premium payments
- [ ] Build Stripe webhook handlers (payment success, subscription changes)
- [ ] Wire premium payments to community pool contributions
- [ ] Test Root Platform quote → accept → policy flow end-to-end
- [ ] Add premium amount display on policy page

## Sprint: "Make It Polished" (Week 7–8)

- [ ] Add push notifications (trip complete, score update, payment due)
- [ ] Build service worker for offline/PWA support
- [ ] Wire up profile page to real data
- [ ] Implement trip route visualisation on map
- [ ] Phone usage detection for scoring
- [ ] Build achievements backend

## Completed (reference)

- [x] Cloud Functions build fixed
- [x] Trips page wired to real Firestore data
- [x] AI insights feature flag
- [x] Root Platform integration scaffolded
- [x] CORS fixed (origin allowlist via `CORS_ORIGINS`; no wildcard)
- [x] CLAUDE.md and ROADMAP.md added; trip-processor source of truth; regression report and investor doc

---

*Update the checkbox when a ticket is done. Add new tickets at the top of the relevant sprint.*
