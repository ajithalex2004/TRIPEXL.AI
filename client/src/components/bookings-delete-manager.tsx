import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface BookingsDeleteManagerProps {
  bookingsCount: number;
  onDeleteSuccess: () => void;
}

export function BookingsDeleteManager({ bookingsCount, onDeleteSuccess }: BookingsDeleteManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDeleteAllBookings = async () => {
    try {
      setIsLoading(true);
      console.log('Starting delete operation...');
      
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', response.status, errorData);
        throw new Error(`Failed to delete bookings (${response.status})`);
      }

      const result = await response.json();
      console.log('Delete successful:', result);
      
      toast({
        title: "Success",
        description: `${result.deletedCount || bookingsCount} bookings have been deleted.`,
        variant: "default"
      });
      
      onDeleteSuccess();
    } catch (err: any) {
      console.error("Error deleting bookings:", err);
      toast({
        title: "Error Deleting Bookings",
        description: err.message || "Failed to delete bookings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="mb-4">
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive"
            size="sm"
            disabled={bookingsCount === 0 || isLoading}
            className="font-medium"
          >
            {isLoading ? (
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
              This action will permanently delete ALL {bookingsCount} bookings from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllBookings} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete All Bookings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BookingsDeleteManager;