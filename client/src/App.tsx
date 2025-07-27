import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import Trips from "@/pages/trips";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import Documents from "@/pages/documents";
import Support from "@/pages/support";
import NotFound from "@/pages/not-found";
import SignIn from "@/pages/signin";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import "./styles/glass.css";

const pages = [
  { path: '/', component: Dashboard, name: 'Dashboard' },
  { path: '/trips', component: Trips, name: 'Trips' },
  { path: '/rewards', component: Rewards, name: 'Rewards' },
  { path: '/profile', component: Profile, name: 'Profile' },
];

function Router() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Initialize infinite scroll for authenticated pages
  const { direction } = useInfiniteScroll(pages);
  
  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem("driiva_user");
    setIsAuthenticated(!!user);
    setIsChecking(false);
    
    // Redirect to sign-in if not authenticated
    if (!user && location !== "/signin") {
      setLocation("/signin");
    }
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
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
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;