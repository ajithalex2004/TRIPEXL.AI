import * as React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BookingHistory from "@/pages/booking-history";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import VehicleGroupManagement from "@/pages/vehicle-group-management";
import { Layout } from "@/components/layout";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLocation("/auth/login");
    }
  }, [setLocation]);

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

// Standalone route without the main layout
function StandaloneRoute({ component: Component }: { component: React.ComponentType }) {
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/bookings" component={() => <ProtectedRoute component={BookingHistory} />} />
      {/* Vehicle Group Management as a standalone route */}
      <Route path="/vehicle-groups" component={() => <StandaloneRoute component={VehicleGroupManagement} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;