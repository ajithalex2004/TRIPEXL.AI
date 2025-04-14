import React from 'react';
import { BookingDebugTest } from '@/components/booking-debug-test';

export default function BookingDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Booking System Debugging</h1>
      <p className="mb-6 text-muted-foreground">Use these tools to test and diagnose the booking system.</p>
      
      <BookingDebugTest />
    </div>
  );
}