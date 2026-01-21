import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import ScrollGradient from './components/ScrollGradient';

// Pages
import Welcome from './pages/welcome';
import Signup from './pages/signup';
import Permissions from './pages/permissions';
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

// Context
import { AuthProvider } from './contexts/AuthContext';

// Fixed: Create stable query client with proper error handling
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
              <Route path="/welcome">
                <Welcome />
              </Route>

              <Route path="/signin">
                <SignIn />
              </Route>

              <Route path="/signup">
                <Signup />
              </Route>

              <Route path="/permissions">
                <Permissions />
              </Route>

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

              <Route path="/">
                <Welcome />
              </Route>

              <Route>
                <NotFound />
              </Route>
            </Switch>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}