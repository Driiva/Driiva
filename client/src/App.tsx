
import { Router, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";

// Pages
import SignIn from "@/pages/signin";
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
      staleTime: 5 * 60 * 1000, // 5 minutes
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
