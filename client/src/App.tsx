import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch, Redirect, useLocation } from 'wouter';
import ScrollGradient from './components/ScrollGradient';
import AnimatedBackground from './components/AnimatedBackground';
import heroBackground from './assets/hero-background.png';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

// ─── Eagerly loaded: critical user journey pages ─────────────────────────
// These are loaded in the initial bundle so navigation is instant.
import Welcome from './pages/welcome';
import Signup from './pages/signup';
import SignIn from './pages/signin';
import Demo from './pages/demo';
import QuickOnboarding from './pages/quick-onboarding';
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import Trips from './pages/trips';
import Profile from './pages/profile';
import Settings from './pages/settings';

// ─── Lazy-loaded: secondary pages (split into separate chunks) ───────────
const Permissions = lazy(() => import('./pages/permissions'));
const Onboarding = lazy(() => import('./pages/onboarding'));
const Rewards = lazy(() => import('./pages/rewards'));
const Support = lazy(() => import('./pages/support'));
const TripRecording = lazy(() => import('./pages/trip-recording'));
const LeaderboardPage = lazy(() => import('./pages/leaderboard'));
const PolicyPage = lazy(() => import('./pages/policy'));
const Terms = lazy(() => import('./pages/terms'));
const Privacy = lazy(() => import('./pages/privacy'));
const Achievements = lazy(() => import('./pages/achievements'));

import { AuthProvider } from './contexts/AuthContext';
import { OnlineStatusProvider, useOnlineStatusContext } from './contexts/OnlineStatusContext';
import OfflineBanner from './components/OfflineBanner';

/** Minimal loading spinner shown while lazy pages load */
function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <OnlineStatusProvider>
            <AppContent />
          </OnlineStatusProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isOnline } = useOnlineStatusContext();
  const [location] = useLocation();
  
  // Welcome page has its own hero orbs; show animated orbs on all other pages
  const isWelcomePage = location === '/' || location === '/welcome';
  
  return (
    <div className={`App ${!isOnline ? 'pt-[52px]' : ''}`}>
      <OfflineBanner />
      <div 
        className="driiva-gradient-bg" 
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {!isWelcomePage && <AnimatedBackground variant="app" />}
      <ScrollGradient />
      <Suspense fallback={<PageFallback />}>
      <Switch>
              {/* Public routes */}
              <Route path="/" component={Welcome} />
              <Route path="/welcome" component={Welcome} />
              <Route path="/terms" component={Terms} />
              <Route path="/privacy" component={Privacy} />
              
              {/* Auth routes - redirect to home if already logged in */}
              <Route path="/signin">
                <PublicOnlyRoute redirectTo="/home">
                  <SignIn />
                </PublicOnlyRoute>
              </Route>
              <Route path="/login">
                <PublicOnlyRoute redirectTo="/home">
                  <SignIn />
                </PublicOnlyRoute>
              </Route>
              <Route path="/signup">
                <PublicOnlyRoute redirectTo="/home">
                  <Signup />
                </PublicOnlyRoute>
              </Route>
              
              {/* Semi-protected routes (onboarding flow) */}
              <Route path="/permissions" component={Permissions} />
              <Route path="/onboarding" component={Onboarding} />
              
              {/* Protected routes - require authentication */}
              <Route path="/home">
                <ProtectedRoute><Home /></ProtectedRoute>
              </Route>
              <Route path="/dashboard">
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              </Route>
              <Route path="/trips">
                <ProtectedRoute><Trips /></ProtectedRoute>
              </Route>
              <Route path="/rewards">
                <ProtectedRoute><Rewards /></ProtectedRoute>
              </Route>
              <Route path="/profile">
                <ProtectedRoute><Profile /></ProtectedRoute>
              </Route>
              <Route path="/support" component={Support} />
              <Route path="/trip-recording">
                <ProtectedRoute><TripRecording /></ProtectedRoute>
              </Route>
              <Route path="/leaderboard">
                <ProtectedRoute><LeaderboardPage /></ProtectedRoute>
              </Route>
              <Route path="/policy">
                <ProtectedRoute><PolicyPage /></ProtectedRoute>
              </Route>
              <Route path="/demo" component={Demo} />
              <Route path="/quick-onboarding">
                <ProtectedRoute skipOnboardingCheck><QuickOnboarding /></ProtectedRoute>
              </Route>
              <Route path="/settings">
                <ProtectedRoute><Settings /></ProtectedRoute>
              </Route>
              <Route path="/achievements">
                <ProtectedRoute><Achievements /></ProtectedRoute>
              </Route>
              
              <Route>{() => <Redirect to="/" />}</Route>
            </Switch>
      </Suspense>
    </div>
  );
}
