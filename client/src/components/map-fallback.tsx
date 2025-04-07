import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, MapPin, ArrowRight, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

interface MapFallbackProps {
  message?: string;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  waypoints?: Location[];
  onSelectPickup?: () => void;
  onSelectDropoff?: () => void;
}

/**
 * A simplified fallback component to display when the Google Maps API fails to load
 */
const MapFallback: React.FC<MapFallbackProps> = ({ 
  message = "Using a simplified map view for route planning. All trip functionality is still available.",
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onSelectPickup,
  onSelectDropoff
}) => {
  // This is a much simpler version that doesn't rely on Google Maps API
  // Instead, it shows address information in a clean UI

  // Calculate straight-line distance between pickup and dropoff if both exist
  const calculateDistance = () => {
    if (pickupLocation?.coordinates && dropoffLocation?.coordinates) {
      const R = 6371; // Earth's radius in km
      const dLat = (dropoffLocation.coordinates.lat - pickupLocation.coordinates.lat) * Math.PI / 180;
      const dLon = (dropoffLocation.coordinates.lng - pickupLocation.coordinates.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pickupLocation.coordinates.lat * Math.PI / 180) * Math.cos(dropoffLocation.coordinates.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in km
      
      return distance < 1 ? 
        `${Math.round(distance * 1000)} m` : 
        `${distance.toFixed(1)} km`;
    }
    return null;
  };
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Map Information</AlertTitle>
          <AlertDescription>
            {message}
          </AlertDescription>
        </Alert>
        
        <div className="relative border rounded-md p-5 bg-slate-50 h-[400px] overflow-auto">
          <div className="space-y-4">
            {/* Beginning location */}
            {pickupLocation ? (
              <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Pickup Location</h3>
                  <p className="text-sm text-slate-500 break-all">{pickupLocation.address}</p>
                  <div className="mt-1 text-xs text-slate-400">
                    {pickupLocation.coordinates.lat.toFixed(6)}, {pickupLocation.coordinates.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border-2 border-dashed border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-slate-100 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-slate-400">No Pickup Location</h3>
                    <p className="text-xs text-slate-400">Select a pickup location to begin</p>
                  </div>
                </div>
                {onSelectPickup && (
                  <Button size="sm" onClick={onSelectPickup} variant="outline">
                    <MapPin className="mr-1 h-4 w-4 text-green-600" />
                    Set Pickup
                  </Button>
                )}
              </div>
            )}
            
            {/* Waypoints */}
            {waypoints.length > 0 && (
              <div className="pl-8">
                {waypoints.map((waypoint, index) => (
                  <div key={index} className="relative mb-2">
                    <div className="absolute top-0 left-[-25px] bottom-0 border-l-2 border-dashed border-blue-300"></div>
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                        <Navigation className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">Stop {index + 1}</h3>
                        <p className="text-sm text-slate-500 break-all">{waypoint.address}</p>
                        <div className="mt-1 text-xs text-slate-400">
                          {waypoint.coordinates.lat.toFixed(6)}, {waypoint.coordinates.lng.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Waypoint connector with distance information */}
            {pickupLocation && dropoffLocation && (
              <div className="relative flex flex-col items-center my-2 py-4">
                <div className="border-l-2 border-dashed border-slate-300 h-8 absolute top-0 bottom-0 z-0"></div>
                {calculateDistance() && (
                  <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-medium z-10">
                    <ArrowRight className="inline h-3 w-3 mr-1" />
                    Estimated distance: {calculateDistance()}
                  </div>
                )}
              </div>
            )}
            
            {/* Ending location */}
            {dropoffLocation ? (
              <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Dropoff Location</h3>
                  <p className="text-sm text-slate-500 break-all">{dropoffLocation.address}</p>
                  <div className="mt-1 text-xs text-slate-400">
                    {dropoffLocation.coordinates.lat.toFixed(6)}, {dropoffLocation.coordinates.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border-2 border-dashed border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-slate-100 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-slate-400">No Dropoff Location</h3>
                    <p className="text-xs text-slate-400">Select a dropoff location to continue</p>
                  </div>
                </div>
                {onSelectDropoff && (
                  <Button size="sm" onClick={onSelectDropoff} variant="outline">
                    <MapPin className="mr-1 h-4 w-4 text-red-600" />
                    Set Dropoff
                  </Button>
                )}
              </div>
            )}
            
            {/* If no locations are set, show a message */}
            {!pickupLocation && !dropoffLocation && !waypoints.length && (
              <div className="text-center p-10">
                <div className="mx-auto w-16 h-16 mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700">No Route Selected</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Select a pickup and dropoff location to create a route.
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  {onSelectPickup && (
                    <Button size="sm" onClick={onSelectPickup} variant="outline">
                      <MapPin className="mr-1 h-4 w-4 text-green-600" />
                      Set Pickup
                    </Button>
                  )}
                  {onSelectDropoff && (
                    <Button size="sm" onClick={onSelectDropoff} variant="outline">
                      <MapPin className="mr-1 h-4 w-4 text-red-600" />
                      Set Dropoff
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-xs text-slate-500">
          <p>This is a simplified map view. Actual routes and distances may vary.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapFallback;