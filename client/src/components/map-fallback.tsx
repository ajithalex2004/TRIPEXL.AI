import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MapFallbackProps {
  message?: string;
}

/**
 * A fallback component to display when the Google Maps API fails to load
 */
const MapFallback: React.FC<MapFallbackProps> = ({ 
  message = "Google Maps could not be loaded. Please check your internet connection and API key."
}) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Map Loading Error</AlertTitle>
          <AlertDescription>
            {message}
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 p-10 border-2 border-dashed border-slate-200 rounded-md flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="text-lg font-medium text-slate-700">Map Unavailable</p>
            <p className="text-sm text-slate-500 mt-2">
              The interactive map feature is currently unavailable.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapFallback;