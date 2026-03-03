# Driiva Monitoring Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYERS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  driiva.co.uk (User App)          admin.driiva.co.uk (Admin Panel)  │
│  ├─ /dashboard                    ├─ /admin                         │
│  ├─ /trips                        ├─ /admin/monitoring ◄── NEW      │
│  ├─ /profile                      ├─ /admin/users                   │
│  └─ ...                           ├─ /admin/trips                   │
│                                   ├─ /admin/feedback                │
│                                   └─ /admin/system                  │
│                                                                       │
│  Both served by single Vercel deployment (DNS alias)                │
│                                                                       │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MONITORING DATA SOURCES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Firebase Cloud Functions (europe-west2)                         │
│     ├─ /health endpoint → System health status                      │
│     ├─ [metric] logs → Trip pipeline latency, classifier calls      │
│     └─ Sentry wrappers → Error tracking per function                │
│                                                                       │
│  2. Firestore Collections                                           │
│     ├─ trips → Trip counts, failed trips, stuck trips               │
│     ├─ aiUsageTracking → AI spend (today/month)                     │
│     └─ systemLogs → Damoov sync health                              │
│                                                                       │
│  3. Google Cloud Monitoring API (future)                            │
│     ├─ Function execution metrics → Cold starts, latency            │
│     ├─ Firestore metrics → Read/write latency                       │
│     └─ Alert policies → Error rate, failures                        │
│                                                                       │
│  4. Sentry API (future)                                             │
│     ├─ driiva-frontend project → Client errors                      │
│     └─ driiva-functions project → Server errors                     │
│                                                                       │
│  5. Vercel Analytics API (future)                                   │
│     ├─ Web Vitals → LCP, INP, CLS                                   │
│     ├─ Page latency → CDN performance                               │
│     └─ Geographic distribution → User locations                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Monitoring Dashboard

### Current State (Implemented)

```
User visits admin.driiva.co.uk/admin/monitoring
        ↓
React component (client/src/pages/admin/monitoring.tsx)
        ↓
TanStack Query hooks fetch data every 30s-5min
        ↓
┌────────────────────────────────────────────────────┐
│ 1. fetchSystemHealth()                             │
│    → fetch('/health')                              │
│    → Returns: { status, service, timestamp }       │
│                                                     │
│ 2. fetchTripMetrics()                              │
│    → Firestore queries (trips collection)          │
│    → Aggregates: total, failed, stuck, hourly     │
│                                                     │
│ 3. fetchCostTracking()                             │
│    → Firestore query (aiUsageTracking collection)  │
│    → Sums: estimatedCostCents for today/month     │
└────────────────────────────────────────────────────┘
        ↓
Display in dashboard cards + charts (Recharts)
```

### Future State (After Monitoring Prompt Tasks)

```
User visits admin.driiva.co.uk/admin/monitoring
        ↓
React component fetches aggregated metrics
        ↓
Backend endpoint: /api/admin/monitoring-dashboard
        ↓
Parallel API calls to:
┌─────────────────────────────────────────────────────┐
│ 1. Existing Firestore queries (trips, AI costs)    │
│ 2. Cloud Logging API → [metric] tagged logs        │
│ 3. Sentry API → Recent issues from both projects   │
│ 4. Vercel API → Web Vitals for last 24h            │
│ 5. Cloud Monitoring API → Function metrics         │
└─────────────────────────────────────────────────────┘
        ↓
Aggregate into single JSON response
        ↓
Display all 6 dashboard sections (no placeholders)
```

---

## Alerting Flow (Future)

```
Monitoring sources generate events:
┌────────────────────────────────────────────────────┐
│ • Cloud Function error rate > 5%                   │
│ • Trip stuck in 'processing' > 1 hour              │
│ • Firestore write failure                          │
│ • Sentry new issue (critical severity)             │
│ • Watchdog: No trips in 24 hours                   │
└────────────────────────────────────────────────────┘
        ↓
Alerting channels:
┌────────────────────────────────────────────────────┐
│ 1. Email (immediate) → Google Cloud Monitoring     │
│ 2. Sentry UI → Issue notification                  │
│ 3. PagerDuty webhook (optional escalation)         │
└────────────────────────────────────────────────────┘
        ↓
Visible in monitoring dashboard:
"Recent Alerts & Incidents" section (real-time)
```

---

## Monitoring Layers

### Layer 1: Client-Side (Browser)
**Monitors:** React app crashes, API failures, performance
**Tools:**
- Sentry (`@sentry/react`) — error boundary, breadcrumbs
- Firebase Performance Monitoring — custom traces (trip recording)
- Vercel Speed Insights — Web Vitals (LCP, INP, CLS)

### Layer 2: API Layer (Cloud Functions)
**Monitors:** Function errors, latency, cold starts
**Tools:**
- Sentry (`@sentry/node`) — wrapFunction/wrapTrigger
- `functions.logger` — structured logs with [metric] tags
- Cloud Monitoring — automatic function metrics

### Layer 3: Data Layer (Firestore)
**Monitors:** Write failures, query latency
**Tools:**
- Cloud Monitoring — Firestore metrics
- Custom watchdog function — trip processing health checks

### Layer 4: External Services
**Monitors:** Damoov sync, AI API, classifier
**Tools:**
- systemLogs collection — Damoov sync audit trail
- aiUsageTracking collection — Claude API usage + cost
- Classifier HTTP call logs — latency, success rate

---

## Metrics Taxonomy

All metrics logged with `[metric]` tag for Cloud Logging queries:

### Trip Pipeline Metrics
```javascript
functions.logger.info('[metric] trip_pipeline', {
  metric: 'trip_pipeline',
  tripId, userId,
  pipelineMs,        // Total processing time
  pointCount,        // GPS points processed
  distanceMeters,    // Trip distance
  durationSeconds,   // Trip duration
  score,             // Calculated score
  finalStatus,       // completed | processing | failed
  flaggedForReview,  // Anomaly detection flag
});
```

### Classifier Call Metrics
```javascript
functions.logger.info('[metric] classifier_call', {
  metric: 'classifier_call',
  tripId,
  success,           // Boolean
  latencyMs,         // HTTP call duration
  pointCount,        // Points sent to classifier
  stopCount,         // Detected stops
  segmentCount,      // Detected trip segments
});
```

### AI Analysis Metrics
```javascript
functions.logger.info('[metric] ai_analysis', {
  metric: 'ai_analysis',
  tripId, userId,
  model,             // claude-sonnet-4-20250514
  promptTokens,      // Input tokens
  completionTokens,  // Output tokens
  totalTokens,       // Sum
  estimatedCostCents,// Cost in pence
  latencyMs,         // API call duration
  success,           // Boolean
  error,             // Error message if failed
});
```

### Watchdog Metrics
```javascript
functions.logger.warn('[metric] watchdog', {
  metric: 'watchdog',
  alert: 'failed_trips_spike' | 'no_recent_trips' | 'stuck_trips',
  failedCount,       // Number of failed trips
  threshold,         // Alert threshold
  stuckTrips,        // Array of stuck trip IDs
  staleHours,        // Hours since last trip
});
```

---

## Dashboard Sections Reference

| Section | Data Source | Refresh Rate | Status |
|---------|------------|--------------|--------|
| **System Health** | `/health` endpoint | 30s | ✅ Live |
| **Trip Pipeline** | Firestore `trips` | 1min | ✅ Live |
| **Cost Tracking** | Firestore `aiUsageTracking` | 5min | ✅ Live |
| **Performance Vitals** | Cloud Monitoring API | 5min | ⏳ Placeholder |
| **Classifier Status** | Cloud Logging API | 5min | ⏳ Placeholder |
| **Alerts & Incidents** | Sentry + Cloud Monitoring | 1min | ⏳ Placeholder |

**Total dashboard cards:** 18  
**Live cards:** 11  
**Placeholder cards:** 7

---

## Security Model

### Authentication
- Admin dashboard requires `isAdmin: true` flag in Firestore `users/{uid}` doc
- Firebase Auth session shared across `driiva.co.uk` and `admin.driiva.co.uk`
- `AdminRoute` wrapper enforces admin check on all `/admin/*` routes

### Authorization
- Monitoring API endpoints (future) will require admin JWT validation
- Sentry API token stored in Cloud Functions env (not client)
- Vercel API token stored in Cloud Functions env (not client)
- Cloud Monitoring API uses service account credentials (IAM roles)

### Data Isolation
- Client never queries Cloud Logging API directly (privacy)
- Client never sees raw Sentry API responses (may contain PII)
- Backend aggregation endpoint sanitizes + filters data before sending to client

---

## Deployment Strategy

### Phase 1: DNS Setup (Now)
✅ Add `admin.driiva.co.uk` as Vercel domain  
✅ Configure DNS CNAME record  
✅ Whitelist domain in Firebase Auth  
✅ Test monitoring page loads  

### Phase 2: Monitoring Wiring (Next)
⏳ Complete 5 tasks from `MONITORING_PROMPT.md`  
⏳ Deploy functions with Sentry wrappers  
⏳ Add Firebase Performance SDK to client  
⏳ Configure Cloud Monitoring alert policies  
⏳ Create watchdog scheduled function  

### Phase 3: Dashboard Enhancement (Later)
⏳ Build `/api/admin/monitoring-dashboard` aggregation endpoint  
⏳ Wire Sentry API for issue display  
⏳ Wire Cloud Logging API for metric queries  
⏳ Wire Vercel API for Web Vitals  
⏳ Remove placeholder sections  
⏳ Add drill-down modals + time-range selectors  

---

## Performance Considerations

### Dashboard Load Time
- Initial load: ~2s (lazy-loaded admin chunk)
- Subsequent navigation: instant (already loaded)
- Data fetch latency: 100-500ms (Firestore queries)

### Polling Impact
- System health: 30s interval = 120 requests/hour
- Trip metrics: 60s interval = 60 requests/hour
- Cost tracking: 300s interval = 12 requests/hour
- **Total:** ~200 Firestore reads/hour per admin session

### Scaling
- Current architecture supports 10-20 concurrent admin users
- For > 20 users: implement WebSocket for real-time updates
- For > 100 users: add Redis cache layer for aggregated metrics

---

**Next steps:** Follow `QUICK_DEPLOY_ADMIN.md` to get `admin.driiva.co.uk` live in 5 minutes.
