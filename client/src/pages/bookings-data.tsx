import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Define Booking type
interface Booking {
  id: number;
  employee_id: number | null;
  booking_type: string;
  purpose: string;
  priority: string;
  cargo_type: string | null;
  num_boxes: number | null;
  weight: number | null;
  box_size: string | null;
  trip_type: string | null;
  num_passengers: number | null;
  with_driver: boolean;
  booking_for_self: boolean;
  passenger_details: any | null;
  pickup_location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  dropoff_location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  waypoints: any[];
  pickup_time: string | null;
  dropoff_time: string | null;
  reference_no: string;
  remarks: string | null;
  status: string;
  assigned_vehicle_id: number | null;
  assigned_driver_id: number | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  total_distance: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  co2_emissions: number | null;
  rating: number | null;
  feedback: string | null;
}

export function BookingsData() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Sort bookings by created_at date, newest first
      const sortedBookings = data.sort((a: Booking, b: Booking) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBookings(sortedBookings);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllBookings = async () => {
    try {
      setDeleteLoading(true);
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/bookings/delete-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete bookings: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `${result.deletedCount} bookings have been deleted.`,
        variant: "default"
      });
      
      // Refresh the bookings list
      setBookings([]);
    } catch (err: any) {
      console.error("Error deleting bookings:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete bookings",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
      setAlertOpen(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-500">Assigned</Badge>;
      case 'in-progress':
        return <Badge className="bg-purple-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Not set";
    try {
      return format(new Date(dateTime), "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateTime;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookings Data</CardTitle>
          <CardDescription>Loading bookings from database...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Bookings</CardTitle>
          <CardDescription>Could not retrieve bookings from the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Database Bookings</CardTitle>
            <CardDescription>Showing all {bookings.length} bookings sorted by creation date (newest first)</CardDescription>
          </div>
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={bookings.length === 0 || deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete All Bookings"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete ALL {bookings.length} bookings from the database. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllBookings} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Delete All Bookings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[70vh]">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found in the database.
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Dropoff</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.id}</TableCell>
                    <TableCell>{booking.reference_no}</TableCell>
                    <TableCell className="capitalize">{booking.booking_type}</TableCell>
                    <TableCell>{booking.purpose}</TableCell>
                    <TableCell>{booking.employee_id || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{booking.pickup_location?.address || "N/A"}</TableCell>
                    <TableCell>{booking.dropoff_location?.address || "N/A"}</TableCell>
                    <TableCell>{formatDateTime(booking.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BookingsData;