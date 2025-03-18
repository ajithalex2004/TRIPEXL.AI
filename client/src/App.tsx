import * as React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import BookingHistory from "@/pages/booking-history";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
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

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/" component={() => <ProtectedRoute component={HomePage} />} />
      <Route path="/bookings" component={() => <ProtectedRoute component={BookingHistory} />} />
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