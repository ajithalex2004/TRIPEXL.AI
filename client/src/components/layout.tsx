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
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {isLoading && <LoadingPage />}
        <div className="flex flex-1">
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

                <div className="mt-auto">
                  <LogoutButton 
                    className="w-full text-white hover:bg-white/10 text-[15px] font-bold"
                    onClick={() => {
                      localStorage.removeItem("token");
                      window.location.href = "/auth/login";
                    }}
                  />
                </div>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <div className="flex-1 flex flex-col overflow-auto">
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}