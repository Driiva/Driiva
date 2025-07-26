import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Trips from "@/pages/trips";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import TripRecording from "@/pages/trip-recording";
import Documents from "@/pages/documents";
import Support from "@/pages/support";
import NotFound from "@/pages/not-found";
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
  const [location] = useLocation();
  const { direction, currentPageIndex } = useInfiniteScroll(pages);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Switch>
        <Route path="/">
          {() => (
            <PageTransition pageKey="dashboard" direction={direction}>
              <Dashboard />
            </PageTransition>
          )}
        </Route>
        <Route path="/trips">
          {() => (
            <PageTransition pageKey="trips" direction={direction}>
              <Trips />
            </PageTransition>
          )}
        </Route>
        <Route path="/rewards">
          {() => (
            <PageTransition pageKey="rewards" direction={direction}>
              <Rewards />
            </PageTransition>
          )}
        </Route>
        <Route path="/profile">
          {() => (
            <PageTransition pageKey="profile" direction={direction}>
              <Profile />
            </PageTransition>
          )}
        </Route>
        <Route path="/trip-recording" component={TripRecording} />
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
        <div className="min-h-screen text-white relative">
          {/* Floating Stardust Background */}
          <FloatingStardust />

          {/* Logo Header */}
          <div className="fixed top-0 left-0 right-0 z-50 safe-area">
            <div className="flex justify-center pt-4 pb-2">
              <DriivaLogo />
            </div>
          </div>

          {/* Infinite Scroll Indicator */}
          <InfiniteScrollIndicatorWrapper />

          {/* Scroll Indicator Dots */}
          <ScrollIndicatorDotsWrapper />

          {/* Swipe Hint */}
          <SwipeHint />

          {/* Main Content */}
          <div className="pt-20">
            <Router />
          </div>
          <Toaster />
        </div>
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