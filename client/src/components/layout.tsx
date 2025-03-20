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
    window.open("/vehicle-groups", "_blank", "width=1200,height=800");
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