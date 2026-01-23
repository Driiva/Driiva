import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch, Redirect } from 'wouter';
import ScrollGradient from './components/ScrollGradient';

import Welcome from './pages/welcome';
import Signup from './pages/signup';
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

import { AuthProvider } from './contexts/AuthContext';

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
          <div className="App">
            <div className="driiva-gradient-bg" />
            <ScrollGradient />
            <Switch>
              <Route path="/" component={Welcome} />
              <Route path="/welcome" component={Welcome} />
              <Route path="/signin" component={SignIn} />
              <Route path="/signup" component={Signup} />
              <Route path="/permissions" component={Permissions} />
              <Route path="/onboarding" component={Onboarding} />
              
              <Route path="/dashboard"><Dashboard /></Route>
              <Route path="/trips" component={Trips} />
              <Route path="/rewards" component={Rewards} />
              <Route path="/profile" component={Profile} />
              <Route path="/support" component={Support} />
              <Route path="/trip-recording" component={TripRecording} />
              <Route path="/leaderboard" component={LeaderboardPage} />
              <Route path="/policy" component={PolicyPage} />
              
              <Route>{() => <Redirect to="/" />}</Route>
            </Switch>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
