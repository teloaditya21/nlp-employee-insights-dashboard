import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import SurveyDashboard from "@/pages/survey-dashboard";
import MyInsights from "@/pages/my-insights";
import TopInsights from "@/pages/top-insights";
import SmartAnalytics from "@/pages/smart-analytics";
import Settings from "@/pages/settings";


import Sidebar from "@/components/layout/sidebar";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/auth/protected-route";
import ErrorBoundary from "@/components/ErrorBoundary";

function Router() {
  const [location] = useLocation();
  const isLoginPage = location === "/login" || location === "/";

  return (
    <div className={`${!isLoginPage ? "flex min-h-screen" : ""}`}>
      {!isLoginPage && <Sidebar />}
      <div className={!isLoginPage ? "flex-1 flex flex-col relative h-screen overflow-y-auto" : "w-full"}>
        <ErrorBoundary>
          <Switch>
            <Route path="/" component={Login} />
            <Route path="/login" component={Login} />
            <Route path="/survey-dashboard">
              <ProtectedRoute>
                <SurveyDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/my-insights">
              <ProtectedRoute>
                <MyInsights />
              </ProtectedRoute>
            </Route>
            <Route path="/top-insights">
              <ProtectedRoute>
                <TopInsights />
              </ProtectedRoute>
            </Route>
            <Route path="/smart-analytics">
              <ProtectedRoute>
                <SmartAnalytics />
              </ProtectedRoute>
            </Route>
            <Route path="/settings">
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04Z"/>
            </svg>
          </div>
          <p className="text-sm text-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
