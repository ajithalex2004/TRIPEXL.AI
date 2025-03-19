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
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import type { Booking } from "@shared/schema";
import { BookingType, BookingPurpose, Priority } from "@shared/schema";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function BookingHistoryPage() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Filter logic
  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = booking.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
    const matchesType = typeFilter === "all" || booking.bookingType === typeFilter;
    const matchesPurpose = purposeFilter === "all" || booking.purpose === purposeFilter;
    const matchesPriority = priorityFilter === "all" || booking.priority === priorityFilter;

    return matchesSearch && matchesType && matchesPurpose && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/90 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl">
          <CardHeader>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
              Booking History
            </h2>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
              <div className="relative">
                <Input
                  placeholder="Search by reference number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background/50 backdrop-blur-sm border-white/10 transition-all duration-200 hover:bg-background/70 focus:bg-background/70"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10 transition-all duration-200 hover:bg-background/70">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(BookingType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10 transition-all duration-200 hover:bg-background/70">
                  <SelectValue placeholder="Filter by purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purposes</SelectItem>
                  {Object.values(BookingPurpose).map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {purpose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10 transition-all duration-200 hover:bg-background/70">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.values(Priority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

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
                    <TableHead className="text-primary/80">Priority</TableHead>
                    <TableHead className="text-primary/80">Status</TableHead>
                    <TableHead className="text-primary/80">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <LoadingIndicator />
                        </TableCell>
                      </TableRow>
                    ) : !filteredBookings?.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings?.map((booking) => (
                        <motion.tr
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-background/40"
                        >
                          <TableCell className="font-medium">{booking.referenceNo || "-"}</TableCell>
                          <TableCell>{booking.bookingType}</TableCell>
                          <TableCell>{booking.purpose}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              booking.priority === Priority.CRITICAL
                                ? "bg-red-500/20 text-red-500"
                                : booking.priority === Priority.EMERGENCY
                                ? "bg-orange-500/20 text-orange-500"
                                : booking.priority === Priority.HIGH
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-green-500/20 text-green-500"
                            }`}>
                              {booking.priority}
                            </span>
                          </TableCell>
                          <TableCell>{booking.status}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(booking.createdAt), "MMM d, yyyy HH:mm")}
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default BookingHistoryPage;