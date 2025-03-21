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
import { motion } from "framer-motion";

// Animated icon wrapper component
const AnimatedIcon = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    className={`transition-all duration-300 ${className}`}
    whileHover={{ scale: 1.2, rotate: 360 }}
    whileTap={{ scale: 0.9 }}
  >
    {children}
  </motion.div>
);

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
                    <AnimatedIcon className="text-blue-500">
                      <LayoutDashboard className="w-4 h-4" />
                    </AnimatedIcon>
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/new-booking">
                  <SidebarMenuButton className="w-full">
                    <AnimatedIcon className="text-green-500 animate-pulse">
                      <PlusCircle className="w-4 h-4" />
                    </AnimatedIcon>
                    <span>New Booking</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/bookings">
                  <SidebarMenuButton className="w-full">
                    <AnimatedIcon className="text-purple-500">
                      <History className="w-4 h-4" />
                    </AnimatedIcon>
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
                  <AnimatedIcon className="text-orange-500 mr-2">
                    <Car className="w-4 h-4 transition-transform duration-200" />
                  </AnimatedIcon>
                  <span className="flex-1 text-left">Vehicles</span>
                  <motion.div
                    animate={{ rotate: isVehicleMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isVehicleMenuOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </motion.div>
                </button>

                {/* Sub-menu with slide animation */}
                <motion.div
                  animate={{
                    height: isVehicleMenuOpen ? "auto" : 0,
                    opacity: isVehicleMenuOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Link href="/vehicle-groups">
                    <SidebarMenuButton className="w-full pl-9">
                      <AnimatedIcon className="text-cyan-500">
                        <Database className="w-4 h-4" />
                      </AnimatedIcon>
                      <span>Vehicle Groups</span>
                    </SidebarMenuButton>
                  </Link>
                  <Link href="/vehicle-types">
                    <SidebarMenuButton className="w-full pl-9">
                      <AnimatedIcon className="text-yellow-500">
                        <Package className="w-4 h-4" />
                      </AnimatedIcon>
                      <span>Vehicle Types</span>
                    </SidebarMenuButton>
                  </Link>
                  <Link href="/vehicle-master">
                    <SidebarMenuButton className="w-full pl-9">
                      <AnimatedIcon className="text-red-500">
                        <Wrench className="w-4 h-4" />
                      </AnimatedIcon>
                      <span>Vehicle Master</span>
                    </SidebarMenuButton>
                  </Link>
                </motion.div>
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