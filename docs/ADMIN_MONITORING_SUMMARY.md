# Admin Monitoring Dashboard — Implementation Summary

## What Was Built

### 1. Monitoring Dashboard Page
**File:** `client/src/pages/admin/monitoring.tsx` (582 lines)

A comprehensive real-time monitoring dashboard with:

#### Implemented (Live Now):
- **System Health** — Status badge + 4-metric grid (Cloud Functions status, last trip timestamp, region, version)
- **Trip Pipeline Metrics (24h)** — Total processed, failed trips, stuck trips (>1hr), avg latency + hourly breakdown bar chart
- **Cost Tracking** — AI spend (today/month), function invocations display

#### Placeholders (Coming Soon):
- **Performance Vitals** — Cold start metrics, Firestore latency, Web Vitals from Vercel API
- **Classifier Status** — Python Stop-Go-Classifier health, latency, success rate
- **Recent Alerts & Incidents** — Sentry issues, Cloud Monitoring alerts, Watchdog warnings

### 2. Navigation Integration
- Added "Monitoring" to admin sidebar (2nd item, below Overview)
- Lazy-loaded route at `/admin/monitoring`
- Icon: `BarChart3` (Lucide React)
- Requires `isAdmin: true` flag (already enforced by `AdminRoute`)

### 3. Auto-Refresh & Polling
Uses TanStack Query with refetch intervals:
- System health: **30 seconds**
- Trip metrics: **1 minute**
- Cost tracking: **5 minutes**

---

## How to Access

### Development (Local)
```
http://localhost:5173/admin/monitoring
```

### Production (After DNS Setup)
```
https://admin.driiva.co.uk/admin/monitoring
```

**Auth requirement:** Must be signed in with `user.isAdmin === true` in the Firestore `users/{uid}` document.

---

## DNS & Deployment Setup

Full guide in `docs/ADMIN_SUBDOMAIN_SETUP.md`.

**Quick version (Option A — Recommended):**

1. **Vercel:** Add `admin.driiva.co.uk` as a domain to your existing project
2. **DNS:** Add `CNAME` record: `admin` → `cname.vercel-dns.com`
3. **Firebase:** Whitelist `admin.driiva.co.uk` in Firebase Console → Authentication → Authorized domains
4. **Wait:** 5-60 minutes for DNS propagation + SSL cert provisioning
5. **Test:** Visit `https://admin.driiva.co.uk/admin/monitoring`

---

## Data Sources (Current)

| Metric | Source | Query |
|--------|--------|-------|
| System health | Cloud Functions `/health` endpoint | `fetch('https://europe-west2-driiva.cloudfunctions.net/health')` |
| Trip count (24h) | Firestore `trips` collection | `where('startedAt', '>=', twentyFourHoursAgo)` |
| Failed trips | Firestore `trips` collection | `where('status', '==', 'failed')` |
| Stuck trips | Firestore `trips` collection | `where('status', '==', 'processing') AND where('startedAt', '<=', oneHourAgo)` |
| Last trip timestamp | Firestore `trips` collection | `orderBy('startedAt', 'desc').limit(1)` |
| Hourly breakdown | Firestore aggregation | Group by hour from `startedAt` |
| AI spend (today) | Firestore `aiUsageTracking` | `where('calledAt', '>=', startOfToday)` sum `estimatedCostCents` |
| AI spend (month) | Firestore `aiUsageTracking` | `where('calledAt', '>=', startOfMonth)` sum `estimatedCostCents` |

---

## Data Sources (To Be Implemented)

These are documented as placeholders in the monitoring page. Implementation requires the monitoring prompt tasks:

| Metric | Source | Implementation |
|--------|--------|----------------|
| Cold start count/latency | Google Cloud Monitoring API | Query `cloudfunctions.googleapis.com/function/execution_times` metric |
| Firestore read/write latency | Google Cloud Monitoring API | Query `firestore.googleapis.com/document/read_count` + latency metrics |
| Web Vitals (LCP, INP, CLS) | Vercel Analytics API | `GET https://api.vercel.com/v1/analytics/web-vitals?projectId=...` |
| Classifier health | Cloud Logging API | Query `[metric] classifier_call` logs for latency/success rate |
| Sentry issues | Sentry REST API | `GET https://sentry.io/api/0/projects/{org}/{project}/issues/?statsPeriod=24h` |
| Cloud Monitoring alerts | Google Cloud Monitoring API | Query alert policies + incidents |
| Watchdog warnings | Cloud Logging API | Query logs from `monitorTripHealth` scheduled function |

---

## Next Steps

### Phase 1: Complete Monitoring Wiring (from MONITORING_PROMPT.md)
1. Wire `wrapFunction`/`wrapTrigger` into all Cloud Functions (Sentry error tracking)
2. Add Firebase Performance Monitoring SDK (client-side traces)
3. Add structured `[metric]` logging (trip pipeline, classifier, AI)
4. Add Vercel Analytics + Speed Insights
5. Configure Cloud Monitoring alert policies + watchdog function

### Phase 2: Wire APIs into Dashboard
1. **Sentry API** — Create backend endpoint `/api/admin/sentry-issues`
   - Needs `SENTRY_AUTH_TOKEN` in env
   - Returns recent issues from both `driiva-frontend` and `driiva-functions` projects
2. **Cloud Logging API** — Create backend endpoint `/api/admin/metrics`
   - Use `@google-cloud/logging` package (already available in Cloud Functions)
   - Query `[metric]` tagged logs for trip_pipeline, classifier_call, ai_analysis
3. **Vercel Analytics API** — Create backend endpoint `/api/admin/web-vitals`
   - Needs `VERCEL_TOKEN` in env
   - Returns LCP, INP, CLS metrics for last 24h
4. **Watchdog Integration** — Query Cloud Logging for `[watchdog]` tagged logs

### Phase 3: Enhance Dashboard UI
1. Add drill-down modals for failed/stuck trips (show trip IDs, error messages)
2. Add alert dismiss/acknowledge actions
3. Add time-range selectors (24h / 7d / 30d)
4. Add CSV export for metrics
5. Add real-time WebSocket updates (if scaling requires it)

---

## Monitoring Prompt Status

The full monitoring implementation guide is in `docs/MONITORING_PROMPT.md`. Here's the roadmap integration:

### Sprint: "Observation Mode" (from ROADMAP.md)
- [ ] Complete Sentry wiring — `wrapFunction`/`wrapTrigger` on all 27 Cloud Functions
- [ ] Add Firebase Performance Monitoring — client SDK + custom traces
- [ ] Add structured metrics logging — `[metric]` tags for Cloud Monitoring
- [ ] Add Vercel Analytics + Speed Insights — Web Vitals tracking
- [ ] Configure alerting — Cloud Monitoring policies, Sentry rules, watchdog function

Once these 5 tasks are complete, the dashboard will display live data in all sections (not just the 3 implemented ones).

---

## Cost Estimates

### Current Monitoring Stack (Free Tier)
- Firebase Performance Monitoring: Free (< 1M events/month)
- Google Cloud Monitoring: Free (< 150 MB logs/month, < 1K time series)
- Sentry (Driiva plan): Already configured
- Vercel Analytics: Free (included with Pro plan if on Vercel Pro)

### If Exceeding Free Tier
- Cloud Monitoring: ~£1-5/month (for 10K+ trips/day)
- Sentry: Already budgeted
- Vercel Analytics: £0 (unlimited on Pro plan)

---

## Files Created/Modified

### New Files:
1. `client/src/pages/admin/monitoring.tsx` — Main dashboard page
2. `docs/ADMIN_SUBDOMAIN_SETUP.md` — DNS + Vercel configuration guide
3. `docs/ADMIN_MONITORING_SUMMARY.md` — This file

### Modified Files:
1. `client/src/components/admin/AdminSidebar.tsx` — Added "Monitoring" nav item
2. `client/src/App.tsx` — Added `/admin/monitoring` route + lazy import
3. `ROADMAP.md` — Added "Observation Mode" sprint (already done in previous task)

---

## Testing Checklist

### Local Development
- [ ] `npm run dev` — app starts without errors
- [ ] Visit `/admin/monitoring` — page loads
- [ ] Sign in as admin user (`isAdmin: true` in Firestore)
- [ ] Confirm "Monitoring" appears in sidebar
- [ ] Confirm System Health card shows status badge
- [ ] Confirm Trip Pipeline shows hourly breakdown chart
- [ ] Confirm Cost Tracking shows AI spend
- [ ] Check browser console — no errors

### Production (After DNS Setup)
- [ ] `https://admin.driiva.co.uk/admin/monitoring` loads
- [ ] SSL certificate is valid (green padlock)
- [ ] Auth flow works (Firebase redirects to driiva.co.uk for signin if needed)
- [ ] Data refreshes every 30s-5min (check Network tab for fetch requests)
- [ ] Sidebar navigation works across all admin pages

---

## Support

If you encounter issues:

1. **Dashboard won't load** — Check browser console for errors; verify `isAdmin: true` flag
2. **DNS not resolving** — Wait 60 min for propagation; flush DNS cache
3. **"Invalid domain" in Firebase** — Add `admin.driiva.co.uk` to Authorized domains in Firebase Console
4. **Data not showing** — Confirm Firestore has `trips` and `aiUsageTracking` collections with data
5. **Sentry/API errors** — Check env vars are set; verify API tokens are valid

For the full monitoring implementation (Phase 1), refer to `docs/MONITORING_PROMPT.md` and execute tasks 1-5 in order.
