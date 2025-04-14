import React from "react";
import { BookingDiagnosticTool } from "@/components/ui/booking-diagnostic-tool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

export default function BookingDiagnosticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Booking Diagnostics</h1>
        <div className="flex space-x-4">
          <Link href="/booking">
            <Button variant="outline">Go to Booking</Button>
          </Link>
          <Link href="/booking-history">
            <Button variant="outline">Booking History</Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <BookingDiagnosticTool />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Technical details for troubleshooting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <p className="text-sm mb-2"><span className="font-semibold">Environment:</span> {import.meta.env.MODE}</p>
                <p className="text-sm mb-2"><span className="font-semibold">API Base URL:</span> {window.location.origin}</p>
                <p className="text-sm mb-4"><span className="font-semibold">Authenticated:</span> {localStorage.getItem('auth_token') ? 'Yes' : 'No'}</p>
                
                <Separator className="my-4" />
                
                <h3 className="text-sm font-semibold mb-2">Common Issues:</h3>
                <ul className="text-sm space-y-2">
                  <li>• <span className="font-medium">Authentication:</span> Make sure you're logged in with a valid token</li>
                  <li>• <span className="font-medium">Data Format:</span> Ensure all booking fields match the schema</li>
                  <li>• <span className="font-medium">Employee ID:</span> Verify employee ID exists and is numeric</li>
                  <li>• <span className="font-medium">Locations:</span> Both pickup and dropoff locations must include address and coordinates</li>
                </ul>
                
                <Separator className="my-4" />
                
                <h3 className="text-sm font-semibold mb-2">Token Information:</h3>
                <p className="text-xs text-gray-600 break-all">
                  {localStorage.getItem('auth_token') 
                    ? localStorage.getItem('auth_token')?.substring(0, 20) + '...' 
                    : 'No token found'}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Developer Tools</CardTitle>
              <CardDescription>
                Additional diagnostic resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => window.open('/api/health', '_blank')}
                className="w-full justify-start"
              >
                Check API Health
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open('/api/booking-debug', '_blank')}
                className="w-full justify-start"
              >
                Booking Debug Info
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  window.location.href = '/login';
                }}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear Auth & Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}