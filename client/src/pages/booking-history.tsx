import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Booking } from "@shared/schema";
import { BookingType, BookingPurpose, Priority } from "@shared/schema";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Filter, Search } from "lucide-react";
import { BookingForm } from "@/components/booking-form";

function BookingHistoryPage() {
  // Add a state for direct loading
  const [manualBookings, setManualBookings] = useState<Booking[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  
  // Disable React Query for debugging purposes
  const { data: bookings, isLoading, error } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: false // Temporarily disable this query
  });
  
  // Manual fetch on component mount
  useEffect(() => {
    async function loadBookings() {
      try {
        setManualLoading(true);
        
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) {
          console.error("No auth token found! Please login first.");
          return;
        }
        
        console.log("Manually fetching bookings...");
        
        const response = await fetch('/api/bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          return;
        }
        
        const data = await response.json();
        console.log(`Manually loaded ${data.length} bookings`);
        
        // Set data to state
        setManualBookings(data);
      } catch (err) {
        console.error("Manual fetch error:", err);
      } finally {
        setManualLoading(false);
      }
    }
    
    loadBookings();
  }, []);
  
  // Add manual success/error handling 
  if (bookings) {
    console.log("BOOKINGS QUERY SUCCESS - data count:", bookings.length || 0);
    if (bookings.length > 0) {
      console.log("FIRST 3 BOOKINGS:", bookings.slice(0, Math.min(3, bookings.length)));
    }
  }
  
  // Enhanced Debug for bookings data
  console.log("BOOKINGS DATA:", bookings);
  if (error) {
    console.error("BOOKINGS QUERY ERROR:", error);
  }
  
  // Add direct fetch test to check API response
  const testFetchBookings = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.error("No auth token found! Please login first.");
        return;
      }
      
      console.log("Testing direct fetch from /api/bookings...");
      
      const response = await fetch('/api/bookings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const statusText = `API Response Status: ${response.status} ${response.statusText}`;
      console.log(statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        return;
      }
      
      const data = await response.json();
      console.log("DIRECT FETCH DATA:", data);
      console.log(`Found ${data.length} bookings in database`);
      
      // Verify the structure of pickup/dropoff locations 
      if (data.length > 0) {
        const firstBooking = data[0];
        console.log("Sample booking:", firstBooking);
        console.log("Pickup location type:", typeof firstBooking.pickup_location);
        console.log("Dropoff location type:", typeof firstBooking.dropoff_location);
        
        // Check if the locations are formatted correctly
        if (firstBooking.pickup_location && firstBooking.dropoff_location) {
          console.log("Pickup location address:", firstBooking.pickup_location.address);
          console.log("Dropoff location address:", firstBooking.dropoff_location.address);
        } else {
          console.error("Location data is missing or malformatted");
        }
        
        // Check time fields
        console.log("Pickup time:", firstBooking.pickup_time);
        console.log("Dropoff time:", firstBooking.dropoff_time);
      }
    } catch (error) {
      console.error("Test fetch error:", error);
    }
  };
  
  // Run test fetch on page load
  setTimeout(testFetchBookings, 2000);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("history");

  // Calculate filteredBookings from our manual bookings
  const filteredBookings = useMemo(() => {
    if (!manualBookings || !Array.isArray(manualBookings) || manualBookings.length === 0) {
      console.log("No manual bookings data available or not an array");
      return [];
    }
    
    console.log(`Filtering ${manualBookings.length} manual bookings...`);
    
    return manualBookings.filter((booking: Booking) => {
      try {
        // Debug each booking
        console.log(`Checking manual booking: ${booking.id} - ${booking.reference_no}`);
        
        // Check if all required fields exist
        if (!booking.reference_no || !booking.booking_type || !booking.purpose || !booking.priority) {
          console.warn("Booking missing required fields:", booking.id);
          return false;
        }
        
        // Apply filters
        const matchesSearch = booking.reference_no?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
        const matchesType = typeFilter === "all" || booking.booking_type === typeFilter;
        const matchesPurpose = purposeFilter === "all" || booking.purpose === purposeFilter;
        const matchesPriority = priorityFilter === "all" || booking.priority === priorityFilter;
        
        return matchesSearch && matchesType && matchesPurpose && matchesPriority;
      } catch (err) {
        console.error(`Error filtering booking ${booking.id}:`, err);
        return false;
      }
    });
  }, [manualBookings, searchQuery, typeFilter, purposeFilter, priorityFilter]);
  
  // Debug filtered bookings count
  console.log("FILTERED BOOKINGS COUNT:", filteredBookings.length);
  if (filteredBookings.length > 0) {
    console.log("FIRST FILTERED BOOKING:", filteredBookings[0]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/90 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-primary">Transport Management</h2>
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="new">New Booking</TabsTrigger>
              <TabsTrigger value="history">Booking History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new">
            <BookingForm />
          </TabsContent>

          <TabsContent value="history">
            <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl">
              <CardHeader>
                <h3 className="text-lg font-medium text-primary/90">Booking History</h3>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="mb-8 space-y-6">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Filters</h3>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Reference Number</span>
                      </div>
                      <Input
                        placeholder="Search booking reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background/50 backdrop-blur-sm border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="font-medium">Booking Type</span>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {Object.values(BookingType).map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <span className="font-medium">Purpose</span>
                      <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                        <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10">
                          <SelectValue placeholder="All Purposes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Purposes</SelectItem>
                          {Object.values(BookingPurpose).map((purpose) => (
                            <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <span className="font-medium">Priority Level</span>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10">
                          <SelectValue placeholder="All Priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          {Object.values(Priority).map((priority) => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                </div>

                {/* Bookings Table */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-background/40">
                        <TableHead className="text-primary/80">Reference No.</TableHead>
                        <TableHead className="text-primary/80">Type</TableHead>
                        <TableHead className="text-primary/80">Purpose</TableHead>
                        <TableHead className="text-primary/80">Pickup</TableHead>
                        <TableHead className="text-primary/80">Dropoff</TableHead>
                        <TableHead className="text-primary/80">Priority</TableHead>
                        <TableHead className="text-primary/80">Status</TableHead>
                        <TableHead className="text-primary/80">Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="sync">
                        {manualLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center gap-4"
                              >
                                <VehicleLoadingIndicator size="lg" />
                                <div className="text-sm text-muted-foreground">Loading bookings from database...</div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        ) : !manualBookings?.length ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              <div className="space-y-2">
                                <div>No bookings found in database</div>
                                <div className="text-xs opacity-70">Server returned empty bookings list</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : !filteredBookings?.length ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              <div className="space-y-2">
                                <div>No bookings match your filters</div>
                                <div className="text-xs opacity-70">{manualBookings.length} booking(s) available in database</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredBookings?.map((booking) => (
                            <TableRow
                              key={booking.id}
                              className="border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-background/40"
                            >
                              <TableCell className="font-medium">{booking.reference_no}</TableCell>
                              <TableCell className="capitalize">{booking.booking_type}</TableCell>
                              <TableCell>{booking.purpose}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {booking.pickup_location && booking.pickup_location.address 
                                      ? booking.pickup_location.address 
                                      : "Location not specified"}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {booking.pickup_time ? format(new Date(booking.pickup_time), "MMM d, yyyy HH:mm") : "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {booking.dropoff_location && booking.dropoff_location.address 
                                      ? booking.dropoff_location.address 
                                      : "Location not specified"}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {booking.dropoff_time ? format(new Date(booking.dropoff_time), "MMM d, yyyy HH:mm") : "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    booking.priority === Priority.CRITICAL
                                      ? "bg-red-500/20 text-red-500"
                                      : booking.priority === Priority.EMERGENCY
                                      ? "bg-orange-500/20 text-orange-500"
                                      : booking.priority === Priority.HIGH
                                      ? "bg-yellow-500/20 text-yellow-500"
                                      : "bg-green-500/20 text-green-500"
                                  }`}
                                >
                                  {booking.priority}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    booking.status === "Pending for Approval"
                                      ? "bg-yellow-500/20 text-yellow-500"
                                      : booking.status === "COMPLETED"
                                      ? "bg-green-500/20 text-green-500"
                                      : booking.status === "CANCELLED"
                                      ? "bg-red-500/20 text-red-500"
                                      : "bg-blue-500/20 text-blue-500"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {booking.created_at 
                                  ? format(new Date(booking.created_at), "MMM d, yyyy HH:mm") 
                                  : "No date available"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </motion.div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

export default BookingHistoryPage;