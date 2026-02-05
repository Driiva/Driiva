import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch, Redirect } from 'wouter';
import ScrollGradient from './components/ScrollGradient';
import heroBackground from './assets/hero-background.png';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

import Welcome from './pages/welcome';
import Signup from './pages/signup';
import Home from './pages/home';
import Permissions from './pages/permissions';
import Onboarding from './pages/onboarding';
import Dashboard from './pages/dashboard';
import Trips from './pages/trips';
import Rewards from './pages/rewards';
import Profile from './pages/profile';
import Support from './pages/support';
import SignIn from './pages/signin';
import TripRecording from './pages/trip-recording';
import LeaderboardPage from './pages/leaderboard';
import PolicyPage from './pages/policy';
import Terms from './pages/terms';
import Privacy from './pages/privacy';
import Demo from './pages/demo';
import QuickOnboarding from './pages/quick-onboarding';
import Settings from './pages/settings';
import Achievements from './pages/achievements';

import { AuthProvider } from './contexts/AuthContext';
import { OnlineStatusProvider, useOnlineStatusContext } from './contexts/OnlineStatusContext';
import OfflineBanner from './components/OfflineBanner';

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
  return (
    <div className={`App ${!isOnline ? 'pt-[52px]' : ''}`}>
      <OfflineBanner />
      <div 
        className="driiva-gradient-bg" 
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <ScrollGradient />
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
              <Route path="/support">
                <ProtectedRoute><Support /></ProtectedRoute>
              </Route>
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
              <Route path="/quick-onboarding" component={QuickOnboarding} />
              <Route path="/settings">
                <ProtectedRoute><Settings /></ProtectedRoute>
              </Route>
              <Route path="/achievements">
                <ProtectedRoute><Achievements /></ProtectedRoute>
              </Route>
              
              <Route>{() => <Redirect to="/" />}</Route>
            </Switch>
    </div>
  );
}
