import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleGoogleMap from '@/components/simple-google-map';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const MapTestPage = () => {
  return (
    <div className="container mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Google Maps Test</CardTitle>
          <CardDescription>
            This page tests the Google Maps API integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm mb-4">
              This is a basic map to test if the Google Maps API is working correctly.
              If you see a map below, the API key is valid and properly configured.
            </p>
            
            <SimpleGoogleMap />
            
            <div className="mt-6 flex justify-end">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapTestPage;