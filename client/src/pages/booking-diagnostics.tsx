import React from "react";
import { BookingDiagnosticTool } from "@/components/ui/booking-diagnostic-tool";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function BookingDiagnosticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Booking System Diagnostics</h1>
        <Link href="/booking-history">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Bookings
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          This page provides diagnostic tools to help identify and resolve issues with the booking system.
          Run tests to verify authentication, payload validation, and database operations.
        </p>

        <div className="bg-muted p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-2">How to use this tool</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Select the type of test you want to run (Authentication, Payload, Database, or Advanced)</li>
            <li>Configure test parameters in the "Configure Test" tab if needed</li>
            <li>Run the test and review the results</li>
            <li>If any issues are detected, expand the failed stages for detailed information</li>
          </ol>
        </div>

        <BookingDiagnosticTool />
      </div>
    </div>
  );
}