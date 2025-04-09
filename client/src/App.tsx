import * as React from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth"; 
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BookingHistory from "@/pages/booking-history";
import LoginPage from "@/pages/auth/login";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";
import VehicleGroupManagement from "@/pages/vehicle-group-management";
import VehicleTypeManagement from "@/pages/vehicle-type-management";
import VehicleMasterManagement from "@/pages/vehicle-master-management";
import UserMasterPage from "@/pages/user-master";
import NewBooking from "@/pages/new-booking";
import EmployeeManagement from "@/pages/employee-management";
import PermissionsMapPage from "@/pages/permissions-map";
import WorkflowManagementPage from "@/pages/workflow-management";
import { Layout } from "@/components/layout";
import PerformanceSnapshotPage from "@/pages/performance-snapshot";
import FuelPricePage from "@/pages/fuel-price-page";
import FuelManagementPage from "@/pages/fuel-management-page";
import MapTestPage from "@/pages/map-test";
import DebugPage from "@/pages/debug";


// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("token");

  React.useEffect(() => {
    if (!token) {
      setLocation("/auth/login");
      return;
    }
  }, [token, setLocation]);

  return token ? (
    <Layout>
      <Component />
    </Layout>
  ) : null;
}

function StandaloneRoute({ component: Component }: { component: React.ComponentType }) {
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Auth Routes - Standalone */}
      <Route path="/auth/login" component={() => <StandaloneRoute component={LoginPage} />} />
      <Route path="/auth/forgot-password" component={() => <StandaloneRoute component={ForgotPasswordPage} />} />
      <Route path="/auth/reset-password" component={() => <StandaloneRoute component={ResetPasswordPage} />} />
      <Route path="/map-test" component={() => <StandaloneRoute component={MapTestPage} />} />

      {/* Protected Routes */}
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/new-booking" component={() => <ProtectedRoute component={NewBooking} />} />
      <Route path="/bookings" component={() => <ProtectedRoute component={BookingHistory} />} />
      <Route path="/vehicle-groups" component={() => <ProtectedRoute component={VehicleGroupManagement} />} />
      <Route path="/vehicle-types" component={() => <ProtectedRoute component={VehicleTypeManagement} />} />
      <Route path="/vehicle-type-management" component={() => <ProtectedRoute component={VehicleTypeManagement} />} />
      <Route path="/vehicle-master" component={() => <ProtectedRoute component={VehicleMasterManagement} />} />
      <Route path="/vehicle-master-management" component={() => <ProtectedRoute component={VehicleMasterManagement} />} />
      <Route path="/user-master" component={() => <ProtectedRoute component={UserMasterPage} />} />
      <Route path="/employees" component={() => <ProtectedRoute component={EmployeeManagement} />} />
      <Route path="/permissions-map" component={() => <ProtectedRoute component={PermissionsMapPage} />} />
      <Route path="/workflows" component={() => <ProtectedRoute component={WorkflowManagementPage} />} />
      <Route path="/performance" component={() => <ProtectedRoute component={PerformanceSnapshotPage} />} />
      <Route path="/fuel-prices" component={() => <ProtectedRoute component={FuelPricePage} />} />
      <Route path="/fuel-management" component={() => <ProtectedRoute component={FuelManagementPage} />} />
      <Route path="/debug" component={() => <ProtectedRoute component={DebugPage} />} />

      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="relative min-h-screen">
            <Router />
            <Toaster />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;