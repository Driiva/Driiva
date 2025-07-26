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
import TripRecording from "@/pages/trip-recording";
import Documents from "@/pages/documents";
import Support from "@/pages/support";
import NotFound from "@/pages/not-found";
import SignIn from "@/pages/signin";
import DriivaLogo from "@/components/DrivvaLogo";
import FloatingStardust from "@/components/FloatingStardust";
import PageTransition from "@/components/PageTransition";
import InfiniteScrollIndicator from "@/components/InfiniteScrollIndicator";
import ScrollIndicatorDots from "@/components/ScrollIndicatorDots";
import SwipeHint from "@/components/SwipeHint";
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
  const { direction, currentPageIndex } = useInfiniteScroll(pages);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem("driiva_user");
    setIsAuthenticated(!!user);
    setIsChecking(false);
    
    // Redirect to sign-in if not authenticated and not already on sign-in page
    if (!user && location !== "/signin") {
      setLocation("/signin");
    }
  }, [location, setLocation]);

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Switch>
        <Route path="/signin" component={SignIn} />
        <Route path="/">
          {() => isAuthenticated ? (
            <PageTransition pageKey="dashboard" direction={direction}>
              <Dashboard />
            </PageTransition>
          ) : <SignIn />}
        </Route>
        <Route path="/trips">
          {() => isAuthenticated ? (
            <PageTransition pageKey="trips" direction={direction}>
              <Trips />
            </PageTransition>
          ) : <SignIn />}
        </Route>
        <Route path="/rewards">
          {() => isAuthenticated ? (
            <PageTransition pageKey="rewards" direction={direction}>
              <Rewards />
            </PageTransition>
          ) : <SignIn />}
        </Route>
        <Route path="/profile">
          {() => isAuthenticated ? (
            <PageTransition pageKey="profile" direction={direction}>
              <Profile />
            </PageTransition>
          ) : <SignIn />}
        </Route>
        <Route path="/trip-recording" component={TripRecording} />
        <Route path="/documents" component={Documents} />
        <Route path="/support" component={Support} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isSignInPage = location === "/signin";
  
  return (
    <div className="min-h-screen text-white relative">
      {/* Floating Stardust Background */}
      <FloatingStardust />

      {/* Logo Header - Only show on authenticated pages */}
      {!isSignInPage && (
        <div className="fixed top-0 left-0 right-0 z-50 safe-area">
          <div className="flex justify-center pt-4 pb-2">
            <DriivaLogo />
          </div>
        </div>
      )}

      {/* Infinite Scroll Indicator - Only show on authenticated pages */}
      {!isSignInPage && <InfiniteScrollIndicatorWrapper />}

      {/* Scroll Indicator Dots - Only show on authenticated pages */}
      {!isSignInPage && <ScrollIndicatorDotsWrapper />}

      {/* Swipe Hint - Only show on authenticated pages */}
      {!isSignInPage && <SwipeHint />}

      {/* Main Content */}
      <div className={!isSignInPage ? "pt-20" : ""}>
        <Router />
      </div>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function InfiniteScrollIndicatorWrapper() {
  const pageConfig = [
    { path: '/', component: Dashboard, name: 'Dashboard' },
    { path: '/trips', component: Trips, name: 'Trips' },
    { path: '/rewards', component: Rewards, name: 'Rewards' },
    { path: '/profile', component: Profile, name: 'Profile' },
  ];
  
  const { currentPageIndex } = useInfiniteScroll(pageConfig);
  
  return (
    <InfiniteScrollIndicator 
      currentPage={currentPageIndex}
      totalPages={pageConfig.length}
      pageNames={pageConfig.map(p => p.name)}
    />
  );
}

function ScrollIndicatorDotsWrapper() {
  const pageConfig = [
    { path: '/', component: Dashboard, name: 'Dashboard' },
    { path: '/trips', component: Trips, name: 'Trips' },
    { path: '/rewards', component: Rewards, name: 'Rewards' },
    { path: '/profile', component: Profile, name: 'Profile' },
  ];
  
  const { currentPageIndex, goToPage } = useInfiniteScroll(pageConfig);
  
  return (
    <ScrollIndicatorDots 
      currentPage={currentPageIndex}
      totalPages={pageConfig.length}
      onPageSelect={goToPage}
    />
  );
}

export default App;