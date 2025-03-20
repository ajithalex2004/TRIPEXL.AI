import * as React from "react";
import { Link } from "wouter";
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
import { History, Database } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const openVehicleGroups = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      "/vehicle-groups",
      "VehicleGroups",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen relative">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/bookings">
                  <SidebarMenuButton className="w-full">
                    <History className="w-4 h-4" />
                    <span>Booking History</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full" onClick={openVehicleGroups}>
                  <Database className="w-4 h-4" />
                  <span>Vehicle Groups</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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