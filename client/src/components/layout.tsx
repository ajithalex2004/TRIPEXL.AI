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
import { LoadingPage } from "@/components/loading-page";
import { PageTransition } from "@/components/page-transition";
import { AnimatePresence } from "framer-motion";
import {
  History,
  Car,
  Package,
  Wrench,
  Database,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  LayoutDashboard,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

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

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [location]);

  const isLoginPage = location === "/auth/login";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {isLoading && <LoadingPage />}
        <div className="flex flex-1">
          {!isLoginPage && (
            <Sidebar className="bg-gradient-to-b from-[#004990] via-[#0066cc] to-[#ffffff] border-r border-white/10">
              <SidebarHeader className="border-b border-white/10">
                <Logo className="text-white" />
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Link href="/">
                      <SidebarMenuButton className="w-full text-white hover:bg-white/10 text-[15px] font-bold">
                        <AnimatedIcon className="text-white">
                          <LayoutDashboard className="w-4 h-4" />
                        </AnimatedIcon>
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <Link href="/new-booking">
                      <SidebarMenuButton className="w-full text-white hover:bg-white/10 text-[15px] font-bold">
                        <AnimatedIcon className="text-[#EF3340] animate-pulse">
                          <PlusCircle className="w-4 h-4" />
                        </AnimatedIcon>
                        <span>New Booking</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>

                  {/* Add User Management menu item */}
                  <SidebarMenuItem>
                    <Link href="/users">
                      <SidebarMenuButton className="w-full text-white hover:bg-white/10 text-[15px] font-bold">
                        <AnimatedIcon className="text-white">
                          <Users className="w-4 h-4" />
                        </AnimatedIcon>
                        <span>User Management</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <Link href="/bookings">
                      <SidebarMenuButton className="w-full text-white hover:bg-white/10 text-[15px] font-bold">
                        <AnimatedIcon className="text-white">
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
                      className="w-full flex items-center px-3 py-2 text-[15px] font-bold rounded-md text-white hover:bg-white/10 transition-colors"
                    >
                      <AnimatedIcon className="text-[#EF3340] mr-2">
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
                        <SidebarMenuButton className="w-full pl-9 text-white/90 hover:bg-white/10 text-[15px] font-bold">
                          <AnimatedIcon className="text-white">
                            <Database className="w-4 h-4" />
                          </AnimatedIcon>
                          <span>Vehicle Groups</span>
                        </SidebarMenuButton>
                      </Link>
                      <Link href="/vehicle-types">
                        <SidebarMenuButton className="w-full pl-9 text-white/90 hover:bg-white/10 text-[15px] font-bold">
                          <AnimatedIcon className="text-white">
                            <Package className="w-4 h-4" />
                          </AnimatedIcon>
                          <span>Vehicle Types</span>
                        </SidebarMenuButton>
                      </Link>
                      <Link href="/vehicle-master">
                        <SidebarMenuButton className="w-full pl-9 text-white/90 hover:bg-white/10 text-[15px] font-bold">
                          <AnimatedIcon className="text-white">
                            <Wrench className="w-4 h-4" />
                          </AnimatedIcon>
                          <span>Vehicle Master</span>
                        </SidebarMenuButton>
                      </Link>
                    </motion.div>
                  </div>

                  <SidebarMenuItem>
                    <LogoutButton className="text-white hover:bg-white/10 text-[15px] font-bold" />
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
          )}
          <div className="flex-1 flex flex-col">
            <main className="flex-1 pb-16">
              <AnimatePresence mode="wait">
                <PageTransition key={location}>
                  {children}
                </PageTransition>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}