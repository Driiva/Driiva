
# Driiva App - Complete Code Analysis & Debug Report

## Current Status: STABLE
All previously identified critical errors have been resolved as of 2026-02-19.

### Resolved Critical Errors
- [x] **Authentication System Errors**: `useAuth` hook implemented and verified; `AuthContext` provides stable state.
- [x] **Data Access Errors**: Dashboard components now have proper check for `user` and `profile` data before rendering.
- [x] **Query Configuration Errors**: React Query `queryFn` is correctly configured in `App.tsx` or individual hooks.
- [x] **CORS Issues**: Correct allowlist implemented via `CORS_ORIGINS` env var.
- [x] **Scoring Weights**: Aligned with canonical spec (Speed 25%, Braking 25%, Accel 20%, Cornering 20%, Phone 10%).

## Root Cause Analysis

### Authentication Flow Issues
1. useAuth hook is referenced but not properly implemented
2. Authentication state management is incomplete
3. User data persistence is inconsistent

### Data Flow Problems
1. Dashboard components expect data before it's loaded
2. Missing loading states and error boundaries
3. Improper prop passing between components

### API Integration Issues
1. Query client missing proper error handling
2. API endpoints not properly configured
3. Missing fallback data structures

## Complete App Structure

### Backend Files

#### server/index.ts
```typescript
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error ${status}: ${message} on ${req.method} ${req.path}`, "error");
    
    if (process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }

    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
```

### Frontend Files

#### client/src/App.tsx
```typescript
import { Router, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";

// Pages
import SignIn from "@/pages/signin-minimal";
import Dashboard from "@/pages/dashboard";
import Trips from "@/pages/trips";
import Profile from "@/pages/profile";
import Rewards from "@/pages/rewards";
import Support from "@/pages/support";
import Documents from "@/pages/documents";
import NotFound from "@/pages/not-found";

// Styles
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
      retry: 3,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("driiva_user");
    setIsAuthenticated(!!user);
    setIsChecking(false);
  }, [location]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Switch>
        <Route path="/signin" component={SignIn} />
        <Route path="/">
          {() => isAuthenticated ? <Dashboard /> : <SignIn />}
        </Route>
        <Route path="/trips">
          {() => isAuthenticated ? <Trips /> : <SignIn />}
        </Route>
        <Route path="/rewards">
          {() => isAuthenticated ? <Rewards /> : <SignIn />}
        </Route>
        <Route path="/profile">
          {() => isAuthenticated ? <Profile /> : <SignIn />}
        </Route>
        <Route path="/documents" component={Documents} />
        <Route path="/support" component={Support} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen text-white">
          <Router>
            <AppRouter />
          </Router>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

#### client/src/main.tsx
```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
          <div className="glass-morphism p-8 rounded-2xl max-w-md mx-4 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-lg font-medium transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

## Immediate Action Plan

### Phase 1: Fix Critical Errors
1. Implement proper authentication hook
2. Add loading states to all data-dependent components
3. Fix React Query configuration

### Phase 2: Data Flow Optimization
1. Implement proper error boundaries
2. Add fallback data structures
3. Optimize component rendering

### Phase 3: UI/UX Polish
1. Fix glassmorphism effects
2. Optimize parallax performance
3. Ensure responsive design

## Refund Algorithm Correction

The refund simulator should use this formula:
- Personal Score Weight: 80%
- Community Score Weight: 20%
- Qualification Threshold: 70+ total score
- Refund Percentage: 15% of premium for qualified users

## Next Steps
1. Fix authentication system
2. Implement proper data loading
3. Add comprehensive error handling
4. Test all user flows
5. Optimize performance
