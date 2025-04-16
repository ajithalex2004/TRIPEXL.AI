import React from 'react';
import { Location } from './map-view-new';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UAELocationSearch } from './uae-location-search';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FallbackLocationSelectorProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  onLocationSelect: (location: Location, type: 'pickup' | 'dropoff') => void;
  className?: string;
}

/**
 * This component serves as a fallback when the map cannot be loaded
 * It provides a simpler location selection interface based on UAE locations
 */
export function FallbackLocationSelector({
  pickupLocation,
  dropoffLocation,
  onLocationSelect,
  className = ''
}: FallbackLocationSelectorProps) {
  return (
    <div className={`p-4 ${className}`}>
      <div className="bg-amber-50 p-4 rounded-md mb-6 flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-amber-800 font-medium">Map loading issue</p>
          <p className="text-amber-700 text-sm mt-1">
            The interactive map could not be loaded. Please use the location search below to select your pickup and dropoff locations.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <MapPin className="h-4 w-4 text-green-500 mr-2" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <UAELocationSearch
                placeholder="Search for pickup location..."
                onLocationSelect={(location) => onLocationSelect(location, 'pickup')}
              />
              
              {pickupLocation && (
                <div className="bg-green-50 p-3 rounded-md mt-3">
                  <p className="font-medium text-sm text-green-800">{pickupLocation.name || 'Selected location'}</p>
                  <p className="text-xs text-green-700 mt-1">{pickupLocation.address}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-100 p-0 pl-1"
                    onClick={() => onLocationSelect({
                      ...pickupLocation,
                      coordinates: {
                        lat: 0,
                        lng: 0
                      }
                    }, 'pickup')}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dropoff Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <MapPin className="h-4 w-4 text-red-500 mr-2" />
              Dropoff Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <UAELocationSearch
                placeholder="Search for dropoff location..."
                onLocationSelect={(location) => onLocationSelect(location, 'dropoff')}
              />
              
              {dropoffLocation && (
                <div className="bg-red-50 p-3 rounded-md mt-3">
                  <p className="font-medium text-sm text-red-800">{dropoffLocation.name || 'Selected location'}</p>
                  <p className="text-xs text-red-700 mt-1">{dropoffLocation.address}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 h-7 text-xs text-red-700 hover:text-red-800 hover:bg-red-100 p-0 pl-1"
                    onClick={() => onLocationSelect({
                      ...dropoffLocation,
                      coordinates: {
                        lat: 0,
                        lng: 0
                      }
                    }, 'dropoff')}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Route information */}
      {pickupLocation && dropoffLocation && (
        <div className="mt-6 p-4 border rounded-md bg-blue-50/50">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Selected route:</span> {pickupLocation.name || pickupLocation.address} to {dropoffLocation.name || dropoffLocation.address}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Please proceed with booking. Note that route details and accurate travel time estimates cannot be displayed without the map.
          </p>
        </div>
      )}
    </div>
  );
}

export default FallbackLocationSelector;