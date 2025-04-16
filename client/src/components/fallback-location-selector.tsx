import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Map, Search, Navigation } from 'lucide-react';
import { Location } from './map-view';
import { Label } from '@/components/ui/label';
import { UAE_COMMON_LOCATIONS, UAE_COMMON_LANDMARKS } from '@/lib/uae-locations';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FallbackLocationSelectorProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  onLocationSelect: (location: Location, type: 'pickup' | 'dropoff') => void;
  className?: string;
}

/**
 * A fallback component when Google Maps fails to load
 * Provides a simple interface to select common UAE locations
 */
export function FallbackLocationSelector({
  pickupLocation,
  dropoffLocation,
  onLocationSelect,
  className = '',
}: FallbackLocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationType, setLocationType] = useState<'pickup' | 'dropoff'>('pickup');
  
  // Filter locations based on search query
  const filteredLocations = searchQuery.trim() === '' 
    ? [...UAE_COMMON_LOCATIONS, ...UAE_COMMON_LANDMARKS] 
    : [...UAE_COMMON_LOCATIONS, ...UAE_COMMON_LANDMARKS].filter(
        location => 
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (location.area && location.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (location.city && location.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const handleLocationSelect = (location: any) => {
    // Create a proper Location object based on the selected item
    const locationObj: Location = {
      address: location.area && location.city 
        ? `${location.name}, ${location.area}, ${location.city}, UAE`
        : `${location.name}, UAE`,
      coordinates: {
        lat: location.coordinates?.lat || 25.276987, // Default to Dubai if coordinates not provided
        lng: location.coordinates?.lng || 55.296249
      },
      name: location.name,
      formatted_address: location.area && location.city 
        ? `${location.name}, ${location.area}, ${location.city}, UAE`
        : `${location.name}, UAE`,
      city: location.city,
      area: location.area,
    };
    
    onLocationSelect(locationObj, locationType);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Map className="h-4 w-4" />
          Select Location (Map Fallback Mode)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Location type selector */}
          <div className="flex gap-2 mb-4">
            <Button 
              variant={locationType === 'pickup' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationType('pickup')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Set Pickup Location
            </Button>
            <Button 
              variant={locationType === 'dropoff' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationType('dropoff')}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Set Dropoff Location
            </Button>
          </div>
          
          {/* Current selections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="border rounded-md p-3">
              <Label className="text-sm text-muted-foreground mb-1 block">Pickup Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium truncate">
                  {pickupLocation?.address || 'Not set'}
                </span>
              </div>
            </div>
            <div className="border rounded-md p-3">
              <Label className="text-sm text-muted-foreground mb-1 block">Dropoff Location</Label>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium truncate">
                  {dropoffLocation?.address || 'Not set'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search for a location in UAE..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Location list */}
          <div className="border rounded-md">
            <ScrollArea className="h-[300px]">
              <div className="p-1">
                {filteredLocations.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No locations found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredLocations.map((location, index) => (
                      <div 
                        key={`${location.name}-${index}`}
                        className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => handleLocationSelect(location)}
                      >
                        {location.area ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{location.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {location.area}, {location.city}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span>{location.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Map functionality is currently limited. Using simplified location selection.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}