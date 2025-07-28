import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "react-error-boundary";

import Dashboard from "@/pages/dashboard";
import SignIn from "@/pages/signin";
import Profile from "@/pages/profile";
import Trips from "@/pages/trips";
import TripRecording from "@/pages/trip-recording";
import Support from "@/pages/support";
import Documents from "@/pages/documents";
import Rewards from "@/pages/rewards";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-gray-300 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/signin" component={SignIn} />
            <Route path="/profile" component={Profile} />
            <Route path="/trips" component={Trips} />
            <Route path="/trip-recording" component={TripRecording} />
            <Route path="/support" component={Support} />
            <Route path="/documents" component={Documents} />
            <Route path="/rewards" component={Rewards} />
            <Route component={NotFound} />
          </Switch>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}