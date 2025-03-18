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

export default function BookingHistoryPage() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [purposeFilter, setPurposeFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // Filter logic
  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = booking.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
    const matchesType = booking.bookingType === typeFilter || !typeFilter;
    const matchesPurpose = booking.purpose === purposeFilter || !purposeFilter;
    const matchesPriority = booking.priority === priorityFilter || !priorityFilter;

    return matchesSearch && matchesType && matchesPurpose && matchesPriority;
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Booking History</h2>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Input
                placeholder="Search by reference number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.values(BookingType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={purposeFilter} onValueChange={setPurposeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Purposes</SelectItem>
                {Object.values(BookingPurpose).map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                {Object.values(Priority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bookings Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <LoadingIndicator />
                  </TableCell>
                </TableRow>
              ) : !filteredBookings?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.referenceNo || "-"}</TableCell>
                    <TableCell>{booking.bookingType}</TableCell>
                    <TableCell>{booking.purpose}</TableCell>
                    <TableCell>{booking.priority}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell>
                      {format(new Date(booking.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}