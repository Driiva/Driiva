import { Switch, Route } from "wouter";
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
import "./styles/glass.css";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/trips" component={Trips} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/profile" component={Profile} />
      <Route path="/trip-recording" component={TripRecording} />
      <Route path="/documents" component={Documents} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
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

export default App;