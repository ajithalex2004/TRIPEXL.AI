import { useQuery } from "@tanstack/react-query";
import { Booking } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { BOOKING_STATUS_COLORS } from "@/lib/constants";

export function ScheduleView() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  if (isLoading) {
    return <div>Loading schedule...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Dropoff</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings?.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>#{booking.id}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {booking.pickupLocation.address}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(booking.pickupWindow.start), "PPp")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {booking.dropoffLocation.address}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(booking.dropoffWindow.start), "PPp")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    BOOKING_STATUS_COLORS[booking.status as keyof typeof BOOKING_STATUS_COLORS]
                  } text-white`}
                >
                  {booking.status}
                </span>
              </TableCell>
              <TableCell>
                {format(new Date(booking.createdAt), "PP")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
