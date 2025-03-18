import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MOCK_LOCATIONS } from "@/lib/constants";

export function BookingForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(insertBookingSchema),
    defaultValues: {
      pickupLocation: MOCK_LOCATIONS[0],
      dropoffLocation: MOCK_LOCATIONS[1],
      pickupWindow: {
        start: "",
        end: ""
      },
      dropoffWindow: {
        start: "",
        end: ""
      },
      loadSize: 0,
      status: "pending"
    }
  });

  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">New Booking</h2>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createBooking.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="pickupWindow.start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pickupWindow.end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loadSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Size (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? "Creating..." : "Create Booking"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
