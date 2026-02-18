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
- [ ] Add password reset flow
- [ ] Test full flow: signup → onboarding → record trip → see score → see AI insights

## Sprint: "Make It Safe" (Week 3–4)

- [ ] Set up Sentry for error monitoring (frontend + Cloud Functions)
- [ ] Add Content Security Policy headers
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Write first batch of tests (auth flow, scoring algorithm, trip processing)
- [ ] Set up staging Firebase project
- [ ] Add Firebase Analytics initialisation
- [ ] Implement email verification

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
