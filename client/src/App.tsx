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

function StandaloneRoute({ component: Component }: { component: React.ComponentType }) {
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/new-booking" component={() => <ProtectedRoute component={NewBooking} />} />
      <Route path="/bookings" component={() => <ProtectedRoute component={BookingHistory} />} />
      <Route path="/vehicle-groups" component={() => <StandaloneRoute component={VehicleGroupManagement} />} />
      <Route path="/vehicle-types" component={() => <StandaloneRoute component={VehicleTypeManagement} />} />
      <Route path="/vehicle-master" component={() => <StandaloneRoute component={VehicleMasterManagement} />} />
      <Route path="/fuel-efficiency" component={() => <ProtectedRoute component={FuelEfficiencyPage} />} />
      <Route path="/co2-emissions" component={() => <ProtectedRoute component={CO2EmissionsPage} />} />
      <Route path="/employees" component={() => <ProtectedRoute component={EmployeeManagement} />} />
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