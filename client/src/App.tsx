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
import VehicleTypeManagement from "@/pages/vehicle-type-management";
import VehicleMasterManagement from "@/pages/vehicle-master-management";
import FuelEfficiencyPage from "@/pages/fuel-efficiency-page";
import CO2EmissionsPage from "@/pages/co2-emissions-page";
import NewBooking from "@/pages/new-booking";
import EmployeeManagement from "@/pages/employee-management";
import { Layout } from "@/components/layout";
import { EmployeeValidationForm } from "@/components/employee-validation-form";
import { PageTransition } from "@/components/page-transition";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  React.useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // Try auto-login with admin credentials
        try {
          const res = await apiRequest("POST", "/api/login", {
            emailId: "admin@tripxl.com",
            password: "Admin@123"
          });

          if (!res.ok) {
            throw new Error("Auto-login failed");
          }

          const data = await res.json();
          localStorage.setItem("token", data.token);
          toast({
            title: "Auto-login successful",
            description: "Logged in as admin"
          });
        } catch (error) {
          console.error("Auto-login failed:", error);
          setLocation("/auth/login");
          return;
        }
      }
    };

    autoLogin();
  }, [setLocation, toast]);

  return (
    <Layout>
      <PageTransition>
        <Component />
      </PageTransition>
    </Layout>
  );
}

function StandaloneRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <PageTransition>
      <Component />
    </PageTransition>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/" component={() => <ProtectedRoute component={Home} />} />
        <Route path="/auth/login" component={() => <StandaloneRoute component={LoginPage} />} />
        <Route path="/auth/register" component={() => <StandaloneRoute component={RegisterPage} />} />
        <Route path="/new-booking" component={() => <ProtectedRoute component={NewBooking} />} />
        <Route path="/bookings" component={() => <ProtectedRoute component={BookingHistory} />} />
        <Route path="/vehicle-groups" component={() => <ProtectedRoute component={VehicleGroupManagement} />} />
        <Route path="/vehicle-types" component={() => <ProtectedRoute component={VehicleTypeManagement} />} />
        <Route path="/vehicle-master" component={() => <ProtectedRoute component={VehicleMasterManagement} />} />
        <Route path="/fuel-efficiency" component={() => <ProtectedRoute component={FuelEfficiencyPage} />} />
        <Route path="/co2-emissions" component={() => <ProtectedRoute component={CO2EmissionsPage} />} />
        <Route path="/employees" component={() => <ProtectedRoute component={EmployeeManagement} />} />
        <Route path="/employee-validation" component={() => <ProtectedRoute component={EmployeeValidationForm} />} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
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