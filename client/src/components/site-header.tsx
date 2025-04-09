import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, 
  Car, 
  ChevronDown, 
  Cog, 
  CreditCard, 
  HelpCircle, 
  Home, 
  LogOut, 
  Menu, 
  MessageSquare, 
  Package,
  LayoutDashboard,
  UserCircle, 
  Users,
  Workflow
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface NavLink {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

const mainNav: NavLink[] = [
  {
    title: "Home",
    href: "/",
    icon: <Home className="h-4 w-4" />
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: <Car className="h-4 w-4" />
  },
  {
    title: "Employees",
    href: "/employees",
    icon: <Users className="h-4 w-4" />
  },
  {
    title: "Workflows",
    href: "/workflows",
    icon: <Workflow className="h-4 w-4" />
  }
];

const bookingLinks: NavLink[] = [
  {
    title: "New Booking",
    href: "/new-booking",
    description: "Create a new transportation booking",
  },
  {
    title: "My Bookings",
    href: "/bookings/my",
    description: "View your booking history and status",
  },
  {
    title: "All Bookings",
    href: "/bookings",
    description: "Manage all transportation bookings",
  },
  {
    title: "Approvals",
    href: "/bookings/approvals",
    description: "Review pending booking approvals",
  }
];

const fleetLinks: NavLink[] = [
  {
    title: "Vehicle Management",
    href: "/fleet/vehicles",
    description: "Manage company vehicles and maintenance",
  },
  {
    title: "Driver Management",
    href: "/fleet/drivers",
    description: "Manage driver schedules and assignments",
  },
  {
    title: "Fleet Analytics",
    href: "/fleet/analytics",
    description: "View fleet performance metrics",
  },
  {
    title: "Vehicle Types",
    href: "/fleet/vehicle-types",
    description: "Configure vehicle categories and types",
  }
];

const adminLinks: NavLink[] = [
  {
    title: "Employee Management",
    href: "/employees",
    description: "Manage employees and permissions",
  },
  {
    title: "Workflow Management",
    href: "/workflows",
    description: "Configure approval flows and processes",
  },
  {
    title: "System Settings",
    href: "/settings",
    description: "Configure system-wide settings",
  },
  {
    title: "Diagnostics",
    href: "/debug",
    description: "View system health and debugging tools",
  }
];

function MobileNav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">TripXL</SheetTitle>
          <SheetDescription className="text-left">
            Enterprise Transportation Management
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Main Navigation</h3>
            <nav className="grid gap-2">
              {mainNav.map((item, index) => (
                <Link key={index} href={item.href}>
                  <a
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Booking Management</h3>
            <nav className="grid gap-2">
              {bookingLinks.map((item, index) => (
                <Link key={index} href={item.href}>
                  <a
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {item.title}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Fleet Management</h3>
            <nav className="grid gap-2">
              {fleetLinks.map((item, index) => (
                <Link key={index} href={item.href}>
                  <a
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {item.title}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          {user?.user_type === 'admin' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Administration</h3>
              <nav className="grid gap-2">
                {adminLinks.map((item, index) => (
                  <Link key={index} href={item.href}>
                    <a
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        location === item.href
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {item.title}
                    </a>
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {user ? (
            <div className="mt-auto border-t pt-4">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          ) : (
            <div className="mt-auto border-t pt-4">
              <Link href="/login">
                <a className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted rounded-md">
                  Login
                </a>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  // Get user's initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    
    if (user.full_name) {
      const names = user.full_name.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    return user.user_name ? user.user_name[0].toUpperCase() : "U";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <MobileNav />
        
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center gap-2">
              <span className="hidden font-bold sm:inline-block">
                TripXL
              </span>
            </a>
          </Link>
        </div>

        <NavigationMenu className="hidden md:flex mx-6">
          <NavigationMenuList>
            {/* Dashboard Menu Item */}
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  active={location === "/"}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* Bookings Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Car className="mr-2 h-4 w-4" />
                <span>Bookings</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  {bookingLinks.map((link) => (
                    <li key={link.title}>
                      <Link href={link.href}>
                        <NavigationMenuLink
                          className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                            location === link.href ? "bg-accent" : ""
                          }`}
                        >
                          <div className="text-sm font-medium leading-none">
                            {link.title}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {link.description}
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Fleet Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Package className="mr-2 h-4 w-4" />
                <span>Fleet</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  {fleetLinks.map((link) => (
                    <li key={link.title}>
                      <Link href={link.href}>
                        <NavigationMenuLink
                          className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                            location === link.href ? "bg-accent" : ""
                          }`}
                        >
                          <div className="text-sm font-medium leading-none">
                            {link.title}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {link.description}
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Admin Menu - Only show for admin users */}
            {user?.user_type === 'admin' && (
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <Cog className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    {adminLinks.map((link) => (
                      <li key={link.title}>
                        <Link href={link.href}>
                          <NavigationMenuLink
                            className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                              location === link.href ? "bg-accent" : ""
                            }`}
                          >
                            <div className="text-sm font-medium leading-none">
                              {link.title}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {link.description}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {user ? (
            <>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No new notifications
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.full_name || user.user_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email_id}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <Cog className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/support">
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Support</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-500 focus:text-red-500"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}