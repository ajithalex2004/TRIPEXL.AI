import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  LogoutButton,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/ui/logo";
import { Footer } from "@/components/ui/footer";
import { LoadingPage } from "@/components/loading-page";
import {
  History,
  Car,
  Package,
  Wrench,
  Database,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  LayoutDashboard
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [location] = useLocation();

  // Show loading state when location changes
  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800); // Show spinner for at least 800ms
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen relative">
        {isLoading && <LoadingPage />}
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton className="w-full">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/new-booking">
                  <SidebarMenuButton className="w-full">
                    <PlusCircle className="w-4 h-4" />
                    <span>New Booking</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/bookings">
                  <SidebarMenuButton className="w-full">
                    <History className="w-4 h-4" />
                    <span>Booking History</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              {/* Vehicle Menu with Animation */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsVehicleMenuOpen(!isVehicleMenuOpen)}
                  className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Car className="w-4 h-4 mr-2 transition-transform duration-200 animate-pulse" />
                  <span className="flex-1 text-left">Vehicles</span>
                  {isVehicleMenuOpen ? (
                    <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                  )}
                </button>

                {/* Sub-menu with slide animation */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isVehicleMenuOpen ? "max-h-48" : "max-h-0"
                  }`}
                >
                  <Link href="/vehicle-groups">
                    <SidebarMenuButton className="w-full pl-9">
                      <Database className="w-4 h-4" />
                      <span>Vehicle Groups</span>
                    </SidebarMenuButton>
                  </Link>
                  <Link href="/vehicle-types">
                    <SidebarMenuButton className="w-full pl-9">
                      <Package className="w-4 h-4" />
                      <span>Vehicle Types</span>
                    </SidebarMenuButton>
                  </Link>
                  <Link href="/vehicle-master">
                    <SidebarMenuButton className="w-full pl-9">
                      <Wrench className="w-4 h-4" />
                      <span>Vehicle Master</span>
                    </SidebarMenuButton>
                  </Link>
                </div>
              </div>

              <SidebarMenuItem>
                <LogoutButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-6 pb-16">
          {children}
        </main>
        <Footer />
      </div>
    </SidebarProvider>
  );
}