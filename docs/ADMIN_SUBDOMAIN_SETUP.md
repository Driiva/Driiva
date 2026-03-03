# Admin Subdomain Setup — admin.driiva.co.uk

This guide explains how to configure Vercel to serve the admin dashboard at `admin.driiva.co.uk` while keeping the main app at `driiva.co.uk`.

---

## Architecture Options

### Option A: Single Vercel Deployment (Recommended for MVP)

**How it works:**
- One Vercel project serves both `driiva.co.uk` AND `admin.driiva.co.uk`
- DNS points both domains to the same Vercel deployment
- The admin dashboard is already in the app at `/admin/*` routes
- No extra infrastructure needed

**Pros:**
- Simple — zero config changes needed in code
- Shared auth session (same Firebase project)
- Single deployment pipeline

**Cons:**
- Admin and user app share the same resource limits
- Can't independently scale or version them

### Option B: Separate Vercel Deployment (Better Long-Term)

**How it works:**
- Two Vercel projects: `driiva-app` and `driiva-admin`
- `driiva.co.uk` → main app (no `/admin` routes)
- `admin.driiva.co.uk` → separate admin-only build
- Separate codebases (can be same repo, different build configs)

**Pros:**
- Independent scaling
- Can deploy admin updates without touching user app
- Better security isolation

**Cons:**
- Need to handle auth session sharing (Firebase works across subdomains)
- Slightly more complex build setup

---

## Option A: Configure DNS for Single Deployment

This is the quickest path to get `admin.driiva.co.uk` working with your existing Vercel deployment.

### Step 1: Add Domain to Vercel Project

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter `admin.driiva.co.uk`
4. Vercel will show you DNS records to add

### Step 2: Configure DNS Records

In your DNS provider (e.g., Cloudflare, Namecheap, etc.), add these records:

**For Vercel-hosted deployment:**

```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: Auto (or 3600)
```

**Alternative (if you want A records):**

```
Type: A
Name: admin
Value: 76.76.21.21
TTL: Auto
```

### Step 3: Verify Domain

1. Back in Vercel → Domains, click "Verify" next to `admin.driiva.co.uk`
2. Wait for DNS propagation (usually 5-60 minutes)
3. Once verified, Vercel automatically provisions an SSL certificate

### Step 4: Test

Visit `https://admin.driiva.co.uk/admin` — should show the admin dashboard (requires login + `isAdmin: true`).

---

## Option B: Separate Deployment Setup

If you want to deploy the admin dashboard as a standalone project:

### Step 1: Create a New Vercel Project

1. Go to Vercel Dashboard → Add New Project
2. Import the same GitHub repo (or create a new one with just the admin code)
3. Name it `driiva-admin`

### Step 2: Configure Build Settings

**For a separate admin build from the same repo:**

In Vercel project settings, override the build command:

```json
{
  "buildCommand": "npm run build:admin",
  "outputDirectory": "dist/admin"
}
```

Then in `package.json`, add:

```json
{
  "scripts": {
    "build:admin": "vite build --mode admin"
  }
}
```

### Step 3: Create Admin-Only Vite Config

Create `vite.config.admin.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/admin'),
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/admin.html'), // Create this
      },
    },
  },
});
```

### Step 4: Create Admin Entry Point

Create `client/admin.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Driiva Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/admin-main.tsx"></script>
  </body>
</html>
```

Create `client/src/admin-main.tsx`:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Router, Route, Switch, Redirect } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { initSentry } from './lib/sentry';

// Import only admin pages
import AdminOverview from './pages/admin/index';
import AdminMonitoring from './pages/admin/monitoring';
import AdminUsers from './pages/admin/users';
import AdminTrips from './pages/admin/trips';
import AdminFeedback from './pages/admin/feedback';
import AdminSystem from './pages/admin/system';
import SignIn from './pages/signin';

import './index.css';

initSentry();

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router base="/admin">
        <AuthProvider>
          <Switch>
            <Route path="/signin" component={SignIn} />
            <Route path="/monitoring" component={AdminMonitoring} />
            <Route path="/users" component={AdminUsers} />
            <Route path="/trips" component={AdminTrips} />
            <Route path="/feedback" component={AdminFeedback} />
            <Route path="/system" component={AdminSystem} />
            <Route path="/" component={AdminOverview} />
            <Route>{() => <Redirect to="/" />}</Route>
          </Switch>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Step 5: Add Domain in Vercel

Same as Option A Step 1-3, but add `admin.driiva.co.uk` to the **new** `driiva-admin` project.

---

## Recommended Approach for Driiva

**For now: Use Option A** (single deployment, DNS alias)

**Why:**
- You already have `/admin` routes built
- Zero code changes needed
- Fastest to implement (literally just DNS + Vercel domain add)
- Can migrate to Option B later if scaling requires it

**When to migrate to Option B:**
- When admin dashboard needs different performance characteristics
- When you want to deploy admin updates independently
- When you add admin-specific features that bloat the main bundle

---

## Post-Setup Checklist

After DNS is configured and verified:

- [ ] Test `https://admin.driiva.co.uk/admin` loads the dashboard
- [ ] Test `https://admin.driiva.co.uk/admin/monitoring` loads the new monitoring page
- [ ] Confirm SSL certificate is active (green padlock)
- [ ] Test auth flow — sign in as admin user, confirm `isAdmin` flag works
- [ ] Update any hardcoded URLs in docs/code to use `admin.driiva.co.uk`
- [ ] Add `admin.driiva.co.uk` to Firebase Auth authorized domains (Firebase Console → Authentication → Settings → Authorized domains)

---

## Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN"
- DNS records haven't propagated yet. Wait 5-60 minutes, then flush your DNS cache:
  ```bash
  # macOS
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
  
  # Windows
  ipconfig /flushdns
  ```

### "This site can't provide a secure connection"
- Vercel hasn't provisioned the SSL cert yet. Wait a few minutes after domain verification, then refresh.

### Admin dashboard shows 404
- If using Option A: The routes are at `/admin/*`, so visit `https://admin.driiva.co.uk/admin`
- If using Option B: Check the `base` prop in your Router matches the deployment path

### "Invalid domain configuration"
- Make sure the CNAME points to `cname.vercel-dns.com` (not an old Vercel URL)
- Verify the domain is added in Vercel project settings

---

## Firebase Auth Configuration

After adding the subdomain, you MUST whitelist it in Firebase:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Enter `admin.driiva.co.uk`
4. Save

Without this, Firebase Auth will reject login attempts from the subdomain.

---

## Next Steps

Once `admin.driiva.co.uk` is live:

1. **Implement the monitoring integrations** from `docs/MONITORING_PROMPT.md`
2. **Wire up Sentry API** for live error display in the monitoring dashboard
3. **Add Cloud Logging API** for metric log queries
4. **Add Vercel Analytics API** for Web Vitals display
5. **Create the watchdog function** for trip health monitoring

The monitoring page currently shows:
- ✅ System health (from `/health` endpoint)
- ✅ Trip metrics (from Firestore queries)
- ✅ AI cost tracking (from `aiUsageTracking` collection)
- ⏳ Performance vitals (placeholder — needs Cloud Monitoring API)
- ⏳ Classifier status (placeholder — needs Python service deployed)
- ⏳ Recent alerts (placeholder — needs Sentry + Cloud Monitoring APIs)

Reference the monitoring dashboard design in this doc's initial conversation for the full feature set.
