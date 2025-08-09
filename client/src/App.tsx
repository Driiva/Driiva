import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import ScrollGradient from './components/ScrollGradient';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import Dashboard from './pages/dashboard';
import Trips from './pages/trips';
import Rewards from './pages/rewards';
import Profile from './pages/profile';
import Support from './pages/support';
import SignIn from './pages/signin';
import TripRecording from './pages/trip-recording';
import LeaderboardPage from './pages/leaderboard';
import PolicyPage from './pages/policy';
import NotFound from './pages/not-found';
import FileDownloads from './pages/file-downloads'; //Import the FileDownloads page

// Context
import { AuthProvider } from './contexts/AuthContext';

// Create stable query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});



export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="App">
              <div className="driiva-gradient-bg" />
              <ScrollGradient />
            <Switch>
              {/* Public Routes */}
              <Route path="/signin">
                <SignIn />
              </Route>

              {/* Protected Routes */}
              <Route path="/dashboard">
                <Dashboard />
              </Route>

              <Route path="/trips">
                <Trips />
              </Route>

              <Route path="/rewards">
                <Rewards />
              </Route>

              <Route path="/profile">
                <Profile />
              </Route>

              <Route path="/support">
                <Support />
              </Route>

              <Route path="/trip-recording">
                <TripRecording />
              </Route>

              <Route path="/leaderboard">
                <LeaderboardPage />
              </Route>

              <Route path="/policy">
                <PolicyPage />
              </Route>

              <Route path="/downloads">
                <FileDownloads />
              </Route>

              {/* Default and 404 Routes */}
              <Route path="/">
                <Dashboard />
              </Route>

              <Route>
                <NotFound />
              </Route>
            </Switch>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}